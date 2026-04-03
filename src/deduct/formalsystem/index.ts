import {
	AnyPropositionAST as AnyProp,
	IffPropositionAST as Iff,
	ImplicationPropositionAST as Impl,
	ImplicationPropositionAST,
	LetterPropositionAST as LetterProp,
	NotPropositionAST as Not,
	Proposition,
	type Proposition as Prop,
} from '../parser/ast';
import { RuleParser } from '../parser/parserule-structure';
import { LogicError, MatchError } from './errors';
import { FormalSystemRule } from './fsRule';
import type { MatchStrTable, MatchTable } from './matchTable';
import type { Step } from './step';

export class FormalSystem {
	static debugLog(...args: any[]) {
		return;
		return console.debug(...args);
	}
	rules: {
		[key: string]: FormalSystemRule;
	} = {
		mp: FormalSystemRule.fromString('$0>$1, $0|-$1', 'mp'),
		a1: FormalSystemRule.fromString('|-$0>($1>$0)', 'a1'),
		a2: FormalSystemRule.fromString('|-($0>($1>$2))>(($0>$1)>($0>$2))', 'a2'),
		a3: FormalSystemRule.fromString('|-(~$0>~$1)>($1>$0)', 'a3'),
		'd<>1': FormalSystemRule.fromString('|-($0<>$1)>~(($0>$1)>~($1>$0))', 'd<>1'),
		'd<>2': FormalSystemRule.fromString('|-~(($0>$1)>~($1>$0))>($0<>$1)', 'd<>2'),
		'd|': FormalSystemRule.fromString('⊢($0|$1)<>(~$0>$1)', 'd|'),
		'd&': FormalSystemRule.fromString('⊢($0&$1)<>~($0>~$1)', 'd&'),
	};

	hypothesis: Proposition[] = [];
	steps: Step[] = [];
	findRules(x: string) {
		if (this.ruleExists(x)) {
			let y = x as keyof typeof this.rules;
			return this.rules[y];
		} else {
			let parser = new RuleParser(x);
			if (parser.metaRules == '') {
				throw new ReferenceError('Cannot find rule ' + x);
			}
			let tryGenRule = this.genRule(parser);
			if (!tryGenRule) throw new LogicError(`Unable to generate rule ${parser.ruleString}`);

			return tryGenRule;
		}
	}
	ruleExists(x: string): boolean {
		return x in this.rules;
	}
	addRule(fs: FormalSystemRule, id: string) {
		this.rules[id] = fs;
	}

	addProposition(
		prop: Proposition,
		rule_id: string,
		chosen_condition: number[],
		match_map: MatchStrTable,
	) {
		this.steps.push({
			proposition: prop,
			rule_id: rule_id,
			chosen_condition,
			match_map,
		});
	}

	getUserTheorems(): string[] {
		let keys = Object.keys(this.rules);

		return keys.filter((x) => x.startsWith('s') || x.startsWith('.'));
	}

