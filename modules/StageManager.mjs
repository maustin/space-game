const SHIP_EDGE_OFFSET = 30;
const SHIP_VERT_BASELINE = 250;

var stage = new createjs.Stage('canvas');

class StageManager {
	constructor(queue) {
		this.queue = queue;
		this.assetManifest = null;
		this.animationQueue = [];

		createjs.Ticker.framerate = 30;
		CustomEase.create('laser-shot', 'M0,0 C0.28,-1.3 0.79,0.208 1,0.51');
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
		if (!battleAction.isVisible)
			return;
		
		//if (battleAction.mod.id == 'laser')
			this.displayLaserAction(battleAction);
	}

	displayLaserAction(battleAction) {
		let hardpoints = battleAction.source.data.hardpoints.filter(item => item.type == 'laser');
		let numShots = 8;//Math.random() * 4
		for (let i = 0; i < numShots; i++) {
			let shot = this.buildLaserShot(battleAction,
				hardpoints[Math.floor(Math.random() * hardpoints.length)]);
			//shot.alpha = 0.7;
			let ease = TweenMax.to(shot, 0.3, {alpha: 0, paused:true, ease: 'laser-shot', onComplete: function() {
				stage.removeChild(this.target);
			}});
			this.animationQueue.push(new DooDad(200 * i, shot, ease));
		}
	}

	buildLaserShot(battleAction, hardpoint) {
		let bitmap = this.createBitmap('laser');
		let bmBounds = bitmap.getBounds();
		let targetPoint = this.getTargetHit(battleAction.target);

		let sX = battleAction.source.displayObject.x + hardpoint.x;
		let sY = battleAction.source.displayObject.y + hardpoint.y;
		let tX = battleAction.target.displayObject.x + targetPoint.x;
		let tY = battleAction.target.displayObject.y + targetPoint.y;

		let diffX = tX - sX;
		let diffY = tY - sY;
		let distance = Math.sqrt((diffX * diffX) + (diffY * diffY));

		let rads = Math.atan2(diffY, diffX);
		let degrees = this.radiansToDegrees(rads);
		
		bitmap.x = sX;
		bitmap.y = sY;
		bitmap.scaleX = distance / bmBounds.width;
		bitmap.rotation = degrees;

		return bitmap;
	}

	getTargetHit(target) {
		let targetBounds = target.displayObject.getBounds();
		let targetX;
		let targetY;

		do {
			targetX = Math.floor(Math.random() * targetBounds.width);
			targetY = Math.floor(Math.random() * targetBounds.height);
		}
		while (!target.displayObject.hitTest(targetX, targetY));

		return { x: targetX, y: targetY };
	}

	createBitmap(assetId) {
		// TODO: Should we same obj name to assetId?
		let bitmap = new createjs.Bitmap(this.queue.getResult(assetId));
		let manifest = this.getManifestObject(assetId);
		if (manifest.data) {
			if (!isNaN(manifest.data.regX))
				bitmap.regX = manifest.data.regX;
			if (!isNaN(manifest.data.regY)) {
				bitmap.regY = manifest.data.regY;
			}
		}
		return bitmap;
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