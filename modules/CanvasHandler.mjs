
const CIRCUIT_SPACE = 15;

class CanvasHandler {
	constructor() {
		this.canvas = document.querySelector("#canvas");
		this.ctx = this.canvas.getContext("2d");
		this.frameId = null;
		this.updateMethod = null;
		this.baseImageData = null;
		this.overlayImageData = null;

		this.ctx.fillStyle = 'black';
		this.clear();
	}

	playCircuits() {
		this.clear();

		this.circuitBlips = [];
		for (let i = 0; i < 20; i++) {
			let blip = {
				x: Math.floor(Math.random() * (this.canvas.width / CIRCUIT_SPACE)) * CIRCUIT_SPACE,
				y: Math.floor(Math.random() * (this.canvas.height / CIRCUIT_SPACE)) * CIRCUIT_SPACE,
				d: Math.floor(Math.random() * 4)
			};
			this.circuitBlips.push(blip);
		}

		this.updateMethod = this.updateCircuits;
		this.generateCircuitsBg();
		this.overlayImageData = this.generateImageData();
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
		//this.ctx.putImageData(this.overlayImageData, 0, 0);
	}

	updateCircuitBlips() {
		for (let blip of this.circuitBlips) {
			if (blip.d == 0) blip.y--;
			else if (blip.d == 1) blip.x++;
			else if (blip.d == 2) blip.y++;
			else if (blip.d == 3) blip.x--;
		}
	}

	clear() {
		this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
	}

	drawFrame(tFrame) {
		this.frameId = window.requestAnimationFrame((tFrame) => this.drawFrame(tFrame));
		this.updateMethod();
	}

	generateImageData() {
		return this.ctx.createImageData(this.canvas.width, this.canvas.height);
	}

	decayOverlay() {
		let w = this.canvas.width;
		let h = this.canvas.height;


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