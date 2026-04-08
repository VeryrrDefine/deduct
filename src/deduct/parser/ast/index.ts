export class Proposition {
	toString() {
		return '[bx]';
	}
	replaceAnyProposition(x: string, replaceTo: Proposition, isNotPreApply = false): Proposition {
		let new2 = new Proposition();
		new2.propositions = this.propositions.map((t) => {
			let res = t.replaceAnyProposition(x, replaceTo, isNotPreApply);
			return res;
		});
		Object.setPrototypeOf(new2, Object.getPrototypeOf(this));

		return new2;
	}
	clone() {
		return new Proposition();
	}
	findAnyProposition(isNotPreApply = false): string[] {
		return (function (t) {
			let t2 = t.propositions
				.map((x) => {
					let q = x.findAnyProposition(isNotPreApply);
					if (x instanceof AnyPropositionPreApplyAST) {
					}
					return q;
				})
				.flat();
			return t2;
		})(this);
	}
	displayFancy(level?: number) {
		return '';
	}

	/**
	 * Some extra informations of this proposition
	 */
	payload: any;

	/**
	 * propositions
	 */
	propositions: Proposition[] = [];
	equals(x: Proposition) {
		return this.toString() == x.toString();
	}
	constructor(x?: Proposition[]) {
		this.propositions = x ?? [];
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
	displayFancy(level?: number): string {
		return this.toString();
	}
	replaceAnyProposition(x: string, replaceTo: Proposition, isNotPreApply?: boolean): Proposition {
		return this;
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
	replaceAnyProposition(x: string, replaceTo: Proposition, isNotPreApply = false): Proposition {
		if (!isNotPreApply) {
			return new AnyPropositionPreApplyAST(this.name);
		}
		return this;
	}
	clone() {
		return new AnyPropositionAST(this.name);
	}
	findAnyProposition(isNotPreApply = false): string[] {
		if (isNotPreApply) return [this.name];
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
	replaceAnyProposition(x: string, replaceTo: Proposition, isNotPreApply = false): Proposition {
		if (isNotPreApply && this.name == x) return replaceTo;
		return this;
	}
	clone() {
		return new AnyPropositionPreApplyAST(this.name);
	}
	findAnyProposition(isNotPreApply = false): string[] {
		if (!isNotPreApply) return [this.name];
		return [];
	}
	displayFancy(level?: number): string {
		return '$' + this.name + '!';
	}
}

export class ImplicationPropositionAST extends Proposition {
	get left() {
		return this.propositions[0];
	}
	get right() {
		return this.propositions[1];
	}
	constructor(left: Proposition, right: Proposition) {
		super([left, right]);
	}
	toString(): string {
		return `((${this.left.toString()})→(${this.right.toString()}))`;
	}
	clone() {
		return new ImplicationPropositionAST(this.left.clone(), this.right.clone());
	}

	displayFancy(level?: number): string {
		if (level == 1) {
			return `(${this.left.displayFancy(1)} → ${this.right.displayFancy(1)})`;
		}
		return `${this.left.displayFancy(1)} → ${this.right.displayFancy(1)}`;
	}
}

export class IffPropositionAST extends Proposition {
	get left() {
		return this.propositions[0];
	}
	get right() {
		return this.propositions[1];
	}
	constructor(left: Proposition, right: Proposition) {
		super([left, right]);
	}
	toString(): string {
		return `((${this.left.toString()})↔(${this.right.toString()}))`;
	}

	clone() {
		return new IffPropositionAST(this.left.clone(), this.right.clone());
	}
	displayFancy(level?: number): string {
		if (level == 1) {
			return `(${this.left.displayFancy(1)} ↔ ${this.right.displayFancy(1)})`;
		}
		return `${this.left.displayFancy(1)} ↔ ${this.right.displayFancy(1)}`;
	}
}

export class NotPropositionAST extends Proposition {
	get prop() {
		return this.propositions[0];
	}
	constructor(prop: Proposition) {
		super([prop]);
	}
	toString(): string {
		return `(¬(${this.prop}))`;
	}
	clone() {
		return new NotPropositionAST(this.prop.clone());
	}
	displayFancy(level?: number): string {
		return `¬${this.prop.displayFancy(1)}`;
	}
}

export class DisjunctionPropositionAST extends Proposition {
	get left() {
		return this.propositions[0];
	}
	get right() {
		return this.propositions[1];
	}
	constructor(left: Proposition, right: Proposition) {
		super([left, right]);
	}
	toString(): string {
		return `((${this.left.toString()})∨(${this.right.toString()}))`;
	}
	clone() {
		return new DisjunctionPropositionAST(this.left.clone(), this.right.clone());
	}
	displayFancy(level?: number): string {
		if (level == 1) {
			return `(${this.left.displayFancy(1)} ∨ ${this.right.displayFancy(1)})`;
		}
		return `${this.left.displayFancy(1)} ∨ ${this.right.displayFancy(1)}`;
	}
}

export class ConjunctionPropositionAST extends Proposition {
	get left() {
		return this.propositions[0];
	}
	get right() {
		return this.propositions[1];
	}
	constructor(left: Proposition, right: Proposition) {
		super([left, right]);
	}
	toString(): string {
		return `((${this.left.toString()})∧(${this.right.toString()}))`;
	}
	clone() {
		return new ConjunctionPropositionAST(this.left.clone(), this.right.clone());
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
	get proposition() {
		return this.propositions[0];
	}
	constructor(variable: AnyTermAST | LetterTermAST, proposition: Proposition) {
		super([proposition]);
		this.variable = variable;
	}
	toString(): string {
		return `(E${this.variable}:(${this.proposition}))`;
	}
	clone() {
		return new ExistsPropositionAST(this.variable, this.proposition);
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
	get proposition() {
		return this.propositions[0];
	}
	constructor(variable: AnyTermAST | LetterTermAST, proposition: Proposition) {
		super([proposition]);
		this.variable = variable;
	}
	toString(): string {
		return `(V${this.variable}:(${this.proposition}))`;
	}
	clone() {
		return new ForallPropositionAST(this.variable, this.proposition);
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
	replaceAnyTerm(x: string, replaceTo: Term, isNotPreApply = false): Term {
		return this;
	}
	clone() {
		return new Term();
	}
	findAnyTerm(isNotPreApply = false): string[] {
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
	findAnyTerm(isNotPreApply = false): string[] {
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
	replaceAnyTerm(x: string, replaceTo: Term, isNotPreApply = false): Term {
		if (!isNotPreApply) {
			return new AnyTermPreApplyAST(this.name);
		}
		return this;
	}
	clone() {
		return new AnyTermAST(this.name);
	}
	findAnyTerm(isNotPreApply = false): string[] {
		if (isNotPreApply) return [this.name];
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
	replaceAnyTerm(x: string, replaceTo: Term, isNotPreApply = false): Term {
		if (isNotPreApply && this.name == x) return replaceTo;
		return this;
	}
	clone() {
		return new AnyTermPreApplyAST(this.name);
	}
	findAnyTerm(isNotPreApply = false): string[] {
		if (!isNotPreApply) return [this.name];
		return [];
	}
	displayFancy(level?: number): string {
		return '$' + this.name + '!';
	}
}
