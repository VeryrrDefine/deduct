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
	findAnyProposition(isPreApply = false): string[] {
		return [];
	}
	displayFancy(level?: number) {
		return '';
	}

	/**
	 * Some extra informations of this proposition
	 */
	payload: any;
	equals(x: Proposition) {
		return this.toString() == x.toString();
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
	findAnyProposition(isPreApply = false): string[] {
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
	findAnyProposition(isPreApply = false): string[] {
		if (isPreApply) return [this.name];
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
		return `($${this.name}!)`;
	}
	replaceAnyProposition(x: string, replaceTo: Proposition, ispreapply = false): Proposition {
		if (ispreapply && this.name == x) return replaceTo;
		return this;
	}
	clone() {
		return new AnyPropositionPreApplyAST(this.name);
	}
	findAnyProposition(isPreApply = false): string[] {
		if (!isPreApply) return [this.name];
		return [];
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
	findAnyProposition(isPreApply = false): string[] {
		return this.left
			.findAnyProposition(isPreApply)
			.concat(this.right.findAnyProposition(isPreApply));
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
	findAnyProposition(isPreApply = false): string[] {
		return this.left
			.findAnyProposition(isPreApply)
			.concat(this.right.findAnyProposition(isPreApply));
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
	findAnyProposition(isPreApply = false): string[] {
		return this.prop.findAnyProposition(isPreApply);
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
	findAnyProposition(isPreApply = false): string[] {
		return this.left
			.findAnyProposition(isPreApply)
			.concat(this.right.findAnyProposition(isPreApply));
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
	findAnyProposition(isPreApply = false): string[] {
		return this.left
			.findAnyProposition(isPreApply)
			.concat(this.right.findAnyProposition(isPreApply));
	}
	displayFancy(level?: number): string {
		if (level == 1) {
			return `(${this.left.displayFancy(1)} ∧ ${this.right.displayFancy(1)})`;
		}
		return `${this.left.displayFancy(1)} ∧ ${this.right.displayFancy(1)}`;
	}
}

export class ExistsPropositionAST extends Proposition {
	variable: AnyTermAST | LetterTermAST;
	proposition: Proposition;
	constructor(variable: AnyTermAST | LetterTermAST, proposition: Proposition) {
		super();
		this.variable = variable;
		this.proposition = proposition;
	}
	toString(): string {
		return `(E${this.variable}:(${this.proposition}))`;
	}
	replaceAnyProposition(x: string, replaceTo: Proposition, ispreapply = false): Proposition {
		return new ExistsPropositionAST(
			this.variable,
			this.proposition.replaceAnyProposition(x, replaceTo, ispreapply),
		);
	}
	clone() {
		return new ExistsPropositionAST(this.variable, this.proposition);
	}
	findAnyProposition(isPreApply = false): string[] {
		return this.proposition.findAnyProposition(isPreApply);
	}
	displayFancy(level?: number): string {
		if (level == 1) {
			return `(∃${this.variable.toString()}:${this.proposition.displayFancy(1)})`;
		}
		return `∃${this.variable.toString()}:${this.proposition.displayFancy(1)}`;
	}
}

export class ForallPropositionAST extends Proposition {
	variable: AnyTermAST | LetterTermAST;
	proposition: Proposition;
	constructor(variable: AnyTermAST | LetterTermAST, proposition: Proposition) {
		super();
		this.variable = variable;
		this.proposition = proposition;
	}
	toString(): string {
		return `(V${this.variable}:(${this.proposition}))`;
	}
	replaceAnyProposition(x: string, replaceTo: Proposition, ispreapply = false): Proposition {
		return new ForallPropositionAST(
			this.variable,
			this.proposition.replaceAnyProposition(x, replaceTo, ispreapply),
		);
	}
	clone() {
		return new ForallPropositionAST(this.variable, this.proposition);
	}
	findAnyProposition(isPreApply = false): string[] {
		return this.proposition.findAnyProposition(isPreApply);
	}
	displayFancy(level?: number): string {
		if (level == 1) {
			return `(∀${this.variable.toString()}:${this.proposition.displayFancy(1)})`;
		}
		return `∀${this.variable.toString()}:${this.proposition.displayFancy(1)}`;
	}
}

export class Term {
	toString() {
		return 'var[bx]';
	}
	replaceAnyTerm(x: string, replaceTo: Term, ispreapply = false): Term {
		return this;
	}
	clone() {
		return new Term();
	}
	findAnyTerm(isPreApply = false): string[] {
		return [];
	}
	displayFancy(level?: number) {
		return '';
	}

	/**
	 * Some extra informations of this Term
	 */
	payload: any;
	equals(x: Term) {
		return this.toString() == x.toString();
	}
}
export class LetterTermAST extends Term {
	name;
	constructor(name?: string) {
		super();
		this.name = name ?? '';
	}
	toString(): string {
		return this.name;
	}
	clone() {
		return new LetterTermAST(this.name);
	}
	findAnyTerm(isPreApply = false): string[] {
		return [];
	}
	displayFancy(level?: number): string {
		return this.toString();
	}
}

export class AnyTermAST extends Term {
	name;
	constructor(name?: string) {
		super();
		this.name = name ?? '';
	}
	toString(): string {
		return `($${this.name})`;
	}
	replaceAnyTerm(x: string, replaceTo: Term, ispreapply = false): Term {
		if (!ispreapply) {
			return new AnyTermPreApplyAST(this.name);
		}
		return this;
	}
	clone() {
		return new AnyTermAST(this.name);
	}
	findAnyTerm(isPreApply = false): string[] {
		if (isPreApply) return [this.name];
		return [];
	}
	displayFancy(level?: number): string {
		return '$' + this.name;
	}
}

export class AnyTermPreApplyAST extends Term {
	name;
	constructor(name?: string) {
		super();
		this.name = name ?? '';
	}
	toString(): string {
		return `($${this.name}!)`;
	}
	replaceAnyTerm(x: string, replaceTo: Term, ispreapply = false): Term {
		if (ispreapply && this.name == x) return replaceTo;
		return this;
	}
	clone() {
		return new AnyTermPreApplyAST(this.name);
	}
	findAnyTerm(isPreApply = false): string[] {
		if (!isPreApply) return [this.name];
		return [];
	}
	displayFancy(level?: number): string {
		return '$' + this.name + '!';
	}
}
