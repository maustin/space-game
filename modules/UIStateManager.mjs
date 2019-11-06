import { UI_STATES } from './UIStates.mjs';

class UIStateManager {
	constructor() {
		this.currentState = UI_STATES[0];// assumption 

		for (let state of UI_STATES) {
			state.element = document.querySelector(state.id);
			for (let link of state.links) {
				let button = document.querySelector(link.buttonId);
				if (button != null) {
					/* EXISTENTIAL CRISIS */
					// The following is not possible in other languages I've worked on
					// and is poor OOP. But it's possible in JS....
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
			let temp = modJson.adjust_value + (modJson.adjust_scale == 'percent' ? '%' : ' points');
			str = str.replace('$val', temp);
		}

		return str;
	}

	modSelectHandler(event) {
		let numSelected = 0;
		let leftGroup = document.querySelector('.left-mods-group');
		let rightGroup = document.querySelector('.right-mods-group');

		let selectedMods = Array.from(leftGroup.querySelectorAll('input:checked')).concat(
			Array.from(rightGroup.querySelectorAll('input:checked')));
		let unselectedMods = Array.from(leftGroup.querySelectorAll('input:not(:checked)')).concat(
			Array.from(rightGroup.querySelectorAll('input:not(:checked)')));

		if (selectedMods.length == 3)
			this.setModsIsDisabled(true, unselectedMods);
		else if (selectedMods.length < 3)
			this.setModsIsDisabled(false, unselectedMods);
		// TODO: check for cheating? Keyboard tabbing can get to the disabled mods

		let selectedModIds = [];
		selectedMods.forEach(element => selectedModIds.push(element.parentElement.getAttribute('modid')));
		dispatchEvent(new CustomEvent('mod_selection_changed', { detail: selectedModIds }));

		// TODO: Enable/disable continue button
	}

	setModsIsDisabled(isDisabled, mods) {
		mods.forEach(element => element.parentElement.classList.toggle('is-disabled', isDisabled));
	}
}


export { UIStateManager };

// state
//	0 splash
//	1 instructions
//	2 arms
//	3 battle
//		- Battle will have 2 substates: choose attack, resolve attack
//	4 gameover



// container element
// original mode
// continue callback