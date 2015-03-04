/*
*	This document contains the calls to the Trello API
*	Created by : 	Isaac Ouellet Therrien
*	Created on : 	24/02/2015
*	Contributors :	Benoit St-André
*	Last modified: 	04/03/2015
*/
var $dictStates = {};
var $dictBoards = {};
var $dictMembers = {};
var $removedMembers = {};
var $removedType = {};
var isWritten = false;
/*Once the page is ready to execute something*/
$(document).ready(function(){
	/*We get the config file*/
	//The configuration is, for now, manual.
	$.getScript("config/config.js").fail(function(){
		alert("You do not have a configuration file. You can create one with the following information:\nvar defaultLoad = ['type','name'];\nReplace type with board or state\nreplace name with the name of what you want to load.");
	});
	
	/*Taken from Trello's exemple*/
	updateLoggedIn;

	var onAuthorize = function() {
		updateLoggedIn();
		$("#output").empty();
		
		Trello.members.get("me", function(member){
			$("#fullName").text(member.fullName);
		});
			
			//Fills up the dictStates and dictBoards
			//Get all the boards the current user has access to
			$.when(Trello.get("members/me/boards", function(boards) {
				$.each(boards, function(ix, board) {
					if(board.name != "Welcome Board"){
						$dictBoards[board.name] = board.id;
						//Get all the lists the user has access to
						Trello.boards.get(board.id, {lists:"open"}, function(states){
							$.each(states.lists, function(ic, list){
								//Throw away the lists that are in "Done" state
								if(list.name.indexOf("Done")== -1){
									$dictStates[list.name] = list.name;
								}
							});
							write();
						}); 
					}
				});
			}));
		
	};

	function write(){
		$("#boards").empty();
		$("#state").empty();
		//Show the menu with the Board Name
		for (board in $dictBoards){
			$board = $("<li>")
			.attr({id:board, onclick:"loadBoardRemove('"+board+"')"})
			.appendTo("#boards");
			$board = $("<a>")
			.attr({href:"#"})
			.text(board)
			.appendTo(document.getElementById(board));
		}
		//Show the menu with the List Name aka State
		for (state in $dictStates){
			$state = $("<li>")
			.attr({id:state, onclick:"loadStateRemove('"+state+"')"})
			.appendTo("#state");
			$state = $("<a>")
			.attr({href:"#"})
			.text(state)
			.appendTo(document.getElementById(state));
		}
		loadDefault();
	}
	var updateLoggedIn = function() {
		var isLoggedIn = Trello.authorized();
		$(".loggedout").toggle(!isLoggedIn);
		$(".loggedin").toggle(isLoggedIn);        
	};
		
	var logout = function() {
		Trello.deauthorize();
		updateLoggedIn();
	};
							  
	Trello.authorize({
		interactive:false,
		success: onAuthorize
	});

	$("#connectLink").click(function(){
		Trello.authorize({
			type: "popup",
			name: "SuperMetaBoard",
			success: onAuthorize
		})
	});
		
	$("#disconnect").click(logout);
	/*Taken from Trello's exemple finish*/

});

