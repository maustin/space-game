const SHIP_EDGE_OFFSET = 30;
const SHIP_VERT_BASELINE = 250;

// Doing this in the global cause maybe warranted?
var stage = new createjs.Stage('canvas');
/*createjs.Ticker.addEventListener("tick", handleTick);
function handleTick() {
	stage.update();
}*/

class StageManager {
	constructor(queue) {
		this.queue = queue;
		this.assetManifest = null;
		this.animationQueue = [];

		createjs.Ticker.framerate = 30;
	}

	init() {
		createjs.Ticker.addEventListener('tick', (event)=> this.handleTick(event));
	}

	handleTick(event) {
		for (let i = this.animationQueue.length - 1; i > -1; i--) {
			let doodad = this.animationQueue[i];
			doodad.delay -= event.delta;
			if (doodad.delay <= 0) {
				stage.addChild(doodad.displayObject);
				doodad.ease.play();
				this.animationQueue.splice(i, 1);
			}
		}
		stage.update();
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

	displayBattleAction(battleAction) {
		//if (battleAction.mod.id == 'laser')
			this.displayLaserAction(battleAction);
	}

	displayLaserAction(battleAction) {
		//let hits = [];
		let hardpoints = battleAction.source.data.hardpoints.filter(item => item.type == 'laser');
		let numShots = 8;//Math.random() * 4
		for (let i = 0; i < numShots; i++) {
			let shot = this.buildLaserShot(battleAction,
				hardpoints[Math.floor(Math.random() * hardpoints.length)]);
			let ease = TweenLite.to(shot, 0.5, {alpha: 0, paused:true});
			this.animationQueue.push(new DooDad(200 * i, shot, ease));
		}
	}

	buildLaserShot(battleAction, hardpoint) {
		let bitmap = this.createBitmap('laser');
		let bmBounds = bitmap.getBounds();
		let targetBounds = battleAction.target.displayObject.getBounds();
		// TODO: make sure these actually hit
		let tXOff = Math.floor(Math.random() * targetBounds.width);
		let tYOff = Math.floor(Math.random() * targetBounds.height);

		let sX = battleAction.source.displayObject.x + hardpoint.x;
		let sY = battleAction.source.displayObject.y + hardpoint.y;
		let tX = battleAction.target.displayObject.x + tXOff;
		let tY = battleAction.target.displayObject.y + tYOff;

		let diffX = tX - sX;
		let diffY = tY - sY;
		let distance = Math.sqrt((diffX * diffX) + (diffY * diffY));

		let rads = Math.atan2(diffY, diffX);
		let degrees = this.radiansToDegrees(rads);
		
		bitmap.x = sX;
		bitmap.y = sY;
		bitmap.scaleX = distance / bmBounds.width;
		bitmap.rotation = degrees;

		//stage.addChild(bitmap);
		return bitmap;
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

	getManifestObject(assetId) {
		return this.assetManifest.find(item => item.id == assetId);
	}

	getNicePosition(itemScalar, targetScalar) {
		let itemOffset = itemScalar * 0.5;
		let validTargetScalar = targetScalar * 0.9;
		let targetOffset = targetScalar * 0.05;
		
		let offset = (Math.random() * validTargetScalar) + targetOffset - itemOffset;
		return Math.floor(offset);
	}

	radiansToDegrees(radians) {
		return radians * (180 / Math.PI);
	}
}

class DooDad {
	constructor(delay, displayObject, ease) {
		this.delay = delay;
		this.displayObject = displayObject;
		this.ease = ease;
	}
}



export { StageManager };