import { UIStateManager } from './UIStateManager.mjs';
import { CanvasHandler } from './CanvasHandler.mjs';
import { GameManager } from './GameManager.mjs';

/*
var canvas = document.querySelector("#canvas");
var ctx = canvas.getContext("2d");

ctx.beginPath();
ctx.rect(0, 0, 800, 600);
ctx.fillStyle = 'black';//'#FF00FF';
ctx.fill();*/

let uiManager = new UIStateManager();
let canvasHandler = new CanvasHandler();
let gm = new GameManager(uiManager, canvasHandler);

//uiManager.init();

function loadJSON(path, callback) {
	var xobj = new XMLHttpRequest();
	xobj.overrideMimeType("application/json");
	xobj.open('GET', path, true);
	xobj.onreadystatechange = function() {
		if (xobj.readyState == 4 && xobj.status == "200") {
			callback(xobj.responseText);
		}
	}
	xobj.send(null);
}

function handleJSONLoaded(response) {
	let modsData = JSON.parse(response);
	uiManager.setModsContent(modsData.mods);
	gm.setModsContent(modsData.mods);
	uiManager.init();

	canvasHandler.playCircuits();

	//setTimeout(() => canvasHandler.stop(), 3000);
}

loadJSON("./assets/mods.json", handleJSONLoaded);

console.log("I did a thing");