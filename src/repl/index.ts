import readline from 'node:readline';
import { parseAndConvertToAst } from '../deduct/parser/compiler';
import { findRules, RULES, userTheorems } from '../deduct/formalsystem/rules';
import { FormalSystemRule, type RuleResult, type TheoremJSON } from '../deduct/formalsystem/fsRule';
import type { MatchStrTable, MatchTable } from '../deduct/formalsystem/matchTable';
import type { Step } from '../deduct/formalsystem/step';
import { TheoremJSONHandler } from '../deduct/formalsystem/theorem-json-handler';
import fs from 'node:fs/promises';
import { LogicError } from '../deduct/formalsystem/errors';
const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});

/** 证明步骤 */
let steps: Step[] = [];

/**
 * 将一个步骤移动到后一步的步骤
 * @param direction 方向，true为+1,false为-1
 */
function moveStepFromto(src: number, direction = true) {
	if (steps.length - 1 == src && direction) return;
	if (src == 0 && !direction) return;
	if (direction) {
		// 如果前方的命题需要这个src命题，那么报错
		if (steps[src + 1].chosen_condition.includes(src)) {
			throw new LogicError('Unable to move: next proposition required');
		}
		// 把所有依赖src+1的命题修改成src，把所有依赖src的命题修改成src+1
		for (let i = src + 2; i < steps.length - 1; i++) {
			const curstep = steps[i];
			curstep.chosen_condition = curstep.chosen_condition.map((x) =>
				x == src + 1 ? src : x == src ? src + 1 : x,
			);
		}
		let temp = steps[src];
		let temp2 = steps[src + 1];
		steps[src] = temp2;
		steps[src + 1] = temp;
	} else {
		// 把所有依赖src-1的命题修改成src，把所有依赖src的命题修改成src-1
		for (let i = src + 1; i < steps.length - 1; i++) {
			const curstep = steps[i];
			curstep.chosen_condition = curstep.chosen_condition.map((x) =>
				x == src - 1 ? src : x == src ? src - 1 : x,
			);
		}
		let temp = steps[src];
		let temp2 = steps[src - 1];
		steps[src] = temp2;
		steps[src - 1] = temp;
	}
}

function moveStepFromtoPrecheck(src: number, destination: number) {
	if (src >= destination) return true;
	for (let j = src; j < destination; j++) {
		for (let i = j + 1; i <= destination; i++) {
			if (steps[i].chosen_condition.includes(j)) {
				return false;
			}
		}
	}
	return true;
}
function removeStep(step: number) {
	for (let i = step; i < steps.length; i++) {
		if (steps[i].chosen_condition.includes(i)) {
			throw new LogicError('Unable to remove rule because ' + i + ' required it');
		}
	}
	for (let i = step; i < steps.length; i++) {
		moveStepFromto(i, true);
	}
	steps.pop();
}
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
					if (hyp == '.pop') {
						let lastHyp = NaN;
						for (let i = steps.length - 1; i >= 0; i--) {
							if (steps[i].rule_id == 'hyp') {
								lastHyp = i;
								break;
							}
						}
						if (isNaN(lastHyp)) {
							console.error('Something went wrong');
							continue;
						}
						removeStep(lastHyp);
						console.log('Hypothesis removed');
						continue;
					}
					steps.push({
						proposition: parseAndConvertToAst(hyp),
						rule_id: 'hyp',
						chosen_condition: [],
						match_map: {},
					});
				}
				continue;
			}
			if (command.startsWith('theorem')) {
				const parts = command.split(' ');
				if (parts.length < 2) {
					console.error('Usage: theorem s<name> [stepId]');
					continue;
				}
				const name = parts[1];
				// 如果没有输入stepId,默认取最后一个
				const stepId = Number(parts[2] || steps.length - 1);
				if (isNaN(stepId) || !steps[stepId]) {
					console.error('Invalid step ID');
					continue;
				}
				if (!name.startsWith('s')) {
					console.error("User Theorem must starts with 's'");
					continue;
				}
				let hypothesis = steps.filter((x) => x.rule_id == 'hyp').map((x) => x.proposition);
				userTheorems[name] = FormalSystemRule.asTheorem(
					hypothesis,
					steps[stepId].proposition,
					steps,
				);
				console.log(`Added theorem "${name}" -> ${steps[stepId].proposition}`);
				continue;
			}
			if (command.startsWith('mv')) {
				const parts = command.split(' ');
				if (parts.length < 3) {
					console.error('Move: move <src> <destination>');
					continue;
				}
				const src = Number(parts[1]);
				const destination = Number(parts[2]);

				if (!steps[src] || !steps[destination]) {
					console.error('Invalid theorem ID');
					continue;
				}

				if (src == destination) {
					console.log('Nothing happens');
					continue;
				}
				if (!moveStepFromtoPrecheck(src, destination)) {
					console.error('Unable to move because precheck failed');
					continue;
				}
				if (src < destination) {
					for (let i = src; i < destination; i++) {
						moveStepFromto(i, true);
					}
					console.log('Moved successfully');
					continue;
				}
				if (src > destination) {
					for (let i = src; i > destination; i--) {
						moveStepFromto(i, false);
					}
					console.log('Moved successfully');
					continue;
				}
			}

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
