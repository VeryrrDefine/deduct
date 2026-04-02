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
