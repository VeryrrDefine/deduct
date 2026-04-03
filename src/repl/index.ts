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

// ==================== 移动步骤的辅助函数 ====================

/**
 * 检查移动步骤 src 到 dst 是否合法
 * @param src 当前索引
 * @param dst 目标索引
 * @returns true 如果合法
 */
function moveStepFromtoPrecheck(src: number, dst: number): boolean {
	if (src === dst) return false;
	if (src < 0 || src >= steps.length) return false;
	if (dst < 0 || dst >= steps.length) return false;

	if (src < dst) {
		// 检查 dst 之前的步骤（实际上是在 src+1 到 dst 之间）是否依赖 src
		const len = steps.length;
		for (let i = src + 1; i <= dst; i++) {
			const step = steps[i];
			for (const ref of step.chosen_condition) {
				if (ref < 0 && ref + len === src) {
					console.error(`Move blocked: step ${i} depends on step ${src}`);
					return false;
				}
			}
		}
	}
	return true;
}

/**
 * 更新某个步骤的 chosen_condition 中引用的步骤索引（由于数组顺序变化）
 * @param cond 步骤的 chosen_condition 数组（会直接修改）
 * @param oldIndex 原步骤索引
 * @param newIndex 新步骤索引
 * @param stepsLenBeforeMove 移动前的 steps 长度
 */
function updateChosenConditionRefs(
	cond: number[],
	oldIndex: number,
	newIndex: number,
	stepsLenBeforeMove: number,
) {
	for (let i = 0; i < cond.length; i++) {
		const ref = cond[i];
		if (ref >= 0) continue; // hypothesis 引用不变
		const originalStepIndex = ref + stepsLenBeforeMove;
		if (originalStepIndex === oldIndex) {
			// 更新为新的步骤索引（存储为负数）
			cond[i] = newIndex - stepsLenBeforeMove;
		}
	}
}

/**
 * 移动步骤：将 steps[src] 移动到 steps[dst] 位置，并调整所有受影响的步骤的引用
 * @param src 当前索引
 * @param dst 目标索引
 * @param forward true 表示向后移动（src < dst），false 表示向前移动（src > dst）
 */
function moveStepFromto(src: number, dst: number, forward: boolean) {
	const stepsLenBefore = steps.length;
	// 取出要移动的步骤
	const movedStep = steps[src];

	if (forward) {
		// 向后移动：src < dst，将元素移到后面
		// 将 src+1 .. dst 的元素向左移动一位
		for (let i = src; i < dst; i++) {
			steps[i] = steps[i + 1];
		}
		steps[dst] = movedStep;
	} else {
		// 向前移动：src > dst，将元素移到前面
		// 将 dst .. src-1 的元素向右移动一位
		for (let i = src; i > dst; i--) {
			steps[i] = steps[i - 1];
		}
		steps[dst] = movedStep;
	}

	// 更新所有受影响的步骤中的 chosen_condition 引用
	// 受影响的步骤包括：
	// 1. 被移动的步骤自身（它的 chosen_condition 中引用的步骤索引未变，但步骤数组长度未变，无需更新）
	// 2. 在移动过程中索引发生变化的步骤（即原区间内的步骤）
	// 3. 所有引用了被移动步骤的步骤（需要将旧索引改为新索引）

	// 首先，收集所有索引发生变化的步骤的旧索引->新索引映射
	const indexMap = new Map<number, number>();
	if (forward) {
		// 向后移动：原 src 变为 dst，原 src+1..dst 变为 src..dst-1
		for (let i = src; i <= dst; i++) {
			if (i === src) indexMap.set(i, dst);
			else indexMap.set(i, i - 1);
		}
	} else {
		// 向前移动：原 src 变为 dst，原 dst..src-1 变为 dst+1..src
		for (let i = dst; i <= src; i++) {
			if (i === src) indexMap.set(i, dst);
			else indexMap.set(i, i + 1);
		}
	}

	// 更新所有步骤（包括被移动的步骤）的 chosen_condition
	for (let i = 0; i < steps.length; i++) {
		const step = steps[i];
		// 更新 step 中引用的步骤索引
		for (let j = 0; j < step.chosen_condition.length; j++) {
			const ref = step.chosen_condition[j];
			if (ref >= 0) continue; // hypothesis 引用不变
			const originalStepIndex = ref + stepsLenBefore;
			if (indexMap.has(originalStepIndex)) {
				const newStepIndex = indexMap.get(originalStepIndex)!;
				step.chosen_condition[j] = newStepIndex - steps.length;
			}
		}
	}
}

function popHyp() {
	let id = hypothesis.length - 1;
	for (const step of steps) {
		if (step.chosen_condition.includes(id)) throw new LogicError('Unable to remove');
	}
	hypothesis.pop();
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
					if (hyp == '.pop') {
						popHyp();
						console.log('Hypothesis removed');
						continue;
					}
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
				if (!steps[src] || !steps[dst]) {
					console.error('Invalid theorem ID');
					continue;
				}
				if (src === dst) {
					console.log('Nothing happens');
					continue;
				}
				if (!moveStepFromtoPrecheck(src, dst)) {
					console.error('Unable to move because precheck failed');
					continue;
				}
				const forward = src < dst;
				moveStepFromto(src, dst, forward);
				console.log('Moved successfully');
				continue;
			}

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
