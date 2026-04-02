export class Proposition {
	toString() {
		return '[bx]';
	}
	replaceAnyProposition(x: string, replaceTo: Proposition): Proposition {
		return this;
	}
	clone() {
		return new Proposition();
	}
	findAnyProposition(): string[] {
		return [];
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
	clone() {
		return new LetterPropositionAST(this.name);
	}
	findAnyProposition(): string[] {
		return [];
	}
}

export class AnyPropositionAST extends Proposition {
	name;
	constructor(name?: string) {
		super();
		this.name = name ?? '';
	}
	toString(): string {
		return `($${this.name})`;
	}
	replaceAnyProposition(x: string, replaceTo: Proposition): Proposition {
		if (this.name == x) return replaceTo;
		return this;
	}
	clone() {
		return new AnyPropositionAST(this.name);
	}
	findAnyProposition(): string[] {
		return [this.name];
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
		return `((${this.left.toString()})→(${this.right.toString()}))`;
	}
	replaceAnyProposition(x: string, replaceTo: Proposition): Proposition {
		return new ImplicationPropositionAST(
			this.left.replaceAnyProposition(x, replaceTo),
			this.right.replaceAnyProposition(x, replaceTo),
		);
	}
	clone() {
		return new ImplicationPropositionAST(this.left.clone(), this.right.clone());
	}
	findAnyProposition(): string[] {
		return this.left.findAnyProposition().concat(this.right.findAnyProposition());
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
		return `((${this.left.toString()})↔(${this.right.toString()}))`;
	}
	replaceAnyProposition(x: string, replaceTo: Proposition): Proposition {
		return new IffPropositionAST(
			this.left.replaceAnyProposition(x, replaceTo),
			this.right.replaceAnyProposition(x, replaceTo),
		);
	}
	clone() {
		return new IffPropositionAST(this.left.clone(), this.right.clone());
	}
	findAnyProposition(): string[] {
		return this.left.findAnyProposition().concat(this.right.findAnyProposition());
	}
}

export class NotPropositionAST extends Proposition {
	prop: Proposition;
	constructor(prop: Proposition) {
		super();
		this.prop = prop;
	}
	toString(): string {
		return `(¬(${this.prop}))`;
	}
	replaceAnyProposition(x: string, replaceTo: Proposition): Proposition {
		return new NotPropositionAST(this.prop.replaceAnyProposition(x, replaceTo));
	}
	clone() {
		return new NotPropositionAST(this.prop.clone());
	}
	findAnyProposition(): string[] {
		return this.prop.findAnyProposition();
	}
}

export class DisjunctionPropositionAST extends Proposition {
	left: Proposition;
	right: Proposition;
	constructor(left: Proposition, right: Proposition) {
		super();
		this.left = left;
		this.right = right;
	}
	toString(): string {
		return `((${this.left.toString()})∨(${this.right.toString()}))`;
	}
	replaceAnyProposition(x: string, replaceTo: Proposition): Proposition {
		return new DisjunctionPropositionAST(
			this.left.replaceAnyProposition(x, replaceTo),
			this.right.replaceAnyProposition(x, replaceTo),
		);
	}
	clone() {
		return new DisjunctionPropositionAST(this.left.clone(), this.right.clone());
	}
	findAnyProposition(): string[] {
		return this.left.findAnyProposition().concat(this.right.findAnyProposition());
	}
}

export class ConjunctionPropositionAST extends Proposition {
	left: Proposition;
	right: Proposition;
	constructor(left: Proposition, right: Proposition) {
		super();
		this.left = left;
		this.right = right;
	}
	toString(): string {
		return `((${this.left.toString()})∧(${this.right.toString()}))`;
	}
	replaceAnyProposition(x: string, replaceTo: Proposition): Proposition {
		return new ConjunctionPropositionAST(
			this.left.replaceAnyProposition(x, replaceTo),
			this.right.replaceAnyProposition(x, replaceTo),
		);
	}
	clone() {
		return new ConjunctionPropositionAST(this.left.clone(), this.right.clone());
	}
	findAnyProposition(): string[] {
		return this.left.findAnyProposition().concat(this.right.findAnyProposition());
	}
}