	/**
	 * Match current AST to goal AST
	 *
	 * e.g. `t>q` can match `$2>$3`, `t>q` can't match `$2>$2`, `$1` can't match `t`.
	 * @param currentAST
	 * @param goalAST
	 */
	static match(currentAST: Prop, goalAST: Prop, anyPropositionMap: MatchTable) {
		FormalSystem.debugLog(`Matching ${currentAST} to ${goalAST}`);

		//match方法中currentAST的$0,$1 是类似于字母类型的命题，而要匹配goalAST中的$xxx，故只处理了goalAST 是anyprop的情况。
		if (goalAST instanceof AnyProp) {
			if (this.freeEquals(currentAST, anyPropositionMap[goalAST.name])) {
				FormalSystem.debugLog(
					`Matched ${goalAST.name} to goalAST(left) ${currentAST.toString()}.`,
				);
				anyPropositionMap[goalAST.name] = currentAST;
			} else {
				throw new MatchError(
					'matching ' + goalAST.name + ' error: goal AST(left) not equals',
				);
			}
			return;
		}

		if (currentAST instanceof Impl && goalAST instanceof Impl) {
			this.match(currentAST.left, goalAST.left, anyPropositionMap);
			this.match(currentAST.right, goalAST.right, anyPropositionMap);
			FormalSystem.debugLog(`Matched implication: ${currentAST} and ${goalAST}`);
			return;
		}
		// 如果一个是蕴含另一个不是，则抛出类型不匹配
		if (currentAST instanceof Impl || goalAST instanceof Impl) {
			throw new MatchError('Proposition type mismatch: implication vs non-implication');
		}

		if (currentAST instanceof Iff && goalAST instanceof Iff) {
			this.match(currentAST.left, goalAST.left, anyPropositionMap);
			this.match(currentAST.right, goalAST.right, anyPropositionMap);
			FormalSystem.debugLog(`Matched iff: ${currentAST} and ${goalAST}`);
			return;
		}
		// 如果一个是当且仅当另一个不是，则抛出类型不匹配
		if (currentAST instanceof Iff || goalAST instanceof Iff) {
			throw new MatchError('Proposition type mismatch: iff vs non-iff');
		}

		if (currentAST instanceof Not && goalAST instanceof Not) {
			this.match(currentAST.prop, goalAST.prop, anyPropositionMap);
			FormalSystem.debugLog(`Matched not: ${currentAST} and ${goalAST}`);
			return;
		}

		if (currentAST instanceof LetterProp && goalAST instanceof LetterProp) {
			if (currentAST.name !== goalAST.name) {
				throw new MatchError('Letter proopsition mismatch.');
			}
			return;
		}
		if (currentAST instanceof LetterProp || goalAST instanceof LetterProp) {
			throw new MatchError('Proposition type mismatch: letter vs non-letter');
		}

		throw new MatchError(
			`Unsupported or mismatched proposition types: ${currentAST.constructor.name} vs ${goalAST.constructor.name}`,
		);
	}
	/**
	 * Match an AST is equal to another AST.
	 *
	 * @returns
	 */
	static freeEquals(leftAST: Prop | undefined, rightAST: Prop | undefined) {
		if (leftAST === undefined) return true;
		if (rightAST === undefined) return true;
		return leftAST?.toString?.() === rightAST?.toString?.();
	}

	listRules() {
		return Object.entries(this.rules);
	}

	listRuleDetails() {
		let res = [];
		let index = 0;
		for (const rule of this.listRules()) {
			res.push({ RuleId: rule[0], Content: rule[1].displayFancy() });
			index++;
		}
		return res;
	}

	listStepDetails(ruleId?: string) {
		let res = [];
		if (ruleId) {
			const rule = this.findRules(ruleId);
			for (let i = 0; i < rule.condition.length; i++) {
				res.push({
					theoremId: `h${i}`,
					proposition: rule.condition[i].displayFancy(),
					operation: 'hyp',
				});
			}
			if (!rule.isTheorem) {
				res.push({
					theoremId: 'p0',
					proposition: rule.result.displayFancy(),
					operation: ruleId,
				});
				return res;
			}
			for (let i = 0; i < rule.steps.length; i++) {
				const step = rule.steps[i];
				res.push({
					theoremId: `p${i}`,
					proposition: step.proposition.displayFancy(),
					operation:
						step.rule_id +
						(step.chosen_condition.length !== 0
							? ' ' + step.chosen_condition.join(', ')
							: ''),
				});
			}
			return res;
		}
		for (let i = 0; i < this.hypothesis.length; i++) {
			res.push({
				theoremId: `h${i}`,
				proposition: this.hypothesis[i].displayFancy(),
				operation: 'hyp',
			});
		}
		for (let i = 0; i < this.steps.length; i++) {
			const step = this.steps[i];
			res.push({
				theoremId: `p${i}`,
				proposition: step.proposition.displayFancy(),
				operation:
					step.rule_id +
					(step.chosen_condition.length !== 0
						? ' ' + step.chosen_condition.join(', ')
						: ''),
			});
		}
		return res;
	}

	/**
	 * 移除最后的几个命题
	 */
	removePropositions(amount2?: number) {
		let amount = amount2 ?? 1;
		if (!isFinite(amount)) {
			this.steps = [];
		} else {
			while (amount--) {
				this.steps.pop();
			}
		}
	}

