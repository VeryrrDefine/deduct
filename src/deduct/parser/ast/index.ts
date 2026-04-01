export class Proposition {
	toString() {
		return '[bx]';
	}
}
export class LetterPropositionAST extends Proposition {
	name;
	constructor(name?: string) {
		super();
		this.name = name ?? '';
	}
	toString(): string {
		return this.name;
	}
}

export class AnyPropositionAST extends Proposition {
	name;
	constructor(name?: string) {
		super();
		this.name = name ?? '';
	}
	toString(): string {
		return `[${this.name}]`;
	}
}

export class ImplicationPropositionAST extends Proposition {
	left: Proposition;
	right: Proposition;
	constructor(left: Proposition, right: Proposition) {
		super();
		this.left = left;
		this.right = right;
	}
	toString(): string {
		return `[(${this.left.toString()}) implicate (${this.right.toString()})]`;
	}
}

export class IffPropositionAST extends Proposition {
	left: Proposition;
	right: Proposition;
	constructor(left: Proposition, right: Proposition) {
		super();
		this.left = left;
		this.right = right;
	}
	toString(): string {
		return `[(${this.left.toString()}) iff (${this.right.toString()})]`;
	}
}

export class NotPropositionAST extends Proposition {
	prop: Proposition;
	constructor(prop: Proposition) {
		super();
		this.prop = prop;
	}
	toString(): string {
		return `[not (${this.prop})]`;
	}
}
