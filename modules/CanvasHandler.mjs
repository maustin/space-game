
const CIRCUIT_SPACE = 15;
const CIRCUIT_MAX_BLIPS = 10;

// JS has really poor image/pixel manipulation compared to
// ActionScript. But, I will do my best. /rant
class CanvasHandler {
	constructor() {
		this.canvas = document.querySelector('#canvas');
		this.ctx = this.canvas.getContext('2d');

		this.offscreenCanvas = document.createElement('canvas');
		this.offscreenCanvas.width = this.canvas.width;
		this.offscreenCanvas.height = this.canvas.height;
		this.offscreenCtx = this.offscreenCanvas.getContext('2d');

		this.doRenderLoop = false;
		this.updateMethod = null;
		this.baseImageData = null;
		this.overlayImageData = null;

		this.ctx.fillStyle = 'black';
		this.clear();
	}

	playCircuits() {
		this.circuitBlips = [];
		this.clear();
		this.offscreenCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
		this.overlayImageData = this.offscreenCtx.getImageData(0, 0, this.canvas.width, this.canvas.height);

		this.updateMethod = this.updateCircuits;
		this.generateCircuitsBg();

		this.doRenderLoop = true;
		this.drawFrame(0);
	}

	generateCircuitsBg() {
		let w = this.canvas.width;
		let h = this.canvas.height;
		let imageData = this.ctx.getImageData(0, 0, w, h);

		for (let x = 0; x <= w; x += CIRCUIT_SPACE) {
			for (let y = 0; y <= h; y++) {
				this.setPixel(imageData, x, y, 0, 25, 0);
			}
		}

		for (let x = 0; x <= w; x++) {
			for (let y = 0; y <= h; y += CIRCUIT_SPACE) {
				this.setPixel(imageData, x, y, 0, 25, 0);
			}
		}

		this.baseImageData = imageData;
	}

	updateCircuits() {
		this.decayOverlay();
		
		this.updateCircuitBlips();

		this.ctx.putImageData(this.baseImageData, 0, 0);
		this.offscreenCtx.putImageData(this.overlayImageData, 0, 0);
		this.ctx.drawImage(this.offscreenCanvas, 0, 0);
	}

	buildCircuitBlip() {
		/*for (let i = 0; i < CIRCUIT_MAX_BLIPS; i++) {
			let blip = {
				x: Math.floor(Math.random() * (this.canvas.width / CIRCUIT_SPACE)) * CIRCUIT_SPACE,
				y: Math.floor(Math.random() * (this.canvas.height / CIRCUIT_SPACE)) * CIRCUIT_SPACE,
				d: Math.floor(Math.random() * 4)
			};
			this.circuitBlips.push(blip);
		}*/
		return {
			x: Math.floor(Math.random() * (this.canvas.width / CIRCUIT_SPACE)) * CIRCUIT_SPACE,
			y: Math.floor(Math.random() * (this.canvas.height / CIRCUIT_SPACE)) * CIRCUIT_SPACE,
			d: Math.floor(Math.random() * 4)
		};
	}

	updateCircuitBlips() {
		while (this.circuitBlips.length < CIRCUIT_MAX_BLIPS) {
			this.circuitBlips.push(this.buildCircuitBlip());
		}

		for (let i = this.circuitBlips.length - 1; i > -1; i--) {
		//for (let blip of this.circuitBlips) {
			let blip = this.circuitBlips[i];

			if (blip.d == 0) blip.y--;
			else if (blip.d == 1) blip.x++;
			else if (blip.d == 2) blip.y++;
			else if (blip.d == 3) blip.x--;

			// Check for direction choice
			if (blip.x % CIRCUIT_SPACE == 0 && blip.y % CIRCUIT_SPACE == 0){
				let newD;
				do {
					newD = Math.floor(Math.random() * 4);
				} while ((newD == 0 && blip.d == 2) ||
					(newD == 1 && blip.d == 3) ||
					(newD == 2 && blip.d == 0) ||
					(newD == 3 && blip.d == 1));
				// Condition above doesn't allow direction to go back way it came

				blip.d = newD;
			}

			// handle out of bounds
			if (blip.x < 0 || blip.x >= this.canvas.width ||
				blip.y < 0 || blip.y >= this.canvas.height) {
				this.circuitBlips.splice(i, 1);
				continue;
			}

			this.setPixel(this.overlayImageData, blip.x, blip.y, 0, 255, 0);
		}
	}

	clear() {
		this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
	}

	stop() {
		console.log("GOT STOP");
		this.doRenderLoop = false;
	}

	drawFrame(tFrame) {
		if (this.doRenderLoop == false)
			return;

		window.requestAnimationFrame((tFrame) => this.drawFrame(tFrame));
		this.updateMethod();
	}

	generateImageData() {
		return this.ctx.createImageData(this.canvas.width, this.canvas.height);
	}

	decayOverlay() {
		let w = this.canvas.width;
		let h = this.canvas.height;
		let imageData = this.overlayImageData;

		// this may not be the best method
		for (let x = 0; x < w; x++) {
			for (let y = 0; y < h; y++) {
				let pixelIndex = (y * w + x) * 4;
				let val = imageData.data[pixelIndex + 3];
				if (val > 0) {
					val *= 0.75;
					if (val < 30)
						val = 0;

					imageData.data[pixelIndex + 3] = val;
				}
			}
		}
	}

	setPixel(imageData, x, y, red, green, blue) {
		let pixelIndex = (y * this.canvas.width + x) * 4;
		imageData.data[pixelIndex] = red;
		imageData.data[pixelIndex + 1] = green;
		imageData.data[pixelIndex + 2] = blue;
		imageData.data[pixelIndex + 3] = 255;// alpha, we'll add parameter if needed later
	}
}

export { CanvasHandler };