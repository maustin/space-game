class BattleAction {
    constructor(source, target, message, mod) {
        this.source = source;
        this.target = target;
        this.message = message;
        this.mod = mod;
        this.isVisible = true;
    }
}

export { BattleAction };