var $dictStates = {};
var $dictBoards = {};

function checkIfEmpty(){
	var name = document.getElementById('toBeFilled');
	var selectedText = name.options[name.selectedIndex].text;
	if(selectedText.indexOf("Board")!= -1){
		var type = "board";
	}else{
		var type = "state";
	}
	$("<input>").attr({name:"list", value:type, type:"textbox"}).text(type).appendTo("#form");
	if(name.selectedIndex == 0){
		return confirm('Are you sure you want to write the first name? We will save this: Type = '+ type +' and Name = '+ name.value);
	}else{
		return confirm('We will save this : Type = '+ type +' and Name = '+ name.value +' Is that fine?');
	}
}
Trello.authorize({
    interactive:false,
    success: onAuthorize
});
$(document).ready(function(){
Trello.authorize({
        type: "popup",
		name: "SuperMetaBoard",
        success: onAuthorize
    })
});
//Get all the boards the current user has access to
var onAuthorize = function() {
	$.when(Trello.get("members/me/boards", function(boards) {
		$.each(boards, function(ix, board) {
			if(board.name != "Welcome Board"){
				$board = $("<option>").attr({value:board.id}).text(board.name + " - Board").appendTo("#toBeFilled");
				//Get all the lists the user has access to
				Trello.boards.get(board.id, {lists:"open"}, function(states){
					$dict = {}
					$.each(states.lists, function(ic, list){
						//Throw away the lists that are in "Done" state
						if(list.name.indexOf("Done")== -1){
							$list = $("<option>").attr({value:list.name}).text(list.name + " - State").appendTo("#toBeFilled");
						}
					});
				}); 
			}
		});
	}));
};