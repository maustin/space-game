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
		CustomEase.create('laser-hit', 'M0,0 C0,-0.6 0.041,-2.012 0.218,-2.012 0.391,-2.012 0.672,0 1,0');
		CustomEase.create('gauss-muzzle', 'M0,0.308,C0.062,-0.87,0.919,0.438,1,1');
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
		else if (battleAction.mod.id == 'gauss')
			this.displayGaussAction(battleAction);
		else if (battleAction.mod.id == 'torpedo')
			this.displayTorpedoAction(battleAction);
	}

	displayTorpedoAction(battleAction) {
		let hardpoints = battleAction.source.data.hardpoints.filter(item => item.type == 'torpedo');
		for (let i = 0; i < 2; i++) {
			this.animationQueue.push(...this.buildTorpedoShot(battleAction, hardpoints[i]));
		}
	}

	buildTorpedoShot(battleAction, hardpoint) {
		let parts = [];
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

		let torpedoBitmap = this.createBitmap('torpedo-shot');
		let bmBounds = torpedoBitmap.getBounds();

		torpedoBitmap.x = sX;
		torpedoBitmap.y = sY;

		let torpedoEaseRotation = TweenMax.to(torpedoBitmap, 1, {rotation: 999, paused: true, ease: Linear.easeNone});
		let torpedoEase = TweenMax.to(torpedoBitmap, 1, {x: tX, y: tY, paused: true, ease: Power1.easeIn, onComplete: function() {
			stage.removeChild(this.target);
		}});

		parts.push(new DooDad(0, torpedoBitmap, [torpedoEaseRotation, torpedoEase]));

		let torpedoMuzzle = this.createBitmap('torpedo-muzzle');
		torpedoMuzzle.x = sX;
		torpedoMuzzle.y = sY;
		torpedoMuzzle.scale = 1.5;
		if (battleAction.source.name != 'Player')
			torpedoMuzzle.rotation = 180;

		let torpedoMuzzleEase = TweenMax.to(torpedoMuzzle, 0.15, {scaleX: 0, scaleY: 1, paused: true, onComplete: function() {
			stage.removeChild(this.target);
		}})
		
		parts.push(new DooDad(0, torpedoMuzzle, torpedoMuzzleEase));

		// TODO: This DEFINITELY needs to be broken out
		let shrapnelCount = Math.floor(Math.random() * 5) + 10;
		for (let i = 0; i < shrapnelCount; i++) {
			let shrapBitmap = this.createBitmap('hit1');
			shrapBitmap.x = tX;
			shrapBitmap.y = tY;
			shrapBitmap.scale = Math.random() * 2 + 1;
			let newAngle = rads + (Math.random() * 1.5 - 0.75);
			let d = Math.random() * 75 + 50;
			let newX = Math.cos(newAngle) * d + tX;
			let newY = Math.sin(newAngle) * d + tY;

			let shrapEase = TweenLite.to(shrapBitmap, 1.2, {alpha: 0, x: newX, y: newY, rotation: Math.random() * 360, paused: true, ease: Power1.easeOut, onComplete: function() {
				stage.removeChild(this.target);
			}});

			parts.push(new DooDad(1000 + i * 10, shrapBitmap, shrapEase));
		}

		return parts;
	}

	displayGaussAction(battleAction) {
		let hardpoints = battleAction.source.data.hardpoints.filter(item => item.type == 'gauss');
		let numShots = 6;
		let targetPoint1 = this.getTargetHit(battleAction.target);
		let targetPoint2 = this.getTargetHit(battleAction.target);
		// TODO: ability to get target point from top or bottom half of target
		// 		 looks strange for weapons to cross the ship center line
		/*if (targetPoint1.y > targetPoint2.y) {
			// Yarp
			let temp = targetPoint2;
			targetPoint2 = targetPoint1;
			targetPoint2 = temp;
		}*/

		for (let i = 0; i < numShots; i++) {
			// hardcody!
			if (i % 2 == 0)
				this.animationQueue.push(...this.buildGaussShot(battleAction, hardpoints[0], i, targetPoint1));
			else
				this.animationQueue.push(...this.buildGaussShot(battleAction, hardpoints[1], i, targetPoint2));
		}
	}

	buildGaussShot(battleAction, hardpoint, iteration, targetPoint) {
		let parts = [];

		// TODO: Repeated math, consolidate
		let sX = battleAction.source.displayObject.x + hardpoint.x;
		let sY = battleAction.source.displayObject.y + hardpoint.y;
		let tX = battleAction.target.displayObject.x + targetPoint.x;
		let tY = battleAction.target.displayObject.y + targetPoint.y;

		let diffX = tX - sX;
		let diffY = tY - sY;
		let distance = Math.sqrt((diffX * diffX) + (diffY * diffY));

		let rads = Math.atan2(diffY, diffX);
		let degrees = this.radiansToDegrees(rads);

		// TODO: Yep, LOTS of repeated math - refactor when it's not almost 6am.
		//let hitBitmap = this.createBitmap

		let gaussBitmap = this.createBitmap('gauss-shot');
		let bmBounds = gaussBitmap.getBounds();

		gaussBitmap.x = sX;
		gaussBitmap.y = sY;
		gaussBitmap.rotation = degrees;
		gaussBitmap.scale = 1;

		let gaussEase = TweenMax.to(gaussBitmap, 0.5, {x: tX, y: tY, paused: true, onComplete: function() {
				stage.removeChild(this.target);
		}});
		
		parts.push(new DooDad(200 * iteration, gaussBitmap, gaussEase));

		let gaussMuzzle = this.createBitmap('gauss-muzzle');
		gaussMuzzle.x = sX;
		gaussMuzzle.y = sY;
		// Moar hardcody! Bad Mike!
		if (battleAction.source.name != 'Player')
			gaussMuzzle.rotation = 180;

		let gaussMuzzleScaleEase = TweenMax.to(gaussMuzzle, 0.2, {scale: 0.3, paused: true});
		let gaussMuzzleAlphaEase = TweenMax.to(gaussMuzzle, 0.2, {alpha: 0, paused: true, delay: 0.1, onComplete: function() {
			stage.removeChild(this.target);
		}});
		parts.push(new DooDad(200 * iteration, gaussMuzzle, [gaussMuzzleScaleEase, gaussMuzzleAlphaEase]));

		let shrapnelCount = Math.floor(Math.random() * 5) + 4;
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

			parts.push(new DooDad(200 * iteration + 450, shrapBitmap, shrapEase));
		}

		return parts;
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