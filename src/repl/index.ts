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
let replacements = {} as MatchTable;
let replacementIndex = 0;

/**
 * 应用规则的第二步：对部分$0,$1标记进行替换，输出最终命题
 */
function replApplyRuleReplacement(x: RuleResult) {
	if (replacementIndex >= x.replaceable.length) {
		let result = x.applyResult(replacements);
		console.log(`Result: ${result}`);
		replacements = {};
		replacementIndex = 0;
		replQuestion();
	} else {
		rl.question(`Apply ${x.replaceable[replacementIndex]}:`, function (answer) {
			try {
				replacements[x.replaceable[replacementIndex]] = parseAndConvertToAst(answer);
				replacementIndex++;
				replApplyRuleReplacement(x);
			} catch (e) {
				console.error(e);
				replacements = {};
				replacementIndex = 0;
				replQuestion();
			}
		});
	}
}
let conditions = [] as Proposition[];
let conditionIndex = 0;
/**
 * 应用规则的第一步：检查规则的条件，输出规则的结果（未应用）
 */
function replApplyRule(x: (typeof RULES)[keyof typeof RULES]) {
	if (conditionIndex >= x.conditionNumber) {
		let result = x.applyRule(...conditions);

		conditions = [];
		conditionIndex = 0;
		//开始替换$0,$1标记
		replApplyRuleReplacement(result);
		return;
	} else {
		rl.question(`Condition ${x.condition[conditionIndex]}: `, function (answer) {
			try {
				conditions[conditionIndex] = parseAndConvertToAst(answer);
				conditionIndex++;

				// 继续条件检查
				replApplyRule(x);
			} catch (e) {
				console.error(e);
				conditions = [];
				conditionIndex = 0;
				replQuestion();
			}
		});
	}
}

function replQuestion() {
	rl.question('>>> ', function (answer) {
		try {
			const command = answer;
			if (command == '.exit') {
				rl.close();
				return;
			}

			if (command == 'rules') {
				const keys = Object.keys(RULES);
				for (const key of keys) {
					// @ts-ignore
					console.log(key + '\t\t' + RULES[key].toString());
				}
				replQuestion();
				return;
			}
			let tryFind = findRules(command);
			replApplyRule(tryFind);
			replQuestion();
			return;
		} catch (e) {
			console.error(e);
			replQuestion();
		}
	});
}

export function replMain() {
	replQuestion();
}
