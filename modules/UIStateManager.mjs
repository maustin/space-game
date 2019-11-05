import { UI_STATES } from './UIStates.mjs';

class UIStateManager {
	constructor(passedDom) {
		console.log(passedDom);
		this.dom = passedDom;
		this.currentState = UI_STATES[0];// assumptions are baaad

		for (let state of UI_STATES) {
			state.element = this.dom.querySelector(state.id);
			for (let link of state.links) {
				// HACK! Hardcoding this so I can worry about other things first.
				if (link.buttonId == "#arms-continue")
					link.canContinue = this.validateArmsSelected;

				let button = this.dom.querySelector(link.buttonId);
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

		dispatchEvent(new Event(this.currentState.event));
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