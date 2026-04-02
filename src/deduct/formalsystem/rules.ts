import { FormalSystemRule } from './fsRule';

export const RULES = {
	mp: FormalSystemRule.fromString('$0>$1, $0|-$1'),
	a1: FormalSystemRule.fromString('|-$0>($1>$0)'),
	a2: FormalSystemRule.fromString('|-($0>($1>$2))>(($0>$1)>($0>$2))'),
	a3: FormalSystemRule.fromString('|-(~$0>~$1)>($1>$0)'),
	'd<>1': FormalSystemRule.fromString('|-($0<>$1)>~(($0>$1)>~($1>$0))'),
	'd<>2': FormalSystemRule.fromString('|-~(($0>$1)>~($1>$0))>($0<>$1)'),
	'd|': FormalSystemRule.fromString('⊢($0|$1)<>(~$0>$1)'),
	'd&': FormalSystemRule.fromString('⊢($0&$1)<>~($0>~$1)'),
};

/**用户自定义规则 */
export let userTheorems: {
	[key: string]: FormalSystemRule;
} = {};
/**
 * 查找规则
 */
export function findRules(x: string) {
	if (x in RULES) {
		let y = x as keyof typeof RULES;
		return RULES[y];
	}
	if (x in userTheorems) {
		let y = x as keyof typeof userTheorems;
		return userTheorems[y] as FormalSystemRule;
	}
	throw new ReferenceError('Cannot find rule ' + x);
}
