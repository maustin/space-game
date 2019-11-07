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
			if (mod.mod_type == "passive") {
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
		this.player1.activatedMod = this.modsData.find(mod => mod.id == event.detail);

		// Get AI play
		let aiOptions = this.player2.mods.filter(mod => mod.isOffensive);
		this.player2.activatedMod = aiOptions[Math.floor(Math.random() * aiOptions.length)];

		this.resolveBattle();
	}

	resolveBattle() {
		// TODO: I think I really want no passive mods. Make everything an action.
		// Until then...
		
		// Apply boosts
		let player1AdjustValue = this.player1.activatedMod.adjust_value;
		player1AdjustValue = this.getBoostedValue(this.player1, player1AdjustValue);

		let player2AdjustValue = this.player2.activatedMod.adjust_value;
		player2AdjustValue = this.getBoostedValue(this.player2, player2AdjustValue);

		// Activate defenses
		player1AdjustValue = this.getReactedValue(this.player1, player1AdjustValue);
		player2AdjustValue = this.getReactedValue(this.player2, player2AdjustValue);

		// Apply
		console.log("Player 1:");
		this.applyDamage(this.player1, this.player2, player1AdjustValue);
		console.log("Player 2:");
		this.applyDamage(this.player2, this.player1, player2AdjustValue);

		// Play animation

		this.uiStateManager.updateBattleStats(this.player1, this.player2);

		this.checkGameOver();
	}

	applyDamage(origin, target, value) {
		if (value <= 0)
			return;

		if (target.shields > 0) {
			if (origin.activatedMod.id == 'laser') {
				target.shields -= value * 0.5;
				console.log("Hit shields half for " + (value * 0.5));
			}
			else {
				target.shields -= value;
				console.log("Hit shields for " + value);
			}

			if (target.shields > 0)
				return;

			// excess damage will overflow
			value = target.shields * -1;
			console.log("Overflow shields by " + value);
			target.shields = 0;
		}

		if (target.armor > 0) {
			if (origin.activatedMod.id == 'gauss') {
				console.log("Hit armor half for " + (value * 0.5));
				target.armor -= value * 0.5;
			}
			else {
				console.log("Hit armor for " + value);
				target.armor -= value;
			}

			if (target.armor > 0)
				return;

			// overflow
			value = target.armor * -1;
			console.log("Overflow armor by " + value);
			target.armor = 0;
		}

		//if (target.structure)
		console.log("Hit structure for " + value);
		target.structure -= value;
	}

	getBoostedValue(player, adjustValue) {
		let boosts = this.getModsMatchingActivatedType(player, 'boost');
		//console.log("boosts");
		//console.log(boosts);
		boosts.forEach(mod => {
			if (mod.adjust_scale == 'percent') {
				console.log('Boost ' + adjustValue + ' by ' + mod.adjust_value + ' percent');
				adjustValue += adjustValue * mod.adjust_value;
			}
			else {
				console.log('Boost ' + adjustValue + ' by ' + mod.adjust_value + ' points');
				adjustValue += mod.adjust_value;
			}
		});

		return adjustValue;
	}

	getReactedValue(player, adjustValue) {
		let reacts = this.getModsMatchingActivatedType(player, 'react');
		console.log("reacts");
		console.log(reacts);
		reacts.forEach(mod => {
			// hardcode
			if (mod.id == 'anti_torpedo') {
				if (Math.random() < mod.hit_chance) {
					adjustValue = 0;// torpedo was shot down
					console.log('torpedo shot down');
				}
			}
			else {
				if (mod.adjust_value == 'percent') {
					console.log('Reduce ' + adjustValue + ' by ' + mod.adjust_value + ' percent');
					adjustValue += adjustValue * mod.adjust_value;
				}
				else {
					console.log('Reduce ' + adjustValue + ' by ' + mod.adjust_value + ' points');
					adjustValue += mod.adjust_value;
				}
			}
		});

		return adjustValue;
	}

	getModsMatchingActivatedType(player, type) {
		return player.mods.filter(mod => (mod.mod_type == type && mod.damage_type == player.activatedMod.damage_type));
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
		
		this.startBattleRound();
	}

	startBattleRound() {
		//this.round++;
		this.uiStateManager.showBattleOptions(this.player1.mods.filter(mod => mod.isOffensive));
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

	checkGameOver() {
		if (this.player1.structure <= 0 || this.player2.structure <= 0)
			activateGameOver();
	}

	activateGameOver() {
		console.log('activateGameOver');
	}
}

export { GameManager };