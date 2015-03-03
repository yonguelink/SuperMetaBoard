/*
*	This document contains the calls to the Trello API
*	Created by : 	Isaac Ouellet Therrien
*	Created on : 	24/02/2015
*	Contributors :	Benoit St-André
*	Last modified: 	02/03/2015
*/
var $dictStates = {};
var $dictBoards = {};
var $dictMembers = {};
var $removedMembers = {};
var isWritten = false;
$(document).ready(function(){
	//The configuration is, for now, manual.
	$.getScript("config/config.js").fail(function(){
		alert("You do not have a configuration file. You can create one with the following information:\nvar defaultLoad = ['type','name'];\nReplace type with board or state\nreplace name with the name of what you want to load.");
	});
	
	
updateLoggedIn;

var onAuthorize = function() {
    updateLoggedIn();
    $("#output").empty();
    
    Trello.members.get("me", function(member){
        $("#fullName").text(member.fullName);
	});
		
		//Output a list of all status
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

});

function loadDefault(){
	$removedMembers = {};
	if(!isWritten){
		if(defaultLoad[0]=="state"){
			loadState(defaultLoad[1]);
		}else{
			loadBoard(defaultLoad[1]);
		}
		isWritten = true;
	}
}
function loadBoard(id){
	$("#content").empty();
	if($.isEmptyObject($removedMembers)){
		$("#user").empty();
		$("#type").empty();
	}
	$("#reloadButton").remove();
	//Show the title of which board we load
	$board = $("<div>").attr({class:"boardTitle"}).text(id).appendTo("#content");
	$button = $("<button>").attr({type:"button", id:"reloadButton", onclick:"loadBoard('"+id+"')"}).text("Reload this board").appendTo("#filter");	
	//Get the current board Id
	boardId = $dictBoards[id];
	//Get all the list of lists the board currently has
	Trello.boards.get(boardId, {lists:"open"}, function(states){
		console.log(states);
		$link = $("<a>").attr({href:states.url, target:"_blank"}).appendTo($board);
		$trelloLogo = $("<img>").attr({src:"https://s3.amazonaws.com/trello/images/og/trello-icon.png", title:"View "+board.name+" board in Trello", class:"trelloLogo"}).appendTo($link);
		$.each(states.lists, function(ic, list){
			//Throw away the lists that are in "Done" lists
			if(list.name.indexOf("Done")== -1){
				$list = $("<div>").attr({id:list.id, class:"list", style:"display:none;"}).appendTo("#content");
				$state = $("<div>").attr({id:list+"State", class:"state"}).text(list.name).appendTo($list);
				
				//Get the list of the current cards in the list
				Trello.lists.get(list.id, {cards:"open"},function (list){
					//Add all the cards in a dictionary
					$.each(list.cards, function(iy, card){
						if($.isEmptyObject($removedMembers)){
							document.getElementById(list.id).style.display = "block";
							$card = $("<div>").attr({id:card.id, class:"card"}).appendTo(document.getElementById(list.id));
						}else{
							$card = $("<div>").attr({id:card.id, class:"card", style:"display:none"}).appendTo(document.getElementById(list.id));
						}
						$title = $("<div>").attr({id:card.id+"Title", class:"title", onclick:"show('"+card.id+"')"}).text(card.name).appendTo($card);
						
						if(card.desc != ""){
							$plus = $("<span>").attr({id:card.id+"plus"}).text(" +").appendTo($title);
							$content = $("<div>").attr({id:card.id+"Content", class:"cardContent"}).text(card.desc).appendTo($card);
						}
						$linkCard = $("<a>").attr({href:card.url, target:"_blank"}).appendTo($title);
						$trelloLogoCard = $("<img>").attr({src:"https://s3.amazonaws.com/trello/images/og/trello-icon.png", title:"View this card in Trello", class:"trelloLogo"}).appendTo($linkCard);
						if(card.idMembers != ""){
							//Get the list of all members of the current card
							$members = $("<div>").attr({id:card.id+"Members",class:"members"}).appendTo(document.getElementById(card.id));
							//If the all the members of the card has been removed, we do not show it
							var count = -1;
							var pos = 0;
							var canShow = true;
							for(pos in card.idMembers){
								if(card.idMembers[pos] in $removedMembers){
									count++;
								}
							}
							if(count == pos){canShow = false}
							if(canShow){
								for(pos in card.idMembers){
									$card.attr({style:"display:block"});
									document.getElementById(list.id).style.display = "block";
									Trello.members.get(card.idMembers[pos], function(member){
										$member = $("<div>").attr({id:member.id, class:"member"}).appendTo(document.getElementById(card.id+"Members"));
										$linkMember = $("<a>").attr({href:member.url, target:"_blank", class:"linkMember"}).appendTo($member);
										if(member.avatarHash == "" || member.avatarHash == null){
											//Member doesn't have an avatar, we add his initials
											$avatar = $("<div>").attr({id:member.id+"Avatar", class:"initials"}).text(member.initials).appendTo($linkMember);
										}else{
											//Member have an avatar, we show it
											$avatar = $("<img>").attr({id:member.id+"Avatar", class:"avatar", title:member.username,src:"https://trello-avatars.s3.amazonaws.com/"+member.avatarHash+"/30.png"}).appendTo($linkMember);
										}
										//And what about updating the menu too?
										if(document.getElementById(member.id+"Select") == null){
											$menuMemberName = $("<div>").attr({class:"check"}).text(member.fullName + " ").appendTo("#user");
											$menuMember = $("<input>").attr({id:member.id+"Select", type:"checkbox", value:member.id, checked:true, onclick:"changeMember('"+member.id+"')"}).text(member.fullName).appendTo($menuMemberName);
										}
									});
								}
							}
						}
					});
				});
			}
		});
	}); 
}

function loadState(id){
	$("#content").empty();
	if($.isEmptyObject($removedMembers)){
		$("#user").empty();
		$("#type").empty();
	}
	$("#reloadButton").remove();
	//Show the title of which list we load
	$state = $("<div>").attr({class:"stateTitle"}).text(id).appendTo("#content");
	$button = $("<button>").attr({type:"button", id:"reloadButton", onclick:"loadState('"+id+"')"}).text("Reload this list").appendTo("#filter");
	listName = $dictStates[id];
	Trello.members.get("me", function (me){
		for(posBoard in me.idBoards){
			//Get all the list of lists the board currently has
			Trello.boards.get(me.idBoards[posBoard], {lists:"open"}, function(board){
				for(temp in board.lists){
					if(board.lists[temp].name == listName){
						$board = $("<div>").attr({id:board.id, class:"board", style:"display:none;"}).appendTo("#content");
						$boardName = $("<div>").attr({id:board.id+"Board", class:"state"}).text(board.name).appendTo($board);
						$link = $("<a>").attr({href:board.url, target:"_blank"}).appendTo($boardName);
						$trelloLogo = $("<img>").attr({src:"https://s3.amazonaws.com/trello/images/og/trello-icon.png", title:"View "+board.name+" board in Trello", class:"trelloLogo"}).appendTo($link);
					}
				}
				$.each(board.lists, function(ic, list){
					//Throw away the lists that are in "Done" state
					if(list.name.indexOf("Done")== -1 && list.name == listName){
						//Get the list of the current cards in the list
						Trello.lists.get(list.id, {cards:"open"},function (list){
							//Add all the cards in a dictionary
							$.each(list.cards, function(iy, card){
								if($.isEmptyObject($removedMembers)){
									document.getElementById(board.id).style.display = "block";
									$card = $("<div>").attr({id:card.id, class:"card"}).appendTo(document.getElementById(board.id));
								}else{
									$card = $("<div>").attr({id:card.id, class:"card", style:"display:none"}).appendTo(document.getElementById(board.id));
								}
								$title = $("<div>").attr({id:card.id+"Title", class:"title", onclick:"show('"+card.id+"')"}).text(card.name).appendTo($card);
								
								if(card.desc != ""){
									$plus = $("<span>").attr({id:card.id+"plus"}).text(" +").appendTo($title);
									$content = $("<div>").attr({id:card.id+"Content", class:"cardContent"}).text(card.desc).appendTo($card);
								}
								$linkCard = $("<a>").attr({href:card.url, target:"_blank"}).appendTo($title);
								$trelloLogoCard = $("<img>").attr({src:"https://s3.amazonaws.com/trello/images/og/trello-icon.png", title:"View this card in Trello", class:"trelloLogo"}).appendTo($linkCard);
								if(card.idMembers != ""){
									//Get the list of all members of the current card
									$members = $("<div>").attr({id:card.id+"Members",class:"members"}).appendTo(document.getElementById(card.id));
									//If the all the members of the card has been removed, we do not show it
									var count = -1;
									var pos = -1;
									var canShow = true;
									for(pos in card.idMembers){
										if(card.idMembers[pos] in $removedMembers){
											count++;
										}
									}
									if(count == pos){canShow = false}
									if(canShow){
										for(pos in card.idMembers){
												$card.attr({style:"display:block"});
												document.getElementById(board.id).style.display = "block";
												Trello.members.get(card.idMembers[pos], function(member){
													$member = $("<div>").attr({id:member.id, class:"member"}).appendTo(document.getElementById(card.id+"Members"));
													$linkMember = $("<a>").attr({href:member.url, target:"_blank", class:"linkMember"}).appendTo($member);
													if(member.avatarHash == "" || member.avatarHash == null){
														//Member doesn't have an avatar, we add his initials
														$avatar = $("<div>").attr({id:member.id+"Avatar", class:"initials"}).text(member.initials).appendTo($linkMember);
													}else{
														//Member have an avatar, we show it
														$avatar = $("<img>").attr({id:member.id+"Avatar", class:"avatar", title:member.username,src:"https://trello-avatars.s3.amazonaws.com/"+member.avatarHash+"/30.png"}).appendTo($linkMember);
													}
													//And what about updating the menu too?
													if(document.getElementById(member.id+"Select") == null){
														$menuMemberName = $("<div>").attr({class:"check"}).text(member.fullName + " ").appendTo("#user");
														$menuMember = $("<input>").attr({id:member.id+"Select", type:"checkbox", value:member.id, checked:true, onclick:"changeMember('"+member.id+"')"}).text(member.fullName).appendTo($menuMemberName);
													}
												});
										}
									}
								}
							});
						});
					}
				});
			}); 
		}
	});
}

function loadBoardRemove(id){
	for(i in $removedMembers){
		delete $removedMembers[i];
	}
	loadBoard(id);
}

function loadStateRemove(id){
	for(i in $removedMembers){
		delete $removedMembers[i];
	}
	loadState(id);
}

function changeMember(id){
	if($removedMembers[id]){
		delete $removedMembers[id];
	}else{
		$removedMembers[id] = id;
	}
}

function show(id){
	doc = document.getElementById(id+"Content");
	plus = document.getElementById(id+"plus");
	showThis(doc,plus);
}

function showConfig(id){
	doc = document.getElementById(id.id.replace(/Show/g, ''));
	plus = document.getElementById(id.id+"Plus");
	showThis(doc, plus);
}

function showThis(doc, plus){
	if(doc.style.display == "none" || doc.style.display == ""){
		doc.style.display="block";
		doc.style.minHeight = "30px";
		plus.innerHTML = " -"
	}else{
		doc.style.display="none";
		doc.style.minHeight = "";
		plus.innerHTML = " +"
	}
}