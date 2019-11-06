const UI_STATES = [
	{
		id: ".loading-screen",
		mode: "block",
		invoke: "",
		links: [],
		element: null
	},
	{
		id: ".splash-screen",
		mode: "block",
		invoke: "activateSplash",
		links: [
		{
			buttonId: "#play-single",
			targetId: ".select-arms-screen",
			canContinue: null
		},
		{
			buttonId: "#play-multi",
			targetId: "",
			canContinue: null
			//canContinue: () => { return false; }
		},
		{
			buttonId: "#play-instructions",
			targetId: ".instructions-screen",
			canContinue: null
		}],
		element: null
	},
	{
		id: ".instructions-screen",
		mode: "flex",
		invoke: "activateInstructions",
		links: [
		{
			buttonId: "#instructions-continue",
			targetId: ".splash-screen",
			canContinue: null
		}],
		element: null,
	},
	{
		id: ".select-arms-screen",
		mode: "grid",
		invoke: "activateArms",
		links: [
		{
			buttonId: "#arms-continue",
			targetId: ".battle-screen",
			canContinue: "validateArmsSelected"
		}],
		element: null,
	},
	{
		id: ".battle-screen",
		mode: "flex",
		invoke: "activateBattle",
		links: [],
		element: null
	},
	{
		id: ".game-over-screen",
		mode: "flex",
		invoke: "activateGameOver",
		links: [
		{
			buttonId: "#game-over-continue",
			targetId: ".splash-screen",
			canContinue: null
		}],
		element: null
	}];

export { UI_STATES };