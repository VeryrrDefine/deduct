import { FormalSystem } from './deduct/formalsystem';
import parser from './deduct/parser';
import { toProposition, toRule } from './deduct/parser/compiler';

const deduct = {
	parser,
	FormalSystem,
	toProposition,
	toRule,
};
export default deduct;
