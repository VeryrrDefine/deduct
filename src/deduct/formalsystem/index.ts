import {
	AnyPropositionAST as AnyProp,
	AnyPropositionAST,
	IffPropositionAST as Iff,
	ImplicationPropositionAST as Impl,
	ImplicationPropositionAST,
	LetterPropositionAST as LetterProp,
	NotPropositionAST as Not,
	Proposition,
	type Proposition as Prop,
} from '../parser/ast';
import { toProposition } from '../parser/compiler';
import { RuleParser } from '../parser/parserule-structure';
import { LogicError, MatchError } from './errors';
import { FormalSystemRule } from './fsRule';
import { matchStrTableToTable, type MatchStrTable, type MatchTable } from './matchTable';
import type { Step } from './step';

export class FormalSystem {
	static debugLog(...args: any[]) {
		return;
		return console.debug(...args);
	}
	private rules: {
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
		dtrue: FormalSystemRule.fromString('|-true', 'dtrue'),
		dfalse: FormalSystemRule.fromString('|-false>~true', 'dfalse'),
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
		return this.steps.length - 1;
	}

	/**
	 *
	 * @param deductionIdx
	 * @param replaceValues
	 * @param conditionIdxs
	 * @returns absolute position
	 */
	deduct(
		deductionIdx: string,
		replaceValues: MatchTable | MatchStrTable | undefined,
		conditionIdxs: number[],
	): [Proposition, number] {
		const rule = this.findRules(deductionIdx);
		let repl = replaceValues;
		if (repl) {
			let read2 = Object.entries(repl);
			if (typeof read2[0]?.[1] == 'string') {
				repl = matchStrTableToTable(repl as MatchStrTable);
			}
		}
		const conditions = conditionIdxs.map((x) => this.getPropositionFromId(x));
		console.log(
			`Deduction: ${deductionIdx} ${conditionIdxs}, which they are ${conditions.map((x) => (x ? x.displayFancy() : '!!!')).join(', ')}, doing`,
		);
		let result = rule
			.applyRule(conditionIdxs, ...conditions)
			.applyResultAndDeduct(repl as MatchTable | undefined, this);
		console.log(
			`Deduction: ${deductionIdx} ${conditionIdxs}, which they are ${conditions.map((x) => (x ? x.displayFancy() : '!!!')).join(', ')}, completed Successfully`,
		);
		return [result, result.payload];
	}

	addHypothesis(hyp: Proposition) {
		this.hypothesis.push(hyp);
		return this.hypothesis.length - 1;
	}

	toNewTheorem(name: string, stepId?: number) {
		if (!this.steps[stepId ?? this.steps.length - 1])
			throw new LogicError('Invalid theorem id or theorem not exists');
		return FormalSystemRule.asTheorem(
			this.hypothesis,
			this.steps[stepId ?? this.steps.length - 1].proposition,
			this.steps,
			name,
		).addInto(this, name);
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
			return;
		}
		// 如果一个是蕴含另一个不是，则抛出类型不匹配
		if (currentAST instanceof Impl || goalAST instanceof Impl) {
			throw new MatchError('Proposition type mismatch: implication vs non-implication');
		}

		if (currentAST instanceof Iff && goalAST instanceof Iff) {
			this.match(currentAST.left, goalAST.left, anyPropositionMap);
			this.match(currentAST.right, goalAST.right, anyPropositionMap);
			return;
		}
		// 如果一个是当且仅当另一个不是，则抛出类型不匹配
		if (currentAST instanceof Iff || goalAST instanceof Iff) {
			throw new MatchError('Proposition type mismatch: iff vs non-iff');
		}

