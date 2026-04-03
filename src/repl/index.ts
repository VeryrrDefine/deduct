import readline from 'node:readline';
import { parseAndConvertToAst } from '../deduct/parser/compiler';
import { findRules, RULES, userTheorems } from '../deduct/formalsystem/rules';
import { FormalSystemRule, type RuleResult, type TheoremJSON } from '../deduct/formalsystem/fsRule';
import type { MatchStrTable, MatchTable } from '../deduct/formalsystem/matchTable';
import type { Step } from '../deduct/formalsystem/step';
import { TheoremJSONHandler } from '../deduct/formalsystem/theorem-json-handler';
import fs from 'node:fs/promises';
import { LogicError } from '../deduct/formalsystem/errors';
import type { Proposition } from '../deduct/parser/ast';
const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});

/** 假设列表 */
let hypothesis: Proposition[] = [];
/** 证明步骤 */
let steps: Step[] = [];

async function saveTheorems(filename: string = 'proofs.json') {
	const data = userTheorems;
	const keys = Object.keys(data);
	let result: Record<string, TheoremJSON> = {};
	for (const key of keys) {
		result[key] = TheoremJSONHandler.theoremToJSON(data[key]);
	}

	await fs.writeFile(filename, JSON.stringify(result, null, 2), 'utf-8');
	console.log('Saved successfully');
	return result;
}

async function loadTheorems(filename: string = 'proofs.json') {
	const data = await fs.readFile(filename, 'utf-8');
	const proofs = JSON.parse(data);

	let replace: {
		[key: string]: FormalSystemRule;
	} = {};
	for (const key in proofs) {
		replace[key] = TheoremJSONHandler.JSONTOTheorem(proofs[key]);
	}
	for (const key in userTheorems) {
		delete userTheorems[key];
	}
	for (const key in replace) {
		userTheorems[key] = replace[key];
	}
	console.log('Loaded successfully');
}

async function replQuestion() {
	while (true) {
		try {
			const answer = await ask('>>> ');
			const command = answer.trim();
			if (command === 'help') {
				console.log(
					`Help\nexit\t\t\tExit this program\npop\t\t\tremove the last theorem\nclear\t\t\tclear all theorems\nlist\t\t\tList Proof steps\nrules\t\t\tList theorems & axioms\ntheorem\t\t\tCreate Theorem from current step\n[RULENAME]\t\tApply theorems/axioms\nsave\t\t\tSave your theorems to proofs.json\nload\t\t\tLoad your theorems from proofs.json`,
				);
				continue;
			}
			if (command === 'exit') break;
			if (command === 'rules') {
				for (const key in RULES) {
					//@ts-ignore
					console.log(`${key}\t\t${RULES[key].toString()}`);
				}
				for (const key in userTheorems) {
					//@ts-ignore
					console.log(`${key}\t\t${userTheorems[key].toString()}`);
				}
				continue;
			}
			if (command === 'pop') {
				steps.pop();
				console.log('Poped a theorem.');
				continue;
			}
			if (command == 'clear') {
				steps = [];
				console.log('Cleared.');
				continue;
			}
			if (command === 'list') {
				for (let i = 0; i < hypothesis.length; i++) {
					const step = hypothesis[i];
					console.log(`h${i}\t\t\t${step.toString()}`);
				}
				for (let i = 0; i < steps.length; i++) {
					const step = steps[i];
					console.log(`p${i}\t\t${step.rule_id}\t${step.proposition}`);
				}
				continue;
			}
			if (command === 'save') {
				await saveTheorems();
				continue;
			}
			if (command === 'load') {
				await loadTheorems();
				continue;
			}
			if (command === 'hyp') {
				console.log('Enter Hypothesis, enter .exit to exit, enter .pop to pop');
				while (true) {
					const hyp = await ask('H>>> ');
					if (hyp == '.exit') {
						break;
					}
					// if (hyp == '.pop') {

					// 	popHyp();
					// 	console.log('Hypothesis removed');
					// 	continue;
					// }
					hypothesis.push(parseAndConvertToAst(hyp));
				}
				continue;
			}
			if (command.startsWith('theorem')) {
				const parts = command.split(' ');
				if (parts.length < 2) {
					console.error(
						"Usage: theorem <name> [stepId]\nName must starts with 's' or '.'",
					);
					continue;
				}
				const name = parts[1];
				// 如果没有输入stepId,默认取最后一个
				const stepId = Number(parts[2] || steps.length - 1);
				if (isNaN(stepId) || !steps[stepId]) {
					console.error('Invalid step ID');
					continue;
				}
				if (!name.startsWith('s') && !name.startsWith('.')) {
					console.error("User Theorem must starts with 's' or '.'");
					continue;
				}
				userTheorems[name] = FormalSystemRule.asTheorem(
					hypothesis,
					steps[stepId].proposition,
					steps,
				);
				console.log(`Added theorem "${name}" -> ${steps[stepId].proposition}`);
				continue;
			}
			// if (command.startsWith('mv')) {
			// 	const parts = command.split(' ');
			// 	if (parts.length < 3) {
			// 		console.error('Move: move <src> <destination>');
			// 		continue;
			// 	}
			// 	const src = Number(parts[1]);
			// 	const destination = Number(parts[2]);

			// 	if (!steps[src] || !steps[destination]) {
			// 		console.error('Invalid theorem ID');
			// 		continue;
			// 	}

			// 	if (src == destination) {
			// 		console.log('Nothing happens');
			// 		continue;
			// 	}
			// 	if (!moveStepFromtoPrecheck(src, destination)) {
			// 		console.error('Unable to move because precheck failed');
			// 		continue;
			// 	}
			// 	if (src < destination) {
			// 		for (let i = src; i < destination; i++) {
			// 			moveStepFromto(i, true);
			// 		}
			// 		console.log('Moved successfully');
			// 		continue;
			// 	}
			// 	if (src > destination) {
			// 		for (let i = src; i > destination; i--) {
			// 			moveStepFromto(i, false);
			// 		}
			// 		console.log('Moved successfully');
			// 		continue;
			// 	}
			// }

			const rule = findRules(command);
			const conditions = [];
			const chosen_condition = [];
			let uncomplete = false;
			for (let i = 0; i < rule.conditionNumber; i++) {
				let id = await ask(`Enter Theorem ID for ${rule.condition[i]}: `);
				if (id.startsWith('h')) {
					const cond = Number(id.slice(1));
					if (!hypothesis[cond]) {
						console.error('Invalid Hypothesis ID');
						i--;
						uncomplete = true;
						break;
					}

					conditions.push(hypothesis[cond]);
					chosen_condition.push(cond);
				} else {
					const cond = Number(id);
					if (!steps[cond]) {
						console.error('Invalid theorem ID');
						i--;
						uncomplete = true;
						break;
					}
					conditions.push(steps[cond].proposition);
					chosen_condition.push(cond - steps.length);
				}
			}
			if (uncomplete) {
				continue;
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