	/**
	 * 得到新id
	 */
	private _getNewIndex(src: number, dst: number, i: number): number {
		if (i === src) {
			return dst > src ? dst - 1 : dst;
		}
		if (src < dst && i > src && i < dst) {
			return i - 1;
		}
		if (src > dst && i >= dst && i < src) {
			return i + 1;
		}
		return i;
	}

	moveProposition(src: number, dst: number) {
		if (dst === -1) dst = this.steps.length;
		if (src === dst || dst === src + 1) return;

		for (let i = Math.min(src, dst); i < this.steps.length; i++) {
			const from = this.steps[i];
			if (from.chosen_condition.length == 0) continue;
			const ni = this._getNewIndex(src, dst, i);
			for (const j of from.chosen_condition) {
				const nj = this._getNewIndex(src, dst, j);
				console.assert(nj !== ni);
				if (nj > ni) throw new LogicError('Invalid moving');
			}
		}

		for (let i = Math.min(src, dst); i < this.steps.length; i++) {
			const from = this.steps[i];
			if (from.chosen_condition.length == 0) continue;
			from.chosen_condition = from.chosen_condition.map((e) =>
				this._getNewIndex(src, dst, e),
			);
		}
		if (dst > src) dst--;
		const moved = this.steps.splice(src, 1)[0];
		if (dst === this.steps.length) this.steps.push(moved);
		else this.steps.splice(dst, 0, moved);
	}
	/**
	 * Try to autogenerate rule from a rule parser.
	 *
	 * The procedure is:
	 *
	 * Found the base rule, try to found, if there aren't, then return null.
	 *
	 * If found, then try to handle metarules.
	 */
	genRule(x: RuleParser): FormalSystemRule | null;
	/**
	 * Try to autogenerate rule from a string.
	 */
	genRule(x: string): FormalSystemRule | null;
	genRule(x: RuleParser | string): FormalSystemRule | null {
		if (typeof x == 'string') {
			return this.genRule(new RuleParser(x));
		}
		let baseRule = x.originalRule;
		if (this.ruleExists(baseRule)) {
			let rule = this.findRules(baseRule);
			if (x.metaRules == '') return rule;
			else if (this.ruleExists(x.ruleString)) {
				return this.findRules(x.ruleString);
			} else {
				if (x.metaRules.startsWith('<')) {
					return this.metaInvDeductTheorem(x.ruleString.slice(1));
					// return this.findRules(x.ruleString);
				}
				return null;
			}
		}
		return null;
	}
	metaInvDeductTheorem(idx: string): FormalSystemRule | null {
		if (idx[0] === '>') {
			return this.genRule(idx.slice(1));
		}
		// a => <a
		if (this.ruleExists('<' + idx)) return this.findRules('<' + idx);
		const rule = this.genRule(idx);
		if (!rule) throw new Error('Rule not exists');
		const oldP = this.steps;
		const oldH = this.hypothesis;

		const conclusion = rule.result;
		if (!(conclusion instanceof ImplicationPropositionAST))
			throw new Error(`Cannot generate <${idx} because conclusion isn't an implication`);

		const [ss1, ss2] = [conclusion.left, conclusion.right];
		try {
			this.removePropositions(1 / 0);
			this.hypothesis = [];
			rule.condition.forEach((c) => this.hypothesis.push(c));
			this.hypothesis.push(ss1);
			const nhyp = this.hypothesis.length - 1;

			let chosen_condition = [];
			for (let i = 0; i < rule.condition.length; i++) {
				chosen_condition.push(i);
			}
			const ss1_ss2_1 = rule
				.applyRule(chosen_condition, ...rule.condition)
				.applyResultAndDeduct(undefined, this);

			this.rules.mp
				.applyRule([-1, nhyp], ss1_ss2_1, ss1)
				.applyResultAndDeduct(undefined, this);

			let ther = FormalSystemRule.asTheorem(
				this.hypothesis,
				this.steps[this.steps.length - 1].proposition,
				this.steps,
				'<' + idx,
			).addInto(this, '<' + idx);

			this.steps = oldP;
			this.hypothesis = oldH;
			return ther;
		} catch (e) {
			this.steps = oldP;
			this.hypothesis = oldH;
			throw e;
		}
	}
}

// console.log(RULES());
