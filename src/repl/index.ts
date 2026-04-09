import readline from 'node:readline';
import { toProposition } from '../deduct/parser/compiler';
import { type TheoremJSON } from '../deduct/formalsystem/fsRule';
import type { MatchStrTable, MatchTable } from '../deduct/formalsystem/matchTable';
import { TheoremJSONHandler } from '../deduct/formalsystem/theorem-json-handler';
import fs from 'node:fs/promises';
import { FormalSystem } from '../deduct/formalsystem';
const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});

const formalSystem = new FormalSystem();

// ==================== 移动步骤的辅助函数 ====================

async function saveTheorems(filename: string = 'proofs.json') {
	// const data = userTheorems;
	const keys = formalSystem.getUserTheorems();
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
		TheoremJSONHandler.JSONTOTheorem(proofs[key], key).addInto(formalSystem, key);
	}
	console.log('Loaded successfully');
}
await loadTheorems();
function testRule() {
	let rules_notpassed: string[] = [];
	let total: number = 0;
	for (const entry of formalSystem.listRules()) {
		if (entry[1].condition.length >= 1) {
			try {
				total++;
				let res = formalSystem.genRule('>' + entry[0])!;
				console.log('>' + entry, '合格');
				let entry2 = '>' + entry;
			} catch (e) {
				console.error('>' + entry, '不合格');
				rules_notpassed.push('>' + entry);
				console.error(e);
			}
		}
	}

	console.log(`共 ${total}, ${rules_notpassed.length} 不合格`, rules_notpassed);
}

async function replQuestion() {
	while (true) {
		try {
			const answer = await ask(`p${formalSystem.steps.length.toString().padStart(6, '0')}|`);
			const command = answer.trim();
			if (command === 'help') {
				console.log(
					`\nDEDUCT v0.0.0 HELP\n\n\nexit\t\t\tExit this program\npop\t\t\tremove the last theorem\nclear\t\t\tclear all theorems\nlist [ruleId]\t\tList Proof steps\nrules\t\t\tList theorems & axioms\ntheorem\t\t\tCreate Theorem from current step\n[RULENAME]\t\tApply theorems/axioms\nhyp\t\t\tAdd hypothesis\nmv\t\t\tMove a proposition from ... to ...\nsave\t\t\tSave your theorems to proofs.json\nload\t\t\tLoad your theorems from proofs.json`,
				);
				continue;
			}
			if (command === 'testmdt') {
				testRule();
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
				formalSystem.hypothesis = [];
				console.log('Cleared.');
				continue;
			}
			if (command.startsWith('list')) {
				let commands = command.split(' ');
				if (commands[1]) console.table(formalSystem.listStepDetails(commands[1]));
				else console.table(formalSystem.listStepDetails());
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
						formalSystem.popHyp();
						console.log('Hypothesis removed');
						continue;
					}
					formalSystem.addHypothesis(toProposition(hyp));
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
				const stepId = parts[2];

				if (!name.startsWith('s') && !name.startsWith('.')) {
					console.error("User Theorem must starts with 's' or '.'");
					continue;
				}
				formalSystem.toNewTheorem(name, stepId !== undefined ? Number(stepId) : undefined);
				console.log(`Added theorem "${name}".`);
				await saveTheorems();
				formalSystem.removePropositions(1 / 0);
				formalSystem.hypothesis = [];
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
				formalSystem.moveProposition(src, dst);
				console.log('Moved successfully');
				continue;
			}
			if (command == 'metarule') {
				let c = await ask('Enter Metarule: ');
				let find = formalSystem.metaRules.find((x) => x[1] == c);
				if (find === undefined) {
					console.error('Cannot find metarule ' + c);
					continue;
				}

				const applyRule = await ask(`[${find[0]}]Rule: `);

				find[2](applyRule);

				console.log(`Applied. New rule is ${find[0]}${applyRule}`);
				continue;
			}
			const rule = formalSystem.findRules(command);
			const conditions = [];
			const chosen_condition = [];
			let uncomplete = false;
			for (let i = 0; i < rule.conditionNumber; i++) {
				let id = await ask(`Enter Theorem ID for ${rule.condition[i].displayFancy()}: `);
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
			const replacements: MatchTable = {};
			const match_map: MatchStrTable = {};
			for (let i = 0; i < rule.replaceable.length; i++) {
				const repl = await ask(`Apply $${rule.replaceable[i]}: `);
				replacements[rule.replaceable[i]] = toProposition(repl);
				match_map[rule.replaceable[i]] = repl;
			}
			const result = formalSystem.deduct(command, match_map, chosen_condition);
			console.log(`Result: ${result[0].displayFancy()}`);
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
