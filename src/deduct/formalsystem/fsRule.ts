import { FormalSystem } from './index';
import { AnyPropositionAST, Proposition } from '../parser/ast';
import { LogicError } from './errors';
import type { MatchTable } from './matchTable';
import { toRule } from '../parser/compiler';
import type { Step, StepJSON } from './step';

export type TheoremJSON = {
	condition: string[];
	result: string;
	steps: StepJSON[];
};
export class FormalSystemRule {
	condition: Proposition[];
	result: Proposition;
	conditionNumber: number;
	steps: Step[];
	isTheorem = false;
	name = '';
	payload: any;
	replaceable: string[];
	constructor(condition: Proposition[], result: Proposition) {
		this.condition = condition;
		this.result = result;
		this.conditionNumber = condition.length;
		this.steps = [];

		this.replaceable = this.getReplaceables();
	}
	getReplaceables() {
		const matchTable: MatchTable = {};
		for (let i = 0; i < this.conditionNumber; i++) {
			FormalSystem.match(this.condition[i], this.condition[i], matchTable);
		}

		let result = this.result.clone().replaceAnyProposition('', new Proposition(), false);

		const keys = Object.keys(matchTable);

		for (const key of keys) {
			result = result.replaceAnyProposition(key, matchTable[key], true);
		}
		let w = [...new Set(result.findAnyProposition())];
		return w;
	}
	static asTheorem(condition: Proposition[], result: Proposition, steps: Step[], name: string) {
		const rule = new FormalSystemRule(condition, result);
		rule.steps = steps;
		rule.isTheorem = true;
		rule.name = name;
		return rule;
	}
	addInto(fs: FormalSystem, id: string) {
		fs.addRule(this, id);
		return this;
	}
	applyRule(chosen_condition: number[], ...propositions: Proposition[]) {
		if (propositions.length !== this.conditionNumber)
			throw new LogicError("Proposition numbers doesn't match");

		const matchTable: MatchTable = {};
		for (let i = 0; i < this.conditionNumber; i++) {
			FormalSystem.match(propositions[i], this.condition[i], matchTable);
		}

		let result = this.result.clone().replaceAnyProposition('', new Proposition(), false);
		FormalSystem.debugLog(`Rule result before replaced: ${result}`);
		const keys = Object.keys(matchTable);

		for (const key of keys) {
			FormalSystem.debugLog(`Replacing result ${key} to ${matchTable[key]}`);
			result = result.replaceAnyProposition(key, matchTable[key], true);
		}
		FormalSystem.debugLog(`Fin: ${result}`);
		return new RuleResult(result, this.name, chosen_condition);
	}
	toString() {
		let result = this.condition.map((x) => x.toString()).join(',');
		result += '⊢';
		result += this.result.toString();

		return result;
	}
	displayFancy() {
		let result = this.condition.map((x) => x.displayFancy()).join(', ');
		if (result !== '') {
			result += ' ';
		}
		result += '⊢ ';
		result += this.result.displayFancy();

		return result;
	}
	static fromString(x: string, id: string): FormalSystemRule {
		let p = toRule(x);
		p.name = id;
		return p;
	}
}
export class RuleResult {
	result: Proposition;
	replaceable: string[];
	rule_id: string;
	chosen_condition: number[];
	constructor(result: Proposition, rule_id: string, chosen_condition: number[]) {
		this.result = result;
		this.replaceable = [...new Set(result.findAnyProposition())];
		this.rule_id = rule_id;
		this.chosen_condition = chosen_condition;
	}
	applyResult(tables?: MatchTable) {
		if (tables === undefined) {
			let result = this.result.clone();
			for (const repl of this.replaceable) {
				result = result.replaceAnyProposition(repl, new AnyPropositionAST(repl), true);
			}
			return result;
		}
		const keys = Object.keys(tables);
		let result = this.result.clone();
		for (const key of keys) {
			if (!tables[key]) continue;
			result = result.replaceAnyProposition(key, tables[key], true);
		}
		// 找一下有没有没被替换的
		let differences = result.findAnyProposition(false);
		for (const lost of differences) {
			result = result.replaceAnyProposition(lost, new AnyPropositionAST(lost), true);
		}
		return result;
	}
	applyResultAndDeduct(tables: MatchTable | undefined, fs: FormalSystem) {
		let proposition = this.applyResult(tables);
		proposition.payload = fs.addProposition(
			proposition,
			this.rule_id,
			this.chosen_condition,
			Object.fromEntries(this.replaceable.map((x) => [x, '$' + x])),
		);

		return proposition;
	}
	toString() {
		return `[PRE-APPLIED] ${this.result}`;
	}
}
