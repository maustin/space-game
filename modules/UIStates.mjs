const UI_STATES = [
	{
		id: ".splash-screen",
		mode: "block",
		event: "activate_splash",
		links: [
		{
			button_id: "#play-single",
			target_id: ".select-arms-screen",
			canContinue: null
		},
		{
			button_id: "#play-multi",
			target_id: "",
			canContinue: () => { return false; }
		},
		{
			button_id: "#play-instructions",
			target_id: ".instructions-screen",
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
			button_id: "#instructions-continue",
			target_id: ".splash-screen",
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
			button_id: "#arms-continue",
			target_id: ".battle-screen",
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
			button_id: "#game-over-continue",
			target_id: ".splash-screen",
			canContinue: null
		}],
		element: null
	}];

export { UI_STATES };