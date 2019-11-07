import { UIStateManager } from './UIStateManager.mjs';
import { CanvasHandler } from './CanvasHandler.mjs';
import { GameManager } from './GameManager.mjs';
import { AssetLibrary } from './AssetLibrary.mjs';

let assetLibrary = new AssetLibrary();
let uiManager = new UIStateManager();
let canvasHandler = new CanvasHandler(assetLibrary);
let gm = new GameManager(uiManager, canvasHandler, assetLibrary);
let assetsManifest = null;

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

function handleModsJSONLoaded(response) {
	console.log("Mods JSON loaded");
	let modsData = JSON.parse(response);
	uiManager.setModsContent(modsData.mods);
	gm.setModsContent(modsData.mods);

	loadJSON("./assets/assetsManifest.json", handleManifestJSONLoaded);
}

function handleManifestJSONLoaded(response) {
	console.log("Done manifest JSON loaded");
	let manData = JSON.parse(response);
	assetsManifest = manData.assets;

	assetLibrary.setManifest(assetsManifest);

	let paths = [];
	assetsManifest.forEach(asset => paths.push(asset.path));

	queue.loadManifest(paths);
}

function handleFileComplete(event) {
	//console.log(event);
	assetLibrary.addAsset(event);
}

function handleQueueComplete(event) {
	console.log("load queue complete");
	uiManager.init();
	canvasHandler.playCircuits();
}

var queue = new createjs.LoadQueue(true);
queue.on('fileload', handleFileComplete, this);
queue.on('complete', handleQueueComplete, this);

loadJSON("./assets/mods.json", handleModsJSONLoaded);
