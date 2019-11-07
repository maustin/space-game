import { UIStateManager } from './UIStateManager.mjs';
import { StageManager } from './StageManager.mjs';
import { GameManager } from './GameManager.mjs';

let queue = new createjs.LoadQueue(true);

let uiManager = new UIStateManager();
let stageManager = new StageManager(queue);
let gm = new GameManager(uiManager, stageManager);

function handleFileComplete(event) {
	if (event.item.id == 'mods') {
		uiManager.setModsContent(event.result.mods);
		gm.setModsContent(event.result.mods);
	}
	else if (event.item.id.includes('assetsManifest.json')) {
		stageManager.setManifest(event.result.assets);
		// queue up the images
		queue.loadManifest(event.result.assets);
	}
}

function handleQueueComplete(event) {
	console.log("load queue complete");
	uiManager.init();
}

queue.on('fileload', handleFileComplete, this);
queue.on('complete', handleQueueComplete, this);
queue.loadFile('./assets/assetsManifest.json');