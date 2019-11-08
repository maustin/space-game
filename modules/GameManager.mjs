//import { AssetLibrary, AssetInstance } from './AssetLibrary.mjs';
import { StageManager } from './StageManager.mjs';
import { BattleAction } from './BattleAction.mjs';

const STARTING_SHIELDS = 30;
const STARTING_ARMOR = 30;
const STARTING_STRUCTURE = 10;

const BATTLE_MESSAGE_SUCCESS = 'message_success';
const BATTLE_MESSAGE_MISSED = 'message_missed';
const BATTLE_MESSAGE_FAILED = 'message_failed';

// TODO: This could extend Bitmap or such
class Player {
	constructor(name, mods, displayObject, data) {
		this.name = name;
		this.mods = mods;
		this.displayObject = displayObject;
		this.data = data;
		//this.assetInstance = assetInstance;
		// TODO: Starting values should come from JSON or something
		this.shieldsMax = STARTING_SHIELDS;
		this.armorMax = STARTING_ARMOR;
		this.structureMax = STARTING_STRUCTURE;
		this.activatedMod = null;
		this.round = 0;

		mods.forEach(mod => {
			if (mod.mod_type == 'passive') {
				// a bit hard-coded here to save time
				if (mod.damage_type == 'shields')
					this.shieldsMax += this.shieldsMax * mod.adjust_value;
				if (mod.damage_type == 'armor')
					this.armorMax += this.armorMax * mod.adjust_value;
			}
		});

		this.shields = this.shieldsMax;
		this.armor = this.armorMax;
		this.structure = this.structureMax;
	}
}

class GameManager {
	constructor(uiStateManager, stageManager) {
		this.uiStateManager = uiStateManager;
		//this.canvasHandler = canvasHandler;
		//this.assetLibrary = assetLibrary;
		this.stageManager = stageManager;
		this.modsData = null;
		this.player1 = null;
		this.player2 = null;
		this.selectedModIds = null;
		this.battleActions = null;
		//this.isSinglePlayer = true;

		addEventListener('state_changed', event => this.handleUIStateChanged(event));
		// I'd like to only add this when the player is on the correct screen,
		// but removing it when they leave the arms screen is... difficult. So it's here forever.
		addEventListener('mod_selection_changed', event => this.handleModSelectionChanged(event));
		addEventListener('battle_option_selected', event => this.handleBattleOptionSelected(event));
	}

	setModsContent(modsData) {
		this.modsData = modsData;
	}

	handleUIStateChanged(event) {
		//this.canvasHandler.stop();
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
		this.stageManager.reset();
	}

	activateInstructions() {
		console.log('activateInstructions');
	}

	activateArms() {
		console.log('activateArms');
		this.selectedModIds = null;
		this.uiStateManager.resetArms();
	}

	activateBattle() {
		console.log('activateBattle');
		this.round = 0;
		this.battleActions = [];

		// build players
		this.player1 = this.buildPlayer('Player', this.selectedModIds, 'player1');
		this.player2 = this.buildPlayer('Computer', null, 'player2');

		// build UI & canvas
		this.uiStateManager.updateBattleStats(this.player1, this.player2);
		this.stageManager.setupBattleScreen(this.player1, this.player2);
		
		this.startBattleRound();
	}

	buildPlayer(name, selectedModIds, assetId) {
		if (!selectedModIds) {
			selectedModIds = this.getAIModIds();
		}

		let selectedMods = this.modsData.filter(mod => selectedModIds.indexOf(mod.id) > -1);
		let displayObject = this.stageManager.createBitmap(assetId);
		let manifestObject = this.stageManager.getManifestObject(assetId);

		displayObject.name = assetId;

		return new Player(name, selectedMods, displayObject, manifestObject.data);
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
		this.uiStateManager.prepareForBattleMessages();

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
		this.applyDamage(this.player1, this.player2, player1AdjustValue, this.player1.activatedMod);
		this.applyDamage(this.player2, this.player1, player2AdjustValue, this.player2.activatedMod);

		this.doBattleMessageLoop();
	}

	doBattleMessageLoop() {
		let nextMessage = this.battleActions.shift();
		if (!nextMessage) {
			this.checkGameOver();
			return;
		}

		this.uiStateManager.displayBattleMessage(nextMessage);
		// TODO: these should update continuously
		//this.uiStateManager.updateBattleStats(this.player1, this.player2);
		this.stageManager.displayBattleAction(nextMessage);

		setTimeout(() => this.doBattleMessageLoop(), nextMessage.delay);
	}

