import {
	AnyPropositionAST as AnyProp,
	ImplicationPropositionAST as Impl,
	LetterPropositionAST as LetterProp,
	type Proposition as Prop,
} from '../parser/ast';
class MatchError extends Error {}
type MatchTable = {
	[key: string]: Prop;
};
export class FormalSystem {
	static debugLog(...args: any[]) {
		return;
		return console.debug(...args);
	}
	/**
	 * Match current AST to goal AST
	 *
	 * e.g. `$2>$3` can match `t>q`, `$2>$2` can't match `t>q`, t>q can't match `$2>$2`.
	 * @param currentAST
	 * @param goalAST
	 */
	static match(currentAST: Prop, goalAST: Prop, anyPropositionMap: MatchTable) {
		FormalSystem.debugLog(`Matching ${currentAST} to ${goalAST}`);

		if (goalAST instanceof AnyProp) {
			if (this.freeEquals(currentAST, anyPropositionMap[goalAST.name])) {
				FormalSystem.debugLog(
					`Matched ${goalAST.name} to goalAST(left) ${currentAST.toString()}.`,
				);
				anyPropositionMap[goalAST.name] = currentAST;
			} else {
				throw new MatchError(
					'matching ' + goalAST.name + ' error: goal AST(left) not equals',
				);
			}
			return;
		}

		if (currentAST instanceof Impl && goalAST instanceof Impl) {
			this.match(currentAST.left, goalAST.left, anyPropositionMap);
			this.match(currentAST.right, goalAST.right, anyPropositionMap);
			FormalSystem.debugLog(`Matched implication: ${currentAST} and ${goalAST}`);
			return;
		}
		// 如果一个是蕴含另一个不是，则抛出类型不匹配
		if (currentAST instanceof Impl || goalAST instanceof Impl) {
			throw new MatchError('Proposition type mismatch: implication vs non-implication');
		}

		if (currentAST instanceof LetterProp && goalAST instanceof LetterProp) {
			if (currentAST.name !== goalAST.name) {
				throw new MatchError('Letter proopsition mismatch.');
			}
			return;
		}
		if (currentAST instanceof LetterProp || goalAST instanceof LetterProp) {
			throw new MatchError('Proposition type mismatch: letter vs non-letter');
		}
	}
	/**
	 * Match an AST is equal to another AST.
	 *
	 * @returns
	 */
	static freeEquals(leftAST: Prop | undefined, rightAST: Prop | undefined) {
		if (leftAST === undefined) return true;
		if (rightAST === undefined) return true;
		return leftAST?.toString?.() === rightAST?.toString?.();
	}

	/**
	 * Rule modus ponens, which is $0>$1, $0 ⊢ $1.
	 * @param $0imp$1 $0>$1
	 * @param $0 $0
	 * @returns $1
	 */
	static ruleModusPonens($0imp$1: Prop, $0: Prop) {
		const matchTable: MatchTable = {};
		FormalSystem.debugLog(`Matching modus ponens: ${$0imp$1}, ${$0} ⊢ ???`);
		this.match($0imp$1, new Impl(new AnyProp('$0'), new AnyProp('$1')), matchTable);

		this.match($0, new AnyProp('$0'), matchTable);

		return matchTable['$1'];
	}

	static ruleA1($0: Prop, $1: Prop) {
		return new Impl($0, new Impl($1, $0));
	}
	static ruleA2($0: Prop, $1: Prop, $2: Prop) {
		return new Impl(
			new Impl($0, new Impl($1, $2)),
			new Impl(new Impl($0, $1), new Impl($0, $2)),
		);
	}

	static ruleDotI($0: Prop) {
		const theorem1 = this.ruleA1($0, $0);
		const theorem2 = this.ruleA1($0, new Impl($0, $0));
		const theorem3 = this.ruleA2($0, new Impl($0, $0), $0);
		const theorem4 = this.ruleModusPonens(theorem3, theorem2);
		const theorem5 = this.ruleModusPonens(theorem4, theorem1);
		return theorem5;
	}
}
