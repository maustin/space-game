const SHIP_EDGE_OFFSET = 30;
const SHIP_VERT_BASELINE = 250;

var stage = new createjs.Stage('canvas');

class StageManager {
	constructor(queue) {
		this.queue = queue;
		this.assetManifest = null;
		this.animationQueue = [];
		this.width = stage.canvas.width;
		this.height = stage.canvas.height;

		createjs.Ticker.framerate = 30;
		CustomEase.create('laser-shot', 'M0,0 C0.28,-1.3 0.79,0.208 1,0.51');
		CustomEase.create('laser-hit', "M0,0 C0,-0.6 0.041,-2.012 0.218,-2.012 0.391,-2.012 0.672,0 1,0");
	}

	init() {
		createjs.Ticker.addEventListener('tick', (event)=> this.handleTick(event));

		let stars = this.createBitmap('stars');
		let nebula = this.createBitmap(this.getRandomIdFromPartial('nebula'));
		let planet = this.createBitmap(this.getRandomIdFromPartial('planet'));

		let nebulaBounds = nebula.getBounds();
		nebula.x = this.getNicePosition(nebulaBounds.width, this.width);
		nebula.y = this.getNicePosition(nebulaBounds.height, this.height);

		let planetBounds = planet.getBounds();
		planet.x = this.getNicePosition(planetBounds.width, this.width);
		planet.y = this.getNicePosition(planetBounds.height, this.height);

		stage.addChild(stars);
		stage.addChild(nebula);
		stage.addChild(planet);
	}

	handleTick(event) {
		for (let i = this.animationQueue.length - 1; i > -1; i--) {
			let doodad = this.animationQueue[i];
			doodad.delay -= event.delta;
			if (doodad.delay <= 0) {
				stage.addChild(doodad.displayObject);
				doodad.playEase();
				this.animationQueue.splice(i, 1);
			}
		}
		stage.update();
	}

	setManifest(assetManifest) {
		this.assetManifest = assetManifest;
	}

	reset() {
		// hard coooooode
		let p1 = stage.children.find(child => child.name == 'player1');
		let p2 = stage.children.find(child => child.name == 'player2');

		if (p1)
			stage.removeChild(p1);
		if (p2)
			stage.removeChild(p2);
	}

	setupBattleScreen(player1, player2) {
		let p1dO = player1.displayObject;
		let p1Bounds = p1dO.getBounds();
		let p1TargetX = SHIP_EDGE_OFFSET;

		p1dO.x = -100 - p1Bounds.width;
		p1dO.y = this.height - SHIP_VERT_BASELINE - p1dO.getBounds().height * 0.5;
		TweenLite.to(p1dO, 3, {x: p1TargetX, ease: Power2.easeOut});

		let p2dO = player2.displayObject;
		let p2Bounds = p2dO.getBounds();
		let p2TargetX = this.width - SHIP_EDGE_OFFSET - p2dO.getBounds().width;

		p2dO.x = this.width + 100;
		p2dO.y = this.height - SHIP_VERT_BASELINE - p2dO.getBounds().height * 0.5;
		TweenLite.to(p2dO, 2, {x: p2TargetX, ease: Power2.easeOut});

		stage.addChild(p1dO);
		stage.addChild(p2dO);
	}

	displayBattleAction(battleAction) {
		if (!battleAction.isVisible)
			return;
		
		if (battleAction.mod.id == 'laser')
			this.displayLaserAction(battleAction);
	}

	displayLaserAction(battleAction) {
		let hardpoints = battleAction.source.data.hardpoints.filter(item => item.type == 'laser');
		let numShots = Math.random() * 4 + 4;
		for (let i = 0; i < numShots; i++) {
			this.animationQueue.push(...this.buildLaserShot(battleAction, hardpoints[Math.floor(Math.random() * hardpoints.length)], i));
		}
	}

	buildLaserShot(battleAction, hardpoint, iteration) {
		let parts = [];

		/* do math */
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

		/* build the bits */
		let hitBitmap = this.createBitmap('hit1');
		hitBitmap.x = tX;
		hitBitmap.y = tY;
		hitBitmap.scale = 4;
		hitBitmap.alpha = 0;

		let hitTimeline = new TimelineLite({paused: true, onComplete: function() {
			stage.removeChild(this.target);
		}});
		hitTimeline.to(hitBitmap, 0.1, {alpha: 1});
		hitTimeline.to(hitBitmap, 1.2, {alpha: 0, ease: Power1.easeInOut});

		parts.push(new DooDad(200 * iteration + 150, hitBitmap, hitTimeline));

		let shrapnelCount = Math.floor(Math.random() * 5) + 3;
		for (let i = 0; i < shrapnelCount; i++) {
			let shrapBitmap = this.createBitmap('hit1');
			shrapBitmap.x = tX;
			shrapBitmap.y = tY;
			shrapBitmap.scale = Math.random() * 1 + 1;
			let newAngle = rads + (Math.random() * 1.5 - 0.75);
			let d = Math.random() * 50 + 50;
			let newX = Math.cos(newAngle) * d + tX;
			let newY = Math.sin(newAngle) * d + tY;

			let shrapEase = TweenLite.to(shrapBitmap, 1.5, {alpha: 0, x: newX, y: newY, rotation: Math.random() * 360, paused: true, ease: Power1.easeOut, onComplete: function() {
				stage.removeChild(this.target);
			}});

			parts.push(new DooDad(200 * iteration + 200, shrapBitmap, shrapEase));
		}

		let laserBitmap = this.createBitmap('laser');
		let bmBounds = laserBitmap.getBounds();
		
		laserBitmap.x = sX;
		laserBitmap.y = sY;
		let targetScale = distance / bmBounds.width;
		laserBitmap.rotation = degrees;
		laserBitmap.alpha = 0.7;

		let scaleEase = TweenMax.to(laserBitmap, 0.15, {scaleX: targetScale, paused: true});
		let laserEase = TweenMax.to(laserBitmap, 0.5, {alpha: 0, paused: true, ease: 'laser-shot', onComplete: function() {
				stage.removeChild(this.target);
		}});

		parts.push(new DooDad(200 * iteration, laserBitmap, [laserEase, scaleEase]));

		return parts;
	}

	killPlayer(player) {
		let displayObject = player.displayObject;
		let targetX = 0;
		if (player.name == "Player")
			targetX = -200;
		else
			targetX = 200;

		TweenLite.to(displayObject, 2, {alpha: 0, x: displayObject.x + targetX, ease: Power1.easeIn});
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

	playEase() {
		if (this.ease instanceof Array)
			this.ease.forEach(ease => ease.play());
		else
			this.ease.play();
	}
}



export { StageManager };