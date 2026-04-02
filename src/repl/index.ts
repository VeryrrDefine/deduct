import readline from 'node:readline';
import { FormalSystem } from '../deduct/formalsystem';
import type { RequestListener } from 'node:http';
import type { Proposition } from '../deduct/parser/ast';
import { parseAndConvertToAst } from '../deduct/parser/compiler';
import { RULES } from '../deduct/formalsystem/rules';
import type { RuleResult } from '../deduct/formalsystem/fsRule';
import type { MatchTable } from '../deduct/formalsystem/matchTable';

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});

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
		if (command === '.exit') break;
		if (command === 'rules') {
			for (const key in RULES) {
				//@ts-ignore
				console.log(`${key}\t\t${RULES[key].toString()}`);
			}
			continue;
		}
		try {
			const rule = findRules(command);
			const conditions = [];
			for (let i = 0; i < rule.conditionNumber; i++) {
				const cond = await ask(`Condition ${rule.condition[i]}: `);
				conditions.push(parseAndConvertToAst(cond));
			}
			const ruleResult = rule.applyRule(...conditions);
			const replacements: MatchTable = {};
			for (let i = 0; i < ruleResult.replaceable.length; i++) {
				const repl = await ask(`Apply ${ruleResult.replaceable[i]}: `);
				replacements[ruleResult.replaceable[i]] = parseAndConvertToAst(repl);
			}
			const result = ruleResult.applyResult(replacements);
			console.log(`Result: ${result}`);
		} catch (e) {
			console.error(e);
		}
	}
	rl.close();
}

function ask(question: string): Promise<string> {
	return new Promise((resolve) => rl.question(question, resolve));
}

export function replMain() {
	replQuestion();
}
