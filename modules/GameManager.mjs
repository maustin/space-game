class Player {
	constructor(mods) {
		//this.id;
		// TODO: Starting values from somewhere
		this.shieldsMax = 100;
		this.armorMax = 100;
		this.structureMax = 10;
		this.mods = mods;
		this.activatedMod = null;

		mods.forEach(mod => {
			if (mod.type == "passive") {
				// a bit hard-coded here to save time
				if (mod.damage_type == "shields")
					this.shieldsMax += this.shieldsMax * mod.adjust_value;
				if (mod.damage_type == "armor")
					this.armorMax += this.armorMax * mod.adjust_value;
			}
		});

		this.shields = this.shieldsMax;
		this.armor = this.armorMax;
		this.structure = this.structureMax;
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
		addEventListener('battle_option_selected', event => this.handleBattleOptionSelected(event));
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

	handleBattleOptionSelected(event) {
		//console.log("Selected " + event.detail);
		this.player1.activatedMod = this.modsData.find(mod => mod.id == event.detail);

		// Get AI play
		let aiOptions = this.player2.mods.filter(mod => mod.isOffensive);
		this.player2.activatedMod = aiOptions[Math.floor(Math.random() * aiOptions.length)];


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
		this.selectedModIds = null;
	}

	activateBattle() {
		console.log('activateBattle');
		// build players
		this.player1 = this.buildPlayer(this.selectedModIds);
		this.player2 = this.buildPlayer();

		// build UI
		this.uiStateManager.updateBattleStats(this.player1, this.player2);
		this.uiStateManager.showBattleOptions(this.player1.mods.filter(mod => mod.isOffensive));
		// listen for action
	}

	buildPlayer(selectedModIds) {
		if (!selectedModIds) {
			selectedModIds = this.getAIModIds();
		}

		let selectedMods = this.modsData.filter(mod => selectedModIds.indexOf(mod.id) > -1);

		return new Player(selectedMods);
	}

	getAIModIds() {
		let selectedModIds = [];

		// Must include at least 1 offensive mod
		let offensiveMods = this.modsData.filter(mod => mod.isOffensive);
		selectedModIds.push(offensiveMods[Math.floor(Math.random() * offensiveMods.length)].id);

		// select the rest
		while (selectedModIds.length < 3) {// TODO eliminate magic number
			selectedModIds.push(this.modsData[Math.floor(Math.random() * this.modsData.length)].id);
		}

		// TODO: The AI is not currently limited to selecting only 1 of any mod
		// For instance, they can have 2 shield mods. I think this is ok for now.
		
		return selectedModIds;
	}

	activateGameOver() {
		console.log('activateGameOver');
	}
}

export { GameManager };