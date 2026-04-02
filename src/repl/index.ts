import readline from 'node:readline';
import { FormalSystem } from '../deduct/formalsystem';
import type { RequestListener } from 'node:http';
import type { Proposition } from '../deduct/parser/ast';
import { parseAndConvertToAst } from '../deduct/parser/compiler';
import { RULES } from '../deduct/formalsystem/rules';
import type { RuleResult } from '../deduct/formalsystem/fsRule';
import type { MatchStrTable, MatchTable } from '../deduct/formalsystem/matchTable';

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});

type Steps = {
	proposition: Proposition;
	rule_id: string;
	chosen_condition: number[];
	match_map: MatchStrTable;
};
/** 证明步骤 */
let steps: Steps[] = [];

/**
 * 查找规则
 */
function findRules(x: string) {
	if (!(x in RULES)) throw new ReferenceError('Cannot find rule ' + x);
	let y = x as keyof typeof RULES;
	return RULES[y];
}
async function replQuestion() {
	while (true) {
		const answer = await ask('>>> ');
		const command = answer.trim();
		if (command === 'exit') break;
		if (command === 'rules') {
			for (const key in RULES) {
				//@ts-ignore
				console.log(`${key}\t\t${RULES[key].toString()}`);
			}
			continue;
		}
		if (command === 'pop') {
			steps.pop();
			console.log('Poped a theorem.');
			continue;
		}
		if (command == 'claer') {
			steps = [];
			console.log('Cleared.');
			continue;
		}
		if (command === 'list') {
			for (let i = 0; i < steps.length; i++) {
				const step = steps[i];
				console.log(`p${i}\t\t${step.rule_id}\t${step.proposition}`);
			}
			continue;
		}
		try {
			const rule = findRules(command);
			const conditions = [];
			const chosen_condition = [];
			for (let i = 0; i < rule.conditionNumber; i++) {
				const cond = Number(await ask(`Enter Theorem ID for ${rule.condition[i]}: `));
				if (!steps[cond]) {
					console.error('Invalid theorem ID');
					continue;
				}
				conditions.push(steps[cond].proposition);
				chosen_condition.push(cond);
			}
			const ruleResult = rule.applyRule(...conditions);
			const replacements: MatchTable = {};
			const match_map: MatchStrTable = {};
			for (let i = 0; i < ruleResult.replaceable.length; i++) {
				const repl = await ask(`Apply ${ruleResult.replaceable[i]}: `);
				replacements[ruleResult.replaceable[i]] = parseAndConvertToAst(repl);
				match_map[ruleResult.replaceable[i]] = repl;
			}
			const result = ruleResult.applyResult(replacements);
			console.log(`Result: ${result}`);
			steps.push({
				proposition: result,
				rule_id: command,
				chosen_condition,
				match_map,
			});
		} catch (e) {
			console.error(e);
		}
	}
	rl.close();
	process.exit(0);
}

function ask(question: string): Promise<string> {
	return new Promise((resolve) => rl.question(question, resolve));
}

export function replMain() {
	replQuestion();
}
