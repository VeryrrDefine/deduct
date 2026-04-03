import readline from 'node:readline';
import { parseAndConvertToAst } from '../deduct/parser/compiler';
import { FormalSystemRule, type RuleResult, type TheoremJSON } from '../deduct/formalsystem/fsRule';
import type { MatchStrTable, MatchTable } from '../deduct/formalsystem/matchTable';
import type { Step } from '../deduct/formalsystem/step';
import { TheoremJSONHandler } from '../deduct/formalsystem/theorem-json-handler';
import fs from 'node:fs/promises';
import { LogicError } from '../deduct/formalsystem/errors';
import type { Proposition } from '../deduct/parser/ast';
import { FormalSystem } from '../deduct/formalsystem';
const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});

const formalSystem = new FormalSystem();

// ==================== 移动步骤的辅助函数 ====================

function popHyp() {
	let id = formalSystem.hypothesis.length - 1;
	for (const step of formalSystem.steps) {
		if (step.chosen_condition.includes(id)) throw new LogicError('Unable to remove');
	}
	formalSystem.hypothesis.pop();
}

async function saveTheorems(filename: string = 'proofs.json') {
	// const data = userTheorems;
	const keys = Object.keys(formalSystem.getUserTheorems());
	let result: Record<string, TheoremJSON> = {};
	for (const key of keys) {
		result[key] = TheoremJSONHandler.theoremToJSON(formalSystem.findRules(key));
	}
	await fs.writeFile(filename, JSON.stringify(result, null, 2), 'utf-8');
	console.log('Saved successfully');
	return result;
}

async function loadTheorems(filename: string = 'proofs.json') {
	const data = await fs.readFile(filename, 'utf-8');
	const proofs = JSON.parse(data);
	for (const key in proofs) {
		TheoremJSONHandler.JSONTOTheorem(proofs[key]).addInto(formalSystem, key);
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
					`\nDEDUCT v0.0.0 HELP\n\n\nexit\t\t\tExit this program\npop\t\t\tremove the last theorem\nclear\t\t\tclear all theorems\nlist\t\t\tList Proof steps\nrules\t\t\tList theorems & axioms\ntheorem\t\t\tCreate Theorem from current step\n[RULENAME]\t\tApply theorems/axioms\nhyp\t\t\tAdd hypothesis\nmv\t\t\tMove a proposition from ... to ...\nsave\t\t\tSave your theorems to proofs.json\nload\t\t\tLoad your theorems from proofs.json`,
				);
				continue;
			}
			if (command === 'exit') break;
			if (command === 'rules') {
				console.table(formalSystem.listRuleDetails());
				continue;
			}
			if (command === 'pop') {
				formalSystem.removePropositions();
				console.log('Poped a theorem.');
				continue;
			}
			if (command == 'clear') {
				formalSystem.removePropositions(Infinity);
				console.log('Cleared.');
				continue;
			}
			if (command === 'list') {
				console.table(formalSystem.listStepDetails());
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
						popHyp();
						console.log('Hypothesis removed');
						continue;
					}
					formalSystem.hypothesis.push(parseAndConvertToAst(hyp));
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
				const stepId = Number(parts[2] || formalSystem.steps.length - 1);
				if (isNaN(stepId) || !formalSystem.steps[stepId]) {
					console.error('Invalid step ID');
					continue;
				}
				if (!name.startsWith('s') && !name.startsWith('.')) {
					console.error("User Theorem must starts with 's' or '.'");
					continue;
				}
				FormalSystemRule.asTheorem(
					formalSystem.hypothesis,
					formalSystem.steps[stepId].proposition,
					formalSystem.steps,
				).addInto(formalSystem, name);
				console.log(`Added theorem "${name}".`);
				continue;
			}
			if (command.startsWith('mv')) {
				const parts = command.split(' ');
				if (parts.length < 3) {
					console.error('Usage: mv <src> <destination>');
					continue;
				}
				const src = Number(parts[1]);
				const dst = Number(parts[2]);

				if (isNaN(src) || isNaN(dst)) {
					console.error('Invalid number');
					continue;
				}
				if (!formalSystem.steps[src] || !formalSystem.steps[dst]) {
					console.error('Invalid theorem ID');
					continue;
				}
				if (src === dst) {
					console.log('Nothing happens');
					continue;
				}
				formalSystem.moveProposition(src, dst);
				console.log('Moved successfully');
				continue;
			}

			const rule = formalSystem.findRules(command);
			const conditions = [];
			const chosen_condition = [];
			let uncomplete = false;
			for (let i = 0; i < rule.conditionNumber; i++) {
				let id = await ask(`Enter Theorem ID for $${rule.condition[i]}: `);
				if (id.startsWith('h')) {
					const cond = Number(id.slice(1));
					if (!formalSystem.hypothesis[cond]) {
						console.error('Invalid Hypothesis ID');
						i--;
						uncomplete = true;
						break;
					}

					conditions.push(formalSystem.hypothesis[cond]);
					chosen_condition.push(cond);
				} else {
					const cond = Number(id);
					if (!formalSystem.steps[cond]) {
						console.error('Invalid theorem ID');
						i--;
						uncomplete = true;
						break;
					}
					conditions.push(formalSystem.steps[cond].proposition);
					chosen_condition.push(cond - formalSystem.steps.length);
				}
			}
			if (uncomplete) {
				continue;
			}
			const ruleResult = rule.applyRule(chosen_condition, ...conditions);
			const replacements: MatchTable = {};
			const match_map: MatchStrTable = {};
			for (let i = 0; i < ruleResult.replaceable.length; i++) {
				const repl = await ask(`Apply $${ruleResult.replaceable[i]}: `);
				replacements[ruleResult.replaceable[i]] = parseAndConvertToAst(repl);
				match_map[ruleResult.replaceable[i]] = repl;
			}
			const result = ruleResult.applyResultAndDeduct(replacements, formalSystem);
			console.log(`Result: ${result}`);
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
