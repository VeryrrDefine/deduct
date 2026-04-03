export class Proposition {
	toString() {
		return '[bx]';
	}
	replaceAnyProposition(x: string, replaceTo: Proposition, ispreapply = false): Proposition {
		return this;
	}
	clone() {
		return new Proposition();
	}
	findAnyProposition(): string[] {
		return [];
	}
	displayFancy(level?: number) {
		return '';
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
	displayFancy(level?: number): string {
		return this.toString();
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
	replaceAnyProposition(x: string, replaceTo: Proposition, ispreapply = false): Proposition {
		if (!ispreapply) {
			return new AnyPropositionPreApplyAST(this.name);
		}
		return this;
	}
	clone() {
		return new AnyPropositionAST(this.name);
	}
	findAnyProposition(): string[] {
		return [];
	}
	displayFancy(level?: number): string {
		return '$' + this.name;
	}
}

export class AnyPropositionPreApplyAST extends Proposition {
	name;
	constructor(name?: string) {
		super();
		this.name = name ?? '';
	}
	toString(): string {
		return `(!${this.name})`;
	}
	replaceAnyProposition(x: string, replaceTo: Proposition, ispreapply = false): Proposition {
		if (ispreapply && this.name == x) return replaceTo;
		return this;
	}
	clone() {
		return new AnyPropositionPreApplyAST(this.name);
	}
	findAnyProposition(): string[] {
		return [this.name];
	}
	displayFancy(level?: number): string {
		return '$' + this.name + '!';
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
	replaceAnyProposition(x: string, replaceTo: Proposition, ispreapply = false): Proposition {
		return new ImplicationPropositionAST(
			this.left.replaceAnyProposition(x, replaceTo, ispreapply),
			this.right.replaceAnyProposition(x, replaceTo, ispreapply),
		);
	}
	clone() {
		return new ImplicationPropositionAST(this.left.clone(), this.right.clone());
	}
	findAnyProposition(): string[] {
		return this.left.findAnyProposition().concat(this.right.findAnyProposition());
	}
	displayFancy(level?: number): string {
		if (level == 1) {
			return `(${this.left.displayFancy(1)} → ${this.right.displayFancy(1)})`;
		}
		return `${this.left.displayFancy(1)} → ${this.right.displayFancy(1)}`;
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
	replaceAnyProposition(x: string, replaceTo: Proposition, ispreapply = false): Proposition {
		return new IffPropositionAST(
			this.left.replaceAnyProposition(x, replaceTo, ispreapply),
			this.right.replaceAnyProposition(x, replaceTo, ispreapply),
		);
	}
	clone() {
		return new IffPropositionAST(this.left.clone(), this.right.clone());
	}
	findAnyProposition(): string[] {
		return this.left.findAnyProposition().concat(this.right.findAnyProposition());
	}
	displayFancy(level?: number): string {
		if (level == 1) {
			return `(${this.left.displayFancy(1)} ↔ ${this.right.displayFancy(1)})`;
		}
		return `${this.left.displayFancy(1)} ↔ ${this.right.displayFancy(1)}`;
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
	replaceAnyProposition(x: string, replaceTo: Proposition, ispreapply = false): Proposition {
		return new NotPropositionAST(this.prop.replaceAnyProposition(x, replaceTo, ispreapply));
	}
	clone() {
		return new NotPropositionAST(this.prop.clone());
	}
	findAnyProposition(): string[] {
		return this.prop.findAnyProposition();
	}
	displayFancy(level?: number): string {
		return `¬${this.prop.displayFancy(1)}`;
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
	replaceAnyProposition(x: string, replaceTo: Proposition, ispreapply = false): Proposition {
		return new DisjunctionPropositionAST(
			this.left.replaceAnyProposition(x, replaceTo, ispreapply),
			this.right.replaceAnyProposition(x, replaceTo, ispreapply),
		);
	}
	clone() {
		return new DisjunctionPropositionAST(this.left.clone(), this.right.clone());
	}
	findAnyProposition(): string[] {
		return this.left.findAnyProposition().concat(this.right.findAnyProposition());
	}
	displayFancy(level?: number): string {
		if (level == 1) {
			return `(${this.left.displayFancy(1)} ∨ ${this.right.displayFancy(1)})`;
		}
		return `${this.left.displayFancy(1)} ∨ ${this.right.displayFancy(1)}`;
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
	replaceAnyProposition(x: string, replaceTo: Proposition, ispreapply = false): Proposition {
		return new ConjunctionPropositionAST(
			this.left.replaceAnyProposition(x, replaceTo, ispreapply),
			this.right.replaceAnyProposition(x, replaceTo, ispreapply),
		);
	}
	clone() {
		return new ConjunctionPropositionAST(this.left.clone(), this.right.clone());
	}
	findAnyProposition(): string[] {
		return this.left.findAnyProposition().concat(this.right.findAnyProposition());
	}
	displayFancy(level?: number): string {
		if (level == 1) {
			return `(${this.left.displayFancy(1)} ∧ ${this.right.displayFancy(1)})`;
		}
		return `${this.left.displayFancy(1)} ∧ ${this.right.displayFancy(1)}`;
	}
}
