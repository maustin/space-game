const SHIP_EDGE_OFFSET = 30;
const SHIP_VERT_BASELINE = 250;

// Doing this in the global cause maybe warranted?
var stage = new createjs.Stage('canvas');
createjs.Ticker.addEventListener("tick", handleTick);
function handleTick() {
	stage.update();
}

class StageManager {
	constructor(queue) {
		this.queue = queue;
		this.assetManifest = null;
	}

	setManifest(assetManifest) {
		this.assetManifest = assetManifest;
	}

	setupBattleScreen(player1, player2) {
		let w = stage.canvas.width;
		let h = stage.canvas.height;

		let stars = this.createBitmap('stars');
		let nebula = this.createBitmap(this.getRandomIdFromPartial('nebula'));
		let planet = this.createBitmap(this.getRandomIdFromPartial('planet'));

		let nebulaBounds = nebula.getBounds();
		nebula.x = this.getNicePosition(nebulaBounds.width, w);
		nebula.y = this.getNicePosition(nebulaBounds.height, h);

		let planetBounds = planet.getBounds();
		planet.x = this.getNicePosition(planetBounds.width, w);
		planet.y = this.getNicePosition(planetBounds.height, h);

		let p1dO = player1.displayObject;
		let p2dO = player2.displayObject;

		p1dO.x = SHIP_EDGE_OFFSET;
		p1dO.y = h - SHIP_VERT_BASELINE - p1dO.getBounds().height * 0.5;

		p2dO.x = w - SHIP_EDGE_OFFSET - p2dO.getBounds().width;
		p2dO.y = h - SHIP_VERT_BASELINE - p2dO.getBounds().height * 0.5;

		stage.addChild(stars);
		stage.addChild(nebula);
		stage.addChild(planet);

		stage.addChild(p1dO);
		stage.addChild(p2dO);
	}

	createBitmap(assetId) {
		// TODO: Should we same obj name to assetId?
		return new createjs.Bitmap(this.queue.getResult(assetId));
	}

	getRandomIdFromPartial(partialId) {
		let matches = this.assetManifest.filter(item => item.id.includes(partialId));
        if (matches && matches.length) {
            return matches[Math.floor(Math.random() * matches.length)].id;
        }
        
        return null;
	}

	getNicePosition(itemScalar, targetScalar) {
		let itemOffset = itemScalar * 0.5;
		let validTargetScalar = targetScalar * 0.9;
		let targetOffset = targetScalar * 0.05;
		
		let offset = (Math.random() * validTargetScalar) + targetOffset - itemOffset;
		return Math.floor(offset);
	}
}

export { StageManager };