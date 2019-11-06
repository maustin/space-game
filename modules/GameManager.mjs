class GameManager {
	constructor(uiStateManager, canvasHandler) {
		this.uiStateManager = uiStateManager;
		this.canvasHandler = canvasHandler;

		//this.uiStateManager.addEventListener('state_changed', (event) => { handleUIStateChanged(event); });
	}

	handleUIStateChanged(event) {
		//this.canvasHandler.stop();
	}
}

export { GameManager };