/*Loads the thing we want to see first from config.js*/
function loadDefault(){
	//Make sure the removed list are empty
	deleteRemovedMembers();
	deleteRemovedType();
	//Make sure we haven't done that already
	if(!isWritten){
		//If we want a state, we loadState with its name
		if(defaultLoad[0]=="state"){
			loadState(defaultLoad[1]);
		}else{
			//If we want a board, we loadBoard with its name
			loadBoard(defaultLoad[1]);
		}
		//We've done it
		isWritten = true;
	}
}
/*Loads all the cards of all the lists (aka states) in the selected board*/
function loadBoard(id){
	//Clear according to the change we've done
	cleanContent(id);
	//Adds a button so we can reload without clearing the config
	$button = $("<button>").attr({type:"button", id:"reloadButton", onclick:"loadBoard('"+id+"')"}).text("Reload this board").appendTo("#filter");
	//Adds the configuration of the board that have the current list name
	$("#typeShowText").text("Show the lists that are present");
	//Show the title of which board we load
	$board = $("<div>").attr({id:id+"boardTitleId",class:"boardTitle"}).text(id).appendTo("#content");
	//Get the current board Id
	boardId = $dictBoards[id];
	//Get all the list of lists the board currently has
	Trello.boards.get(boardId, {lists:"open"}, function(states){
		//Adds a link (Trello logo) to the board in Trello
		$link = $("<a>").attr({href:states.url, target:"_blank"}).appendTo("#"+id+"boardTitleId");
		//Adds the Trello logo as link
		$trelloLogo = $("<img>").attr({src:"https://s3.amazonaws.com/trello/images/og/trello-icon.png", title:"View "+board.name+" board in Trello", class:"trelloLogo"}).appendTo($link);
		//For all the lists, we have to check if we can show it, and show the card it has
		$.each(states.lists, function(ic, list){
			//Throw away the list that we cannot show
			if(canShowListName(list.name)){
				//Make sure it's not a list that has been removed
				if(!(list.id in $removedType)){
					//Add a list to the content
					$list = $("<div>").attr({id:list.id, class:"list", style:"display:none;"}).appendTo("#content");
					//Add the name of the said list to content
					$state = $("<div>").attr({id:list+"State", class:"state"}).text(list.name).appendTo($list);
					//Add the cards to the list
					getCards(list,list);
				}
				//And what about updating the filter too?
				//If the list hasn't already been added we add it
				if(document.getElementById(list.id+"Select") == null){
					//Add a name in the filter
					$menuListName = $("<div>").attr({id:list.id+"Filter", style:"display:none;", class:"check"}).text(list.name + " ").appendTo("#type");
					//Add a checkbox, so we can exclude or include the list
					$menuList = $("<input>").attr({id:list.id+"Select", type:"checkbox", value:list.id, checked:true, onclick:"changeType('"+list.id+"')"}).text(list.name).appendTo($menuListName);
				}
			}
		});
	}); 
}

/*Loads all the cards of all the boards that have the selected list name (aka state)*/
function loadState(id){
	//Clear according to the change we've done
	cleanContent(id);
	//Adds a button so we can reload without clearing the config
	$button = $("<button>").attr({type:"button", id:"reloadButton", onclick:"loadState('"+id+"')"}).text("Reload this board").appendTo("#filter");
	//Adds the configuration of the board that have the current list name
	$("#typeShowText").text("Show the boards that are present");
	//Show the title of which list we load
	$state = $("<div>").attr({class:"stateTitle"}).text(id).appendTo("#content");
	//Get the name of the list we want to show
	listName = $dictStates[id];
	//As we do not have something we can ask Trello directly we, we need to start from scratch
	//Gets all the boards the current user can view
	Trello.members.get("me", function (me){
		//We go all around his boards to make sure we do not miss a list
		for(posBoard in me.idBoards){
			//Get all the list of lists the board currently has
			Trello.boards.get(me.idBoards[posBoard], {lists:"open"}, function(board){
				if(!(board.id in $removedType)){
					//On all the lists in the current board
					for(temp in board.lists){
						//Check if the list we have right now has the same name as the one we're asking for
						if(board.lists[temp].name == listName){
							//We might be able to show the current board
							//We add its HTML, but hide it
							$board = $("<div>").attr({id:board.id, class:"board", style:"display:none;"}).appendTo("#content");
							//Add its name
							$boardName = $("<div>").attr({id:board.id+"Board", class:"state"}).text(board.name).appendTo($board);
							//Add its link to Trello
							$link = $("<a>").attr({href:board.url, target:"_blank"}).appendTo($boardName);
							//Trello logo as clickable link
							$trelloLogo = $("<img>").attr({src:"https://s3.amazonaws.com/trello/images/og/trello-icon.png", title:"View "+board.name+" board in Trello", class:"trelloLogo"}).appendTo($link);
							//And what about updating the filter too?
							//If the board hasn't already been added we add it
							if(document.getElementById(board.id+"Select") == null){
								//Add a name in the filter
								if($.isEmptyObject($removedType)){
									$menuBoardName = $("<div>").attr({id:board.id+"Filter", class:"check"}).text(board.name + " ").appendTo("#type");
								}else{
									$menuBoardName = $("<div>").attr({id:board.id+"Filter", style:"display:none;", class:"check"}).text(board.name + " ").appendTo("#type");
								}
								//Add a checkbox, so we can exclude or include the board
								$menuBoard = $("<input>").attr({id:board.id+"Select", type:"checkbox", value:board.id, checked:true, onclick:"changeType('"+board.id+"')"}).text(board.name).appendTo($menuBoardName);
							}
						}
					}
					//Once everything's set we loop again on all the lists to show'em
					$.each(board.lists, function(ic, list){
						//Throw away the lists that we cannot show, also we make sure that it's actually the list we want!
						if(canShowListName(list.name) && list.name == listName){
							//Get the list of the current cards in the list
							getCards(list,board);
						}
					});
				}
			}); 
		}
	});
}

