<?php 
$name = "";
$type = "";
$bool = false;
echo "<script src='../js/jquery-1.11.2.min.js'></script><script src='https://api.trello.com/1/client.js?key=7969be011a5a24f7569e5b0ade3ec847'></script><script src='confirm.js'></script>";
if(isset($_POST['defaultLoad'])){
	$name = $_POST['defaultLoad'];
	$type = $_POST['list'];
	//Config string, to be written
	$config = "/*This file contains the configuration for the project*/
/*The variable defaultLoad should be an array 
  With the kind of item we want to load in the first position (state or board)
  and the name of the item we want to load (case sensitive) in the second position*/";
	$config = $config . "
var defaultLoad = ['".$type."','".$name."'];";
	//Lets write to the config file
	$configFile = fopen("config.js", "w");
	fwrite($configFile, $config);
	echo "Wrote to file. You will be redirected. If you aren't click <a href='../'>here</a>";
	header('Location: ../' ) ;
}

echo "Welcome in this project, the SuperMetaBoard.</br>
	  We created this tool to help us with our different project following the AGILE method.</br>
	  So, why not sharing it?</br>
	  And, why not making it super?</br>
	  You have to fill up this quick form to get the best of the tool.</br>
	  For now, it only will auto-load something, but we're only starting!</br></br></br>";

echo "<form id='form' action='' method='POST'>
		What do you want to be loaded by default? 
		<select id='toBeFilled' name='defaultLoad'>
		</select></br>
		<input type='submit' value='Save' onclick='return checkIfEmpty()'>
	</form>";
?>