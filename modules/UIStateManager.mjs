import { UI_STATES } from './UIStates.mjs';

class UIStateManager {
	constructor() {
		// This is JavaScript. I don't think I need to pass a reference
		// to the document when it's a readily accessible global.
		//this.dom = dom;
		this.currentState = UI_STATES[0];// assumptions are baaad

		for (let state of UI_STATES) {
			state.element = document.querySelector(state.id);
			for (let link of state.links) {
				// HACK! Hardcoding this so I can worry about other things first.
				if (link.buttonId == "#arms-continue")
					link.canContinue = this.validateArmsSelected;

				let button = document.querySelector(link.buttonId);
				if (button != null) {
					/* EXISTENTIAL CRISIS */
					// The following is not possible in other languages I've worked on
					// and would prob be poor OOP. But it's a feature of JS....
					button.targetId = link.targetId;
					button.canContinue = link.canContinue;

					button.addEventListener('click', event=>this.buttonClickHandler(event));
				}
			}
		}
	}

	init() {
		// Another dirty dirty assumption about this array
		this.activateState(UI_STATES[1].id);
	}

	buttonClickHandler(event) {
		let button = event.currentTarget;
		if (button.canContinue == null || button.canContinue()) {
			this.activateState(button.targetId);
		}
		else {
			console.log("Button " + button.id + " failed canContinue()");
		}
	}

	validateArmsSelected() {
		return true;
	}

	activateState(stateId) {
		let nextState = UI_STATES.find(state => state.id == stateId);
		if (nextState == null) {
			console.log("ERROR: Cannot find state with id '" + stateId + "'");
			return;
		}

		this.currentState.element.style.display = "none";

		this.currentState = nextState;
		this.currentState.element.style.display = this.currentState.mode;

		dispatchEvent(new Event('state_changed'));// TODO: testing
		dispatchEvent(new Event(this.currentState.event));
	}

	setArmsContent(modsJSON) {
		let modTeplate = document.querySelector("#mod-template");
		let offensiveMods = document.querySelector(".left-mods-group");
		let supportMods = document.querySelector(".right-mods-group");

		for (let data of modsJSON.mods) {
			let newMod = document.importNode(modTeplate.content, true);
			let label = newMod.querySelector("label");
			label.querySelector(".mod-title").innerText = data.name;
			label.querySelector(".arms-detail").innerText = this.formatModDescription(data);
			newMod.addEventListener('change', (event)=>{ this.modSelectHandler(event) });
			// ActionScript me hates the following.
			newMod.json = data;

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
			str = str.replace('$hit', (modJson.hit_chance * 100) + "%");
		}
		else if (str.includes('$val')) {
			let temp = modJson.adjust_value + (modJson.adjust_scale == "percent" ? "%" : " points");
			str = str.replace('$val', temp);
		}

		return str;
	}

	modSelectHandler(event) {
		// do thing
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