/*Currently drops the list that contains the name "Done" -- To be updated in config*/
function canShowListName(name){
	//If the world "Done" is found, it'll return it's begining index, which will always be above -1
	 return name.indexOf("Done") == -1;
}
function cleanContent(id){
	//Remove everything inside the content div
	$("#content").empty();
	//Makes sure we can update the config div, and does it
	if($.isEmptyObject($removedMembers)){
		$("#user").empty();
	}
	if($.isEmptyObject($removedType)){
		$("#type").empty();
	}
	//Make sure we do not already have a reload button
	$("#reloadButton").remove();
}

//Gets all the cards of the current list
function getCards(list, type){
	//Get the list of the current cards in the list
	Trello.lists.get(list.id, {cards:"open"},function (list){
		//Add all the cards in a dictionary
		$.each(list.cards, function(iy, card){
			//Add all the cards according to the filter we've setted
			addCards(card, type);
		});
	});
}

//Add all the cards we can
function addCards(card, type){
	//If the list of removedMembers is empty, we can show everything
	if($.isEmptyObject($removedMembers)){
		//Show the board or state
		document.getElementById(type.id).style.display = "block";
		//Show the current card
		$card = $("<div>").attr({id:card.id, class:"card"}).appendTo(document.getElementById(type.id));
	//If it's not empty, then we might be able to show the current card
	}else{
		//Getting ready to show the card
		$card = $("<div>").attr({id:card.id, class:"card", style:"display:none"}).appendTo(document.getElementById(type.id));
	}
	//Add a title to the card we might be showing
	$title = $("<div>").attr({id:card.id+"Title", class:"title", onclick:"show('"+card.id+"')"}).text(card.name).appendTo($card);
	
	//If the current card as a description, we can add it
	if(card.desc != ""){
		//We add a "+" to show the user it has a description
		$plus = $("<span>").attr({id:card.id+"plus"}).text(" +").appendTo($title);
		//We add the description
		$content = $("<div>").attr({id:card.id+"Content", class:"cardContent"}).text(card.desc).appendTo($card);
	}
	//We add a link to the card, so we can check it out in Trello
	$linkCard = $("<a>").attr({href:card.url, target:"_blank"}).appendTo($title);
	//The famous Trello logo as link to Trello
	$trelloLogoCard = $("<img>").attr({src:"https://s3.amazonaws.com/trello/images/og/trello-icon.png", title:"View this card in Trello", class:"trelloLogo"}).appendTo($linkCard);
	//If the card as member
	if(card.idMembers != ""){
		//Get the list of all members of the current card
		$members = $("<div>").attr({id:card.id+"Members",class:"members"}).appendTo(document.getElementById(card.id));
		//If the all the members of the card has been removed, we do not show it
		var count = -1;
		var pos = -1;
		var canShow = true;
		//Go on all the members in the current card to make sure they aren't ALL deleted in the filtering
		for(pos in card.idMembers){
			//If we can find the current member in the list of removedMemebrs, then we up the counter
			if(card.idMembers[pos] in $removedMembers){
				count++;
			}
		}
		//If we found as many member removed than there were member on the card, we cannot show that card.
		if(count == pos){canShow = false}
		//If we can show the card, we show it :)
		if(canShow){
			//For all the members in the current card
			for(pos in card.idMembers){
				//We show the card that we had already prepared
				$card.attr({style:"display:block"});
				//We also make sure the board or list is shown
				document.getElementById(type.id).style.display = "block";
				//Shown also in the config
				document.getElementById(type.id+"Filter").style.display = "block";
				//We get all the information of the current member
				Trello.members.get(card.idMembers[pos], function(member){
					//We add a place for this member
					$member = $("<div>").attr({id:member.id, class:"member"}).appendTo(document.getElementById(card.id+"Members"));
					//We add a link to the member's profile
					$linkMember = $("<a>").attr({href:member.url, target:"_blank", class:"linkMember"}).appendTo($member);
					//We check if the member has an avatar or not
					if(member.avatarHash == "" || member.avatarHash == null){
						//Member doesn't have an avatar, we add his initials
						$avatar = $("<div>").attr({id:member.id+"Avatar", class:"initials"}).text(member.initials).appendTo($linkMember);
					}else{
						//Member have an avatar, we show it
						$avatar = $("<img>").attr({id:member.id+"Avatar", class:"avatar", title:member.username,src:"https://trello-avatars.s3.amazonaws.com/"+member.avatarHash+"/30.png"}).appendTo($linkMember);
					}

					//And what about updating the filter too?
					//If the user hasn't already been added we add it
					if(document.getElementById(member.id+"Select") == null){
						//Add a name in the filter
						$menuMemberName = $("<div>").attr({class:"check"}).text(member.fullName + " ").appendTo("#user");
						//Add a checkbox, so we can exclude or include the member
						$menuMember = $("<input>").attr({id:member.id+"Select", type:"checkbox", value:member.id, checked:true, onclick:"changeMember('"+member.id+"')"}).text(member.fullName).appendTo($menuMemberName);
					}
				});


			}
		}
	}
}

