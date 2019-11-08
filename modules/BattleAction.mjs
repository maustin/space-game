class BattleAction {
    constructor(source, target, message, mod) {
        this.source = source;
        this.target = target;
        this.message = message;
        this.mod = mod;
        this.isVisible = false;
        this.delay = 3000;
        
        this.shields = target.shields;
        this.armor = target.armor;
        this.structure = target.structure;
    }
}

export { BattleAction };