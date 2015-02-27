/*
*	This document contains the calls to the Trello API
*	Created by : 	Isaac Ouellet Therrien
*	Created on : 	24/02/2015
*	Modified by :	*Append your name here*
*	Last modified: 	24/02/2015
*/
var $dictTotal = {};
var $dictStates = {};
var $dictBoards = {};
var $dictCards = {};
var $counter = true;
$(document).ready(function(){
	
updateLoggedIn;

var onAuthorize = function() {
    updateLoggedIn();
    $("#output").empty();
    
    Trello.members.get("me", function(member){
        $("#fullName").text(member.fullName);
	});
			
		var $dict = {};
		var $dictName = {};
		
		//Output a list of all status
		//Get all the boards the current user has access to
		$.when(Trello.get("members/me/boards", function(boards) {
			$.each(boards, function(ix, board) {
				if(board.name != "Welcome Board"){
					$dictTotal[board.name] = {};
					$dictBoards[board.name] = board.name;
					//Get all the lists the user has access to
					Trello.boards.get(board.id, {lists:"open"}, function(states){
						$dict = {}
						$.each(states.lists, function(ic, list){
							//Trow away the lists that are in "Done" state
							if(list.name.indexOf("Done")== -1){
								var $dictCard = {};
								var $dictDesc = {};
								var $dictUser = {};
								$dictName = {};
								$dictStates[list.name] = list.name;
								
								//Get all the cards in the current list
								Trello.lists.get(list.id, {cards:"open"},function (list){
									//Add all the cards in a dictionary
									$counter = 0;
									$.each(list.cards, function(iy, card){
										for(pos in card.idMembers){
											Trello.members.get(card.idMembers[pos], {fields:"all"}, function(member){
												
												if(member.avatarHash == ""){
													//Prepare the member full name + initials
													$dictUser[member.fullName] = member.initials;
												}else{
													//Prepare the member full name + image
													$dictUser[member.fullName] = member.avatarHash
												}
											});
										}
										$dictDesc[card.desc] = $dictUser;
										$dictCard[card.name] = card.desc;
									});
								});
								//Then we change the dictionary, and make sure we added the state in the state dictionary
								$dictName[list.name] = list.name;
								$dict[list.name] = $dictCard;
							}
						});
						$dictTotal[board.name] = $dict;
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
		.attr({id:board, onclick:"loadBoard('"+board+"')"})
        .appendTo("#boards");
		$board = $("<a>")
		.attr({href:"#"})
        .text(board)
		.appendTo(document.getElementById(board));
	}
	//Show the menu with the List Name aka State
	for (state in $dictStates){
		$state = $("<li>")
		.attr({id:state, onclick:"loadState('"+state+"')"})
        .appendTo("#state");
		$state = $("<a>")
		.attr({href:"#"})
        .text(state)
		.appendTo(document.getElementById(state));
	}
	
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

function loadBoard(id){
	$("#content").empty();
	//Show the title of which board we load
	$board = $("<div>").attr({class:"boardTitle"}).text(id).appendTo("#content");
	//Get all the list in the current board
	for(list in $dictTotal[id]){
		//Get all the card in the current list
		//Write a list
		$list = $("<div>").attr({id:list, class:"list"}).appendTo("#content");
		$state = $("<div>").attr({id:list+"State", class:"state"}).text(list).appendTo($list);
		for(card in $dictTotal[id][list]){
			//Writes a card
			$card = $("<div>").attr({id:card, class:"card"}).appendTo($list);
			
			$title = $("<div>").attr({id:card+"Title", class:"title", onclick:"show('"+card.replace(/ /g,'')+"')"}).text(card).appendTo($card);
			//If the card has a content
			//NEED TO UPDATE THIS PART TO SUPPORT THE USER
			if($dictTotal[id][list][card] != ""){
				
				for(desc in $dictTotal[id][list][card]){
					console.log(desc);
				}
				
				var $plus = $("<span>").attr({id:card.replace(/ /g,'')+"plus"}).text(" +").appendTo($title);
				$content = $("<div>").attr({id:card.replace(/ /g,'')+"Content", class:"cardContent"}).text($dictTotal[id][list][card]).appendTo($card);
				//END OF UPDATE
			}
		}
	}
}

function loadState(id){
	$("#content").empty();
	//Show the title of which state we load
	$state = $("<div>").attr({class:"stateTitle"}).text(id).appendTo("#content");
	//Get all the boards in the dictionary
	for(board in $dictTotal){
		//Get all the list in the current board
		//Write a board
		$board = $("<div>").attr({id:board, class:"board"}).appendTo("#content");
		$boardName = $("<div>").attr({id:board+"Board", class:"state"}).text(board).appendTo($board);
		for(list in $dictTotal[board]){
			//If the list is the one we are looking for we do something, else we do nothing
			if(list == id){
				for(card in $dictTotal[board][list]){
					//Writes a card
					$card = $("<div>").attr({id:card, class:"card"}).appendTo($board);
					
					$title = $("<div>").attr({id:card+"Title", class:"title", onclick:"show('"+card.replace(/ /g,'')+"')"}).text(card).appendTo($card);
					//If the card has a content
					//UPDATE START
					if($dictTotal[board][list][card] != ""){
						var $plus = $("<span>").attr({id:card.replace(/ /g,'')+"plus"}).text(" +").appendTo($title);
						$content = $("<div>").attr({id:card.replace(/ /g,'')+"Content", class:"cardContent"}).text($dictTotal[board][list][card]).appendTo($card);
					}
					//UPDATE END
				}
			}
		}
	}
}

function show(id){
	doc = document.getElementById(id+"Content").style;
	plus = document.getElementById(id+"plus");
	if(doc.display == "none" || doc.display == ""){
		doc.display="block";
		plus.innerHTML = " -"
	}else{
		doc.display="none";
		plus.innerHTML = " +"
	}
}
