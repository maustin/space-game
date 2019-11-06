class GameManager {
	constructor(uiStateManager, canvasHandler) {
		this.uiStateManager = uiStateManager;
		this.canvasHandler = canvasHandler;

		addEventListener('state_changed', (event) => { this.handleUIStateChanged(event) });
	}

	handleUIStateChanged(event) {
		this.canvasHandler.stop();
		if (this[event.detail] != undefined)
			this[event.detail]();
	}

	activateSplash() {
		console.log('activateSplash');
	}

	activateInstructions() {
		console.log('activateInstructions');
	}

	activateArms() {
		console.log('activateArms');
	}

	activateBattle() {
		console.log('activateBattle');
	}

	activateGameOver() {
		console.log('activateGameOver');
	}
}

export { GameManager };