//Load from the boards' main menu
function loadBoardRemove(id){
	//Delete every single item from the removed lists
	deleteRemovedMembers();
	deleteRemovedType();
	//Load the board as new
	loadBoard(id);
}

//We MUST make sure that the removedType list is totaly EMPTY
function deleteRemovedType(){
	//Delete every single item from the removedMember list
	for(i in $removedType){
		delete $removedType[i];
	}
}

//We MUST make sure that the removedMember list is totaly EMPTY
function deleteRemovedMembers(){
	//Delete every single item from the removedMember list
	for(i in $removedMembers){
		delete $removedMembers[i];
	}
}

//Load from the lists' main menu
function loadStateRemove(id){
	//Delete every single item from the removed lists
	deleteRemovedMembers();
	deleteRemovedType();
	//Load the state as new
	loadState(id);
}

//Update the status of the member
function changeMember(id){
	//If the member already exist, then it has been checked back, so we need to remove it
	if($removedMembers[id]){
		delete $removedMembers[id];
	}else{
		//If the member doesn't exist, then it has been checked out, so we want to add it to the RemovedList
		$removedMembers[id] = id;
	}
}

//Update the status of the type
function changeType(id){
	//If the type already exist, then it has been checked back, so we need to remove it
	if($removedType[id]){
		delete $removedType[id];
	}else{
		//If the type doesn't exist, then it has been checked out, so we want to add it to the RemovedList
		$removedType[id] = id;
	}
}

//We want to show/hide the content of a card
function show(id){
	doc = document.getElementById(id+"Content");
	plus = document.getElementById(id+"plus");
	showThis(doc,plus);
}

//We want to show/hide the content of the config
function showConfig(id){
	doc = document.getElementById(id.id.replace(/Show/g, ''));
	plus = document.getElementById(id.id+"Plus");
	showThis(doc, plus);
}

//show/hide whatever we requested for
function showThis(doc, plus){
	//If its hidden, then show it
	if(doc.style.display == "none" || doc.style.display == ""){
		doc.style.display="block";
		//Make sure we have some space
		doc.style.minHeight = "30px";
		plus.innerHTML = " -"
	//If it's shown, then hide it
	}else{
		doc.style.display="none";
		doc.style.minHeight = "";
		plus.innerHTML = " +"
	}
}