		if (currentAST instanceof Not && goalAST instanceof Not) {
			this.match(currentAST.prop, goalAST.prop, anyPropositionMap);
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

	popHyp() {
		let id = this.hypothesis.length - 1;
		for (const step of this.steps) {
			if (step.chosen_condition.includes(id)) throw new LogicError('Unable to remove');
		}
		this.hypothesis.pop();
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
		if (!this.steps[src] || !this.steps[dst]) throw new Error('Invalid src and destination');
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
				}
				if (x.metaRules.startsWith('c')) {
					return this.metaConditionTheorem(x.ruleString.slice(1));
				}
				if (x.metaRules.startsWith('>')) {
					return this.metaDeductTheorem(x.ruleString.slice(1));
				}
				throw new Error(`Not supported: ${x.metaRules[0]}`);
			}
		}
		return null;
	}
	relatively(x: number) {
		return x - this.steps.length;
	}
	absolutely(x: number) {
		return this.steps.length + x;
	}
	getPropositionFromId(x: number) {
		if (x >= 0) return this.hypothesis[x];
		else return this.steps[this.steps.length + x].proposition;
	}
	getStepIncludedHyp(x: number) {
		if (x < this.hypothesis.length) return this.hypothesis[x];
		return this.steps[x - this.hypothesis.length];
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
			rule.condition.forEach((c) => this.addHypothesis(c));

			const nhyp = this.addHypothesis(ss1);

			let chosen_condition = [];
			for (let i = 0; i < rule.condition.length; i++) {
				chosen_condition.push(i);
			}
			const ss1_ss2_1 = this.deduct(idx, undefined, chosen_condition);

			this.deduct('mp', undefined, [this.relatively(ss1_ss2_1[1]), nhyp]);

			const ther = this.toNewTheorem('<' + idx);

			this.steps = oldP;
			this.hypothesis = oldH;
			return ther;
		} catch (e) {
			this.steps = oldP;
			this.hypothesis = oldH;
			throw e;
		}
	}
	metaConditionTheorem(idx: string): FormalSystemRule | null {
		if (this.ruleExists('c' + idx)) return this.findRules('c' + idx);
		const rule = this.genRule(idx);
		if (!rule) throw new Error('Rule not exists');
		const oldP = this.steps;
		const oldH = this.hypothesis;

		const newPArray = rule.condition
			.map((x) => x.findAnyProposition(true))
			.concat(rule.result.findAnyProposition(true))
			.flat();
		let new2 = 0;
		while (newPArray.includes('' + new2)) {
			new2++;
		}
		let new3 = new AnyPropositionAST('' + new2);
		try {
			this.removePropositions(1 / 0);
			this.hypothesis = [];
			if (rule.condition.length == 0) {
				const s1 = this.deduct(idx, undefined, []);
				const s1_n_s1 = this.deduct(
					'a1',
					{
						'1': new3,
						'0': s1[0],
					},
					[],
				);
				this.deduct('mp', undefined, [this.relatively(s1_n_s1[1]), this.relatively(s1[1])]);

				const ther = this.toNewTheorem('c' + idx);

				this.steps = oldP;
				this.hypothesis = oldH;
				ther.payload = new2;
				return ther;
			}
			if (rule == this.rules.mp) {
				const iia2 = this.findRules('<<a2');
				let $201 = toProposition('$2>$0>$1');
				let $20 = toProposition('$2>$0');
				let $201n = this.addHypothesis($201);
				let $20n = this.addHypothesis($20);

				this.deduct('<<a2', undefined, [$201n, $20n]);

				const ther = this.toNewTheorem('cmp');

				this.steps = oldP;
				this.hypothesis = oldH;
				ther.payload = '2';
				return ther;
			}
			rule.condition.forEach((c) =>
				this.addHypothesis(new ImplicationPropositionAST(new3, c)),
			);

			for (let i = 0; i < rule.steps.length; i++) {
				const thisStep = rule.steps[i];
				const step_ruleId = thisStep.rule_id;
				const conditionedRule = this.findRules(`c${step_ruleId}`);
				let matchmap = matchStrTableToTable(thisStep.match_map);
				matchmap[conditionedRule.payload] = new3;
				this.deduct(`c${step_ruleId}`, matchmap, thisStep.chosen_condition);
			}

			const ther = this.toNewTheorem('c' + idx);

			this.steps = oldP;
			this.hypothesis = oldH;
			ther.payload = new2;
			return ther;
		} catch (e) {
			this.steps = oldP;
			this.hypothesis = oldH;
			throw e;
		}
	}
	metaDeductTheorem(idx: string): FormalSystemRule | null {
		if (idx[0] === '<') {
			return this.genRule(idx.slice(1));
		}
		// a => <a
		if (this.ruleExists('>' + idx)) return this.findRules('>' + idx);
		const d = this.genRule(idx);
		if (!d) throw new Error('Rule not exists');
		const oldP = this.steps;
		const oldH = this.hypothesis;

		if (!d.condition.length) throw new LogicError('No Hypthesis');

		if (idx == 'mp') throw new LogicError('>mp is (($0 > $1) ⊢ ($0 > $1))');

		let s: Proposition = new Proposition();

		try {
			this.removePropositions(1 / 0);
			this.hypothesis = [];

			// 首先添加前几个假设，（没有最后一个）
			d.condition.forEach((c, id) => {
				if (id !== d.condition.length - 1) {
					this.addHypothesis(c);
				} else {
					s = c;
				}
			});
			//最后一个假设记为s
			/**
			 * 存储原步骤与新步骤间的关系
			 */
			let stepPayload: number[] = [];

			/**
			 * 存储原假设和新构造的s->假设的关系
			 */
			let hypothesis_conditioned: number[] = [];
			for (let hyp2 = 0; hyp2 < d.condition.length - 1; hyp2++) {
				hypothesis_conditioned.push(
					this.deduct(
						'<a1',
						{
							'1': s,
						},
						[hyp2],
					)[1],
				);
			}
			console.log(hypothesis_conditioned);
			// 构造s->s
			hypothesis_conditioned.push(this.deduct('.i', { '0': s }, [])[1]);

			for (let m = 0; m < d.steps.length; m++) {
				const step = d.steps[m];

				// 如果这个步骤所需的条件不包含假设
				if (!step.chosen_condition.includes(this.hypothesis.length - 1 + 1)) {
					// 首先构造原先的命题A
					let thisstep = this.deduct(
						step.rule_id,
						step.match_map,
						step.chosen_condition,
					)[1];
					// 然后构造(s->A)，记录A和s->A的映射
					stepPayload.push(
						this.deduct('<a1', { '1': s }, [this.relatively(thisstep)])[1],
					);
				} else if (step.proposition.toString() == s.toString()) {
					// 如果这个命题就是假设本身
					// 直接记录s和s->s的映射
					stepPayload.push(hypothesis_conditioned[hypothesis_conditioned.length - 1]);
				} else {
					// 如果这个步骤依赖了s

					// 记当前步骤为T，
					// 原先 A, B, C, s, ... 可以推出 T
					// 那么根据条件演绎元定理， 有s->A,s->B,s->C,s->s....推出s->T。
					// 查找每一个A,B,C 查找对应的stepPayload

					const t = this;
					let conditions = step.chosen_condition;
					conditions = conditions.map((x) =>
						t.relatively(
							// 筛选，如果x>=0说明是假设，就去假设列表里找，如果<0那么去stepPayload找

							x >= 0 ? hypothesis_conditioned[x] : stepPayload[t.absolutely(x)],
						),
					); // 这里的conditions的有时候会选到一个s->Undefined的东西，需要检查

					let checkList = [];
					for (let bx = 0; bx < conditions.length; bx++) {
						let fn = conditions[bx];
						if (fn >= 0) {
							// 表明stepPayload获取到了undefined，产生了NaN
							if (isNaN(fn)) {
								throw new Error('Check');
							} else {
								checkList.push(fn);
							}
						} else {
							checkList.push(fn);
						}
					}
					console.log(checkList, 'c' + step.rule_id);

					try {
						stepPayload.push(
							this.deduct('c' + step.rule_id, step.match_map, checkList)[1],
						);
					} catch (e) {
						console.table(this.listStepDetails());
						throw e;
					}
					console.log('Done', checkList, 'c' + step.rule_id);
				}

				// else {
				// 	throw new Error("Meta Deduct Theorem prove failed: Unknown")
				// }
			}

			const ther = this.toNewTheorem('>' + idx);

			/**
			 * 23
			 */
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