	getBoostedValue(source, target, adjustValue) {
		let boosts = this.getModsMatchingActivatedType(source, 'boost');
		
		boosts.forEach(mod => {
			if (mod.adjust_scale == 'percent') {
				//console.log('Boost ' + adjustValue + ' by ' + mod.adjust_value + ' percent');
				adjustValue += adjustValue * mod.adjust_value;
			}
			else {
				//console.log('Boost ' + adjustValue + ' by ' + mod.adjust_value + ' points');
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
					//console.log('torpedo shot down');
				}
			}
			else {
				if (mod.adjust_value == 'percent') {
					//console.log('Reduce ' + adjustValue + ' by ' + mod.adjust_value + ' percent');
					adjustValue += adjustValue * mod.adjust_value;
				}
				else {
					//console.log('Reduce ' + adjustValue + ' by ' + mod.adjust_value + ' points');
					adjustValue += mod.adjust_value;
				}
			}

			this.battleActions.push(this.buildBattleAction(source, target, mod, BATTLE_MESSAGE_SUCCESS));
		});

		//console.log("returning", adjustValue);

		return adjustValue;
	}

	applyDamage(origin, target, value, mod) {
		//console.log("applyDamage", value);
		if (value <= 0) {
			this.battleActions.push(this.buildBattleAction(origin, target, mod, BATTLE_MESSAGE_FAILED));
			return;
		}

		// showAnimation is set false after the first action.
		// this is to prevent multiple shots displaying for each defense hit (shield, armor, structure)
		let showAnimation = true;

		if (target.shields > 0) {
			let startingShields = target.shields;
			let endingShields = startingShields;

			if (origin.activatedMod.id == 'laser') {
				endingShields -= value * 0.5;
			}
			else {
				endingShields -= value;
			}

			// Rounding for now. Maybe revisit.
			endingShields = Math.round(endingShields);
			let overflow = 0;
			
			// if more than shields, set shields to 0, value to difference
			if (endingShields < 0) {
				overflow = 0 - endingShields;
				endingShields = 0;
			}

			target.shields = endingShields;
			let action = this.buildBattleAction(origin, target, mod, BATTLE_MESSAGE_SUCCESS, startingShields - endingShields, 'Shields');
			action.isVisible = showAnimation;
			showAnimation = false;
			this.battleActions.push(action);

			// if shields left, we're done
			if (target.shields > 0 || overflow == 0)
				return;

			// otherwise, continue the damage down
			value = overflow;
		}

		if (target.armor > 0) {
			let startingArmor = target.armor;
			let endingArmor = startingArmor;

			if (origin.activatedMod.id == 'gauss') {
				endingArmor -= value * 0.5;
			}
			else {
				endingArmor -= value;
			}

			endingArmor = Math.round(endingArmor);
			let overflow = 0;

			if (endingArmor < 0) {
				overflow = 0 - endingArmor;
				endingArmor = 0;
			}

			target.armor = endingArmor;
			let action = this.buildBattleAction(origin, target, mod, BATTLE_MESSAGE_SUCCESS, startingArmor - endingArmor, 'Armor');
			action.isVisible = showAnimation;
			showAnimation = false;
			this.battleActions.push(action);

			if (target.armor > 0 || overflow == 0)
				return;

			// overflow
			value = overflow;
		}

		let startingStructure = target.structure;
		let endingStructure = startingStructure;

		endingStructure -= value;
		endingStructure = Math.round(endingStructure);
		if (endingStructure < 0)
			endingStructure = 0;

		target.structure = endingStructure;

		let action = this.buildBattleAction(origin, target, mod, BATTLE_MESSAGE_SUCCESS, startingStructure - endingStructure, 'Structure');
		action.isVisible = showAnimation;
		this.battleActions.push(action);
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
		this.uiStateManager.updateBattleStats(this.player1, this.player2);

		if (this.player1.structure <= 0 || this.player2.structure <= 0) {
			if (this.player1.structure > 0 && this.player2.structure <= 0)
				this.uiStateManager.showGameOver(this.player1);
			else if (this.player1.structure <= 0 && this.player2 > 0)
				this.uiStateManager.showGameOver(this.player2);
			else
				this.uiStateManager.showGameOver();
		}
		else
			this.startBattleRound();

	}

	activateGameOver() {
		console.log('activateGameOver');
	}
}

export { GameManager };