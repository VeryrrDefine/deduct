import type { Proposition } from '../parser/ast';

export class FormalSystemRule {
	condition: Proposition[];
	result: Proposition;
	constructor(condition: Proposition[], result: Proposition) {
		this.condition = condition;
		this.result = result;
	}
}
