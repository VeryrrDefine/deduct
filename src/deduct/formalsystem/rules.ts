import { parseAndConvertToAst } from '../parser/compiler';
import type { FormalSystemRule } from './fsRule';

export const RULES = {
	mp: parseAndConvertToAst('$0>$1, $0|-$1', true) as FormalSystemRule,
	a1: parseAndConvertToAst('|-$0>($1>$0)', true) as FormalSystemRule,
	a2: parseAndConvertToAst('|-($0>($1>$2))>(($0>$1)>($0>$2))', true) as FormalSystemRule,
	a3: parseAndConvertToAst('|-(~$0>~$1)>($1>$0)', true) as FormalSystemRule,
	'd<>1': parseAndConvertToAst('|-($0<>$1)>~(($0>$1)>~($1>$0))', true) as FormalSystemRule,
	'd<>2': parseAndConvertToAst('|-~(($0>$1)>~($1>$0))>($0<>$1)', true) as FormalSystemRule,
	'd|': parseAndConvertToAst('⊢($0|$1)<>(~$0>$1)', true) as FormalSystemRule,
	'd&': parseAndConvertToAst('⊢($0&$1)<>~($0>~$1)', true) as FormalSystemRule,
};
