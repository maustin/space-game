class Player {
	constructor() {
		this.id;
		this.shields;
		this.armor;
		this.structure;
		this.mods
	}
}

class GameManager {
	constructor(uiStateManager, canvasHandler) {
		this.uiStateManager = uiStateManager;
		this.canvasHandler = canvasHandler;
		this.modsData = null;
		this.player1 = null;
		this.player2 = null;
		this.selectedModIds = null;
		//this.isSinglePlayer = true;

		addEventListener('state_changed', event => this.handleUIStateChanged(event));
		// I'd like to only add this when the player is on the correct screen,
		// but removing it when they leave the arms screen is... difficult.
		addEventListener('mod_selection_changed', event => this.handleModSelectionChanged(event));
	}

	setModsContent(modsData) {
		this.modsData = modsData;
	}

	handleUIStateChanged(event) {
		this.canvasHandler.stop();
		if (this[event.detail] != undefined)
			this[event.detail]();
	}

	handleModSelectionChanged(event) {
		this.selectedModIds = event.detail;
	}

	activateSplash() {
		console.log('activateSplash');
		//this.canvasHandler.playStarfield();
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