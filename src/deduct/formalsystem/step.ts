import type { Proposition } from '../parser/ast';
import type { MatchStrTable } from './matchTable';

export type Step = {
	proposition: Proposition;
	rule_id: string;
	chosen_condition: number[];
	match_map: MatchStrTable;
};
export type StepJSON = {
	// proposition: string;
	proposition: string;
	rule_id: string;
	chosen_condition: number[];
	match_map: MatchStrTable;
};

export function printStep(step: Step) {
	console.table([
		{
			proposition: step.proposition.displayFancy(),
			rule_id: step.rule_id,
			chosen_condition: step.chosen_condition,
			match_map: step.match_map,
		},
	]);
}
