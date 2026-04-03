import type { Proposition } from '../parser/ast';
import { parseAndConvertToAst } from '../parser/compiler';
import { LogicError } from './errors';
import { FormalSystemRule, type TheoremJSON } from './fsRule';
import type { Step, StepJSON } from './step';

export class TheoremJSONHandler {
	static theoremToJSON(theorem: FormalSystemRule) {
		if (!theorem.isTheorem) throw new Error('Unable to save axioms');
		let result: TheoremJSON = {
			condition: theorem.condition.map((x) => x.toString()),
			result: theorem.result.toString(),
			steps: theorem.steps.map(
				(x): StepJSON => ({
					rule_id: x.rule_id,
					chosen_condition: x.chosen_condition,
					match_map: x.match_map,
					proposition: x.proposition.toString(),
				}),
			),
		};
		return result;
	}
	static JSONTOTheorem(theorem: TheoremJSON) {
		let condition = theorem.condition.map((x) => parseAndConvertToAst(x)) as Proposition[];
		let result = parseAndConvertToAst(theorem.result) as Proposition;
		let steps: Step[] = [];
		for (let i = 0; i < theorem.steps.length; i++) {
			let curstep = theorem.steps[i];
			if (curstep.rule_id === 'hyp') {
				if (curstep.proposition === undefined) {
					throw new LogicError("Hypothesis required proposition, but there aren't");
				}
				steps.push({
					proposition: parseAndConvertToAst(curstep.proposition),
					rule_id: 'hyp',
					chosen_condition: [],
					match_map: {},
				});
				continue;
			}
			// let rule = findRules(curstep.rule_id);
			// let conditions2: Proposition[] = [];
			// for (let j = 0; j < curstep.chosen_condition.length; j++) {
			// 	conditions2.push(steps[curstep.chosen_condition[j]].proposition);
			// }
			// const ruleResult = rule.applyRule(...conditions2);
			// const replacements: MatchTable = {};
			// for (let i = 0; i < ruleResult.replaceable.length; i++) {
			// 	const repl = curstep.match_map[ruleResult.replaceable[i]];
			// 	replacements[ruleResult.replaceable[i]] = parseAndConvertToAst(repl);
			// }
			// const result = ruleResult.applyResult(replacements);
			const result = parseAndConvertToAst(curstep.proposition) as Proposition;
			console.log(`Result: ${result}`);
			steps.push({
				proposition: result,
				rule_id: curstep.rule_id,
				chosen_condition: curstep.chosen_condition,
				match_map: curstep.match_map,
			});
		}
		return FormalSystemRule.asTheorem(condition, result, steps);
	}
}
