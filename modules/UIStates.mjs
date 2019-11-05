const UI_STATES = [
	{
		id: ".loading-screen",
		mode: "block",
		event: "",
		links: [],
		element: null
	},
	{
		id: ".splash-screen",
		mode: "block",
		event: "activate_splash",
		links: [
		{
			buttonId: "#play-single",
			targetId: ".select-arms-screen",
			canContinue: null
		},
		{
			buttonId: "#play-multi",
			targetId: "",
			canContinue: () => { return false; }
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
		event: "activate_instructions",
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
		event: "activate_arms",
		links: [
		{
			buttonId: "#arms-continue",
			targetId: ".battle-screen",
			canContinue: null // this will be set by GameMaster or UIStateManager
		}],
		element: null,
	},
	{
		id: ".battle-screen",
		mode: "flex",
		event: "activate_battle",
		links: [],
		element: null
	},
	{
		id: ".game-over-screen",
		mode: "flex",
		event: "activate_game_over",
		links: [
		{
			buttonId: "#game-over-continue",
			targetId: ".splash-screen",
			canContinue: null
		}],
		element: null
	}];

export { UI_STATES };