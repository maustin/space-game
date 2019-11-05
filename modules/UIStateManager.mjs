import { UI_STATES } from 'UIStates.mjs';

class UIStateManager {
	constructor(dom) {
		this.dom = dom;
		this.currentState = null;

		for (let state of UI_STATES) {
			state.element = dom.querySelector(state.id);
		}
	}

	validateArmsSelected() {

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