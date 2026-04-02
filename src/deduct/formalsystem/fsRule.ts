import { FormalSystem } from './index';
import type { Proposition } from '../parser/ast';
import { LogicError } from './errors';
import type { MatchTable } from './matchTable';
import { parseAndConvertToAst } from '../parser/compiler';

export class FormalSystemRule {
	condition: Proposition[];
	result: Proposition;
	conditionNumber: number;
	constructor(condition: Proposition[], result: Proposition) {
		this.condition = condition;
		this.result = result;
		this.conditionNumber = condition.length;
	}
	applyRule(...propositions: Proposition[]) {
		if (propositions.length !== this.conditionNumber)
			throw new LogicError("Proposition numbers doesn't match");

		const matchTable: MatchTable = {};
		for (let i = 0; i < this.conditionNumber; i++) {
			FormalSystem.match(propositions[i], this.condition[i], matchTable);
		}

		let result = this.result.clone();

		const keys = Object.keys(matchTable);

		for (const key of keys) {
			result = result.replaceAnyProposition(key, matchTable[key]);
		}
		return new RuleResult(result);
	}
	toString() {
		let result = this.condition.map((x) => x.toString()).join(',');
		result += '⊢';
		result += this.result.toString();

		return result;
	}
	static fromString(x: string): FormalSystemRule {
		return parseAndConvertToAst(x, true);
	}
}
export class RuleResult {
	result: Proposition;
	replaceable: string[];
	constructor(result: Proposition) {
		this.result = result;
		this.replaceable = [...new Set(result.findAnyProposition())];
	}
	applyResult(tables: MatchTable) {
		const keys = Object.keys(tables);
		let result = this.result.clone();
		for (const key of keys) {
			if (!tables[key]) continue;
			result = result.replaceAnyProposition(key, tables[key]);
		}
		return result;
	}
	toString() {
		return `[PRE-APPLIED] ${this.result}`;
	}
}
