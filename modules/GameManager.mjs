import { BattleAction } from './BattleAction.mjs';

const BATTLE_MESSAGE_SUCCESS = "message_success";
const BATTLE_MESSAGE_MISSED = "message_missed";
const BATTLE_MESSAGE_FAILED = "message_failed";

class Player {
	constructor(name, mods) {
		//this.id;
		// TODO: Starting values from somewhere
		this.name = name;
		this.shieldsMax = 100;
		this.armorMax = 100;
		this.structureMax = 10;
		this.mods = mods;
		this.activatedMod = null;
		this.round = 0;

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
		this.battleActions = null;
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
		this.round = 0;

		// build players
		this.player1 = this.buildPlayer("Player", this.selectedModIds);
		this.player2 = this.buildPlayer("Computer");

		// build UI
		this.uiStateManager.updateBattleStats(this.player1, this.player2);

		this.battleActions = [];
		
		this.startBattleRound();
	}

	buildPlayer(name, selectedModIds) {
		if (!selectedModIds) {
			selectedModIds = this.getAIModIds();
		}

		let selectedMods = this.modsData.filter(mod => selectedModIds.indexOf(mod.id) > -1);

		return new Player(name, selectedMods);
	}

	startBattleRound() {
		this.round++;
		this.battleActions.length = 0;
		this.uiStateManager.setRound(this.round);
		this.uiStateManager.showBattleOptions(this.player1.mods.filter(mod => mod.isOffensive));
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

	resolveBattle() {
		// TODO: I think I really want no passive mods. Make everything an action.
		// Until then...
		let player1AdjustValue = this.player1.activatedMod.adjust_value;
		let player2AdjustValue = this.player2.activatedMod.adjust_value;
		
		// Apply boosts
		player1AdjustValue = this.getBoostedValue(this.player1, this.player2, player1AdjustValue);
		player2AdjustValue = this.getBoostedValue(this.player2, this.player1, player2AdjustValue);

		// Activate defenses
		player1AdjustValue = this.getReactedValue(this.player1, this.player2, player1AdjustValue);
		player2AdjustValue = this.getReactedValue(this.player2, this.player1, player2AdjustValue);

		// Apply
		console.log("Player 1:");
		this.applyDamage(this.player1, this.player2, player1AdjustValue, this.player1.activatedMod);
		console.log("Player 2:");
		this.applyDamage(this.player2, this.player1, player2AdjustValue, this.player2.activatedMod);

		// Play animation
		// Animation, messages, and battle stats should prob all be tied together
		this.uiStateManager.displayBattleMessages(this.battleActions);
		this.uiStateManager.updateBattleStats(this.player1, this.player2);

		setTimeout(() => this.checkGameOver(), 10000);
	}

	getBoostedValue(source, target, adjustValue) {
		let boosts = this.getModsMatchingActivatedType(source, 'boost');
		
		boosts.forEach(mod => {
			if (mod.adjust_scale == 'percent') {
				console.log('Boost ' + adjustValue + ' by ' + mod.adjust_value + ' percent');
				adjustValue += adjustValue * mod.adjust_value;
			}
			else {
				console.log('Boost ' + adjustValue + ' by ' + mod.adjust_value + ' points');
				adjustValue += mod.adjust_value;
			}

			this.battleActions.push(this.buildBattleAction(source, target, mod, BATTLE_MESSAGE_SUCCESS));
		});

		return adjustValue;
	}

	getReactedValue(source, target, adjustValue) {
		let reacts = this.getModsMatchingActivatedType(source, 'react');
		
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

			this.battleActions.push(this.buildBattleAction(source, target, mod, BATTLE_MESSAGE_SUCCESS));
		});

		console.log("returning", adjustValue);

		return adjustValue;
	}

	applyDamage(origin, target, value, mod) {
		console.log("applyDamage", value);
		if (value <= 0) {
			this.battleActions.push(this.buildBattleAction(origin, target, mod, BATTLE_MESSAGE_FAILED));
			return;
		}

		if (target.shields > 0) {
			let startingShields = target.shields;

			if (origin.activatedMod.id == 'laser') {
				target.shields -= value * 0.5;
				console.log("Hit shields half for " + (value * 0.5));
			}
			else {
				target.shields -= value;
				console.log("Hit shields for " + value);
			}

			// Rounding for now. Maybe revisit.
			target.shields = Math.round(target.shields);
			let endingShields = target.shields;
			if (endingShields < 0)
				endingShields = 0;
			this.battleActions.push(this.buildBattleAction(origin, target, mod, BATTLE_MESSAGE_SUCCESS, startingShields - endingShields, 'Shields'));

			if (target.shields > 0)
				return;

			// excess damage will overflow
			value = target.shields * -1;
			console.log("Overflow shields by " + value);
			target.shields = 0;
		}

		if (target.armor > 0) {
			let startingArmor = target.armor;

			if (origin.activatedMod.id == 'gauss') {
				console.log("Hit armor half for " + (value * 0.5));
				target.armor -= value * 0.5;
			}
			else {
				console.log("Hit armor for " + value);
				target.armor -= value;
			}

			target.armor = Math.round(target.armor);
			let endingArmor = target.armor;
			if (endingArmor < 0)
				endingArmor = 0;
			this.battleActions.push(this.buildBattleAction(origin, target, mod, BATTLE_MESSAGE_SUCCESS, startingArmor - endingArmor, 'Armor'));

			if (target.armor > 0)
				return;

			// overflow
			value = target.armor * -1;
			console.log("Overflow armor by " + value);
			target.armor = 0;
		}

		console.log("Hit structure for " + value);
		let startingStructure = target.structure;
		target.structure -= value;
		target.structure = Math.round(target.structure);
		let endingStructure = target.structure;
		if (endingStructure < 0)
			endingStructure = 0;
		this.battleActions.push(this.buildBattleAction(origin, target, mod, BATTLE_MESSAGE_SUCCESS, startingStructure - endingStructure, 'Structure'));

	}

	getModsMatchingActivatedType(player, type) {
		return player.mods.filter(mod => (mod.mod_type == type && mod.damage_type == player.activatedMod.damage_type));
	}

	buildBattleAction(source, target, mod, messageType, adjustValue, targetDefense) {
		let message = mod[messageType];
		// TODO: this could be streamlined
		// TODO: Also, prob doesn't need to be in GameManager?
		if (message.includes('$source'))
			message = message.replace('$source', source.name);
		if (message.includes('$target'))
			message = message.replace('$target', target.name);
		if (message.includes('$val'))
			message = message.replace('$val', adjustValue);
		if (message.includes('$defense'))
			message = message.replace('$defense', targetDefense);

		return new BattleAction(source, target, message, mod);
	}

	checkGameOver() {
		if (this.player1.structure <= 0 || this.player2.structure <= 0)
			this.uiStateManager.activateState('.game-over-screen');
		else
			this.startBattleRound();

	}

	activateGameOver() {
		console.log('activateGameOver');
	}
}

export { GameManager };