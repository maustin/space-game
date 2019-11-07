import { UI_STATES } from './UIStates.mjs';
import { BattleAction } from './BattleAction.mjs';

class UIStateManager {
	constructor() {
		this.currentState = UI_STATES[0];// assumption 

		for (let state of UI_STATES) {
			state.element = document.querySelector(state.id);
			for (let link of state.links) {
				let button = document.querySelector(link.buttonId);
				if (button != null) {
					// TODO: This should prob be attributes or dataset
					button.targetId = link.targetId;
					button.canContinue = link.canContinue;

					button.addEventListener('click', event=> {
						event.preventDefault();
						this.buttonClickHandler(event);
					});
				}
			}
		}
	}

	init() {
		// TODO: eliminate this assumption
		this.activateState(UI_STATES[1].id);
	}

	buttonClickHandler(event) {
		let button = event.currentTarget;
		if (button.canContinue == null || this[button.canContinue]()) {
			this.activateState(button.targetId);
		}
		else {
			console.log('Button ' + button.id + ' failed canContinue()');
		}
	}

	validateArmsSelected() {
		let leftGroup = document.querySelector('.left-mods-group');
		return leftGroup.querySelectorAll('input:checked').length > 0;
	}

	activateState(stateId) {
		let nextState = UI_STATES.find(state => state.id == stateId);
		if (nextState == null) {
			console.log('ERROR: Cannot find state with id: ' + stateId);
			return;
		}

		this.currentState.element.style.display = 'none';

		this.currentState = nextState;
		this.currentState.element.style.display = this.currentState.mode;

		dispatchEvent(new CustomEvent('state_changed', { detail: this.currentState.invoke }));
	}

	setModsContent(modsData) {
		let modTeplate = document.querySelector('#mod-template');
		let offensiveMods = document.querySelector('.left-mods-group');
		let supportMods = document.querySelector('.right-mods-group');

		for (let data of modsData) {
			let newMod = document.importNode(modTeplate.content, true);
			let input = newMod.querySelector('input');
			let label = newMod.querySelector('label');
			label.querySelector('.mod-title').innerText = data.name;
			label.querySelector('.arms-detail').innerText = this.formatModDescription(data);
			input.addEventListener('change', (event)=>{ this.modSelectHandler(event) });
			
			label.setAttribute('modid', data.id);

			if (data.isOffensive) {
				offensiveMods.appendChild(newMod);
			}
			else {
				supportMods.appendChild(newMod);
			}
		}
	}

	formatModDescription(modJson) {
		let str = modJson.description;
		if (str.includes('$hit')) {
			str = str.replace('$hit', (modJson.hit_chance * 100) + '%');
		}
		else if (str.includes('$val')) {
			let temp;
			if (modJson.adjust_scale == 'percent') {
				temp = (modJson.adjust_value * 100) + "%";
			}
			else {
				temp = modJson.adjust_value + " points";
			}
			//let temp = modJson.adjust_value + (modJson.adjust_scale == 'percent' ? '%' : ' points');
			str = str.replace('$val', temp);
		}

		return str;
	}

	resetArms() {
		let leftGroup = document.querySelector('.left-mods-group');
		let rightGroup = document.querySelector('.right-mods-group');

		let selectedMods = Array.from(leftGroup.querySelectorAll('input:checked')).concat(
			Array.from(rightGroup.querySelectorAll('input:checked')));

		selectedMods.forEach(element => element.checked = false);

		let unselectedMods = Array.from(leftGroup.querySelectorAll('input:not(:checked)')).concat(
			Array.from(rightGroup.querySelectorAll('input:not(:checked)')));
		
		this.setModsIsDisabled(false, unselectedMods);
	}	

	modSelectHandler(event) {
		let numSelected = 0;
		let leftGroup = document.querySelector('.left-mods-group');
		let rightGroup = document.querySelector('.right-mods-group');

		let selectedMods = Array.from(leftGroup.querySelectorAll('input:checked')).concat(
			Array.from(rightGroup.querySelectorAll('input:checked')));
		let unselectedMods = Array.from(leftGroup.querySelectorAll('input:not(:checked)')).concat(
			Array.from(rightGroup.querySelectorAll('input:not(:checked)')));

		console.log(selectedMods[0]);

		if (selectedMods.length == 3)
			this.setModsIsDisabled(true, unselectedMods);
		else if (selectedMods.length < 3)
			this.setModsIsDisabled(false, unselectedMods);
		// TODO: check for cheating? Keyboard tabbing can get to the disabled mods

		let selectedModIds = [];
		selectedMods.forEach(element => selectedModIds.push(element.parentElement.getAttribute('modid')));
		dispatchEvent(new CustomEvent('mod_selection_changed', { detail: selectedModIds }));
	}

	setModsIsDisabled(isDisabled, mods) {
		mods.forEach(element => element.parentElement.classList.toggle('is-disabled', isDisabled));
	}

	setRound(roundNum) {
		document.querySelector('.battle-round').innerText = "Round " + roundNum;
	}

	updateBattleStats(player1, player2) {
		this.updatePlayerStats(player1, document.querySelector('.battle-stats-left'));
		this.updatePlayerStats(player2, document.querySelector('.battle-stats-right'));
	}

	updatePlayerStats(player, container) {
		let shieldValue = container.querySelector('.shield-value');
		let shieldMeter = container.querySelector('.shield-meter');
		let armorValue = container.querySelector('.armor-value');
		let armorMeter = container.querySelector('.armor-meter');
		let structureValue = container.querySelector('.structure-value');
		let structureMeter = container.querySelector('.structure-meter');

		shieldValue.innerText = player.shields + "/" + player.shieldsMax;
		shieldMeter.value = player.shields / player.shieldsMax;
		armorValue.innerText = player.armor + "/" + player.armorMax;
		armorMeter.value = player.armor / player.armorMax;
		structureValue.innerText = player.structure + "/" + player.structureMax;
		structureMeter.value = player.structure / player.structureMax;
	}

	showBattleOptions(actionableMods) {
		// TODO: should not be hard-coding style
		document.querySelector('.battle-round-result').style.display = 'none';
		document.querySelector('.battle-action-row').style.display = 'flex';

		let actionsContainer = document.querySelector('.battle-actions');

		while (actionsContainer.children.length > 0)
			actionsContainer.children[0].remove();

		actionableMods.forEach(mod => {
			let action = document.createElement('p');
			action.innerText = mod.useMessage;
			action.setAttribute('modid', mod.id);
			action.addEventListener('click', event => this.actionSelectHandler(event));
			actionsContainer.appendChild(action);
		});
	}

	displayBattleMessages(actions) {
		//battle-round-result
		let container = document.querySelector('.battle-round-result');
		while (container.children.length > 0)
			container.children[0].remove();

		for (let action of actions) {
			let newElement = document.createElement('p');
			newElement.innerText = action.message;
			container.appendChild(newElement);
		}
	}

	actionSelectHandler(event) {
		document.querySelector('.battle-action-row').style.display = 'none';
		document.querySelector('.battle-round-result').style.display = 'block';

		dispatchEvent(new CustomEvent('battle_option_selected', {
			detail: event.currentTarget.getAttribute('modid')
		}));
	}
	
	showGameOver(winner) {
		this.activateState('.game-over-screen');

		let messageElement = document.querySelector('.game-over-message');
		if (winner)
			messageElement.innerText = winner.name + " WINS!";
		else
			messageElement.innerText = "DRAW!";
	}
}


export { UIStateManager };