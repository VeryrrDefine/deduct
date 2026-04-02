import {
	AnyPropositionAST as AnyProp,
	IffPropositionAST as Iff,
	ImplicationPropositionAST as Impl,
	LetterPropositionAST as LetterProp,
	NotPropositionAST as Not,
	type Proposition as Prop,
} from '../parser/ast';
class MatchError extends Error {}
class LogicError extends Error {}
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
	 * e.g. `t>q` can match `$2>$3`, `t>q` can't match `$2>$2`, `$1` can't match `t`.
	 * @param currentAST
	 * @param goalAST
	 */
	static match(currentAST: Prop, goalAST: Prop, anyPropositionMap: MatchTable) {
		FormalSystem.debugLog(`Matching ${currentAST} to ${goalAST}`);

		//match方法中currentAST的$0,$1 是类似于字母类型的命题，而要匹配goalAST中的$xxx，故只处理了goalAST 是anyprop的情况。
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

		if (currentAST instanceof Iff && goalAST instanceof Iff) {
			this.match(currentAST.left, goalAST.left, anyPropositionMap);
			this.match(currentAST.right, goalAST.right, anyPropositionMap);
			FormalSystem.debugLog(`Matched iff: ${currentAST} and ${goalAST}`);
			return;
		}
		// 如果一个是当且仅当另一个不是，则抛出类型不匹配
		if (currentAST instanceof Iff || goalAST instanceof Iff) {
			throw new MatchError('Proposition type mismatch: iff vs non-iff');
		}

		if (currentAST instanceof Not && goalAST instanceof Not) {
			this.match(currentAST.prop, goalAST.prop, anyPropositionMap);
			FormalSystem.debugLog(`Matched not: ${currentAST} and ${goalAST}`);
			return;
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

		throw new MatchError(
			`Unsupported or mismatched proposition types: ${currentAST.constructor.name} vs ${goalAST.constructor.name}`,
		);
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
	 * Rule modus ponens, which is `$0>$1, $0 ⊢ $1.`
	 * @param $0imp$1 `$0>$1`
	 * @param $0 `$0`
	 * @returns `$1`
	 */
	static ruleModusPonens($0imp$1: Prop, $0: Prop) {
		const matchTable: MatchTable = {};
		FormalSystem.debugLog(`Matching modus ponens: ${$0imp$1}, ${$0} ⊢ ???`);
		this.match($0imp$1, new Impl(new AnyProp('$0'), new AnyProp('$1')), matchTable);

		this.match($0, new AnyProp('$0'), matchTable);

		const matchResult = matchTable['$1'];
		if (matchResult === undefined) throw new ReferenceError('Unable to get $1.');
		return matchResult;
	}

	/**
	 * Rule A1, which is `⊢$0>($1>$0)`
	 */
	static ruleA1($0: Prop, $1: Prop) {
		return new Impl($0, new Impl($1, $0));
	}
	/**
	 * Rule A2, which is `⊢($0>($1>$2))>(($0>$1)>($0>$2))`
	 */
	static ruleA2($0: Prop, $1: Prop, $2: Prop) {
		return new Impl(
			new Impl($0, new Impl($1, $2)),
			new Impl(new Impl($0, $1), new Impl($0, $2)),
		);
	}

	/**
	 * Rule A3, which is `⊢(~$0>~$1)>($1>$0)`
	 */
	static ruleA3($0: Prop, $1: Prop) {
		return new Impl(new Impl(new Not($0), new Not($1)), new Impl($1, $0));
	}

	/**
	 * 1st of Definition of 1ff.
	 *
	 * `⊢($0<>$1)>~(($0>$1)>~($1>$0))`
	 */
	static ruleDefinitionIff1($0: Prop, $1: Prop) {
		return new Impl(
			new Iff($0, $1),
			new Not(new Impl(new Impl($0, $1), new Not(new Impl($1, $0)))),
		);
	}

	/**
	 * 2nd of Definition of 1ff.
	 *
	 * `⊢~(($0>$1)>~($1>$0))>($0<>$1)`
	 */
	static ruleDefinitionIff2($0: Prop, $1: Prop) {
		return new Impl(
			new Not(new Impl(new Impl($0, $1), new Not(new Impl($1, $0)))),
			new Iff($0, $1),
		);
	}

	/**
	 * `.i` Theorem.
	 *
	 * `⊢$0>$0`
	 */
	static ruleDotI($0: Prop) {
		// $0>($0>$0)
		const theorem1 = this.ruleA1($0, $0);
		// $0>(($0>$0)>$0)
		const theorem2 = this.ruleA1($0, new Impl($0, $0));
		// $0>(($0>$0)>$0)>(($0>($0>$0)) > ($0>$0))
		const theorem3 = this.ruleA2($0, new Impl($0, $0), $0);
		// (($0>($0>$0)) > ($0>$0))
		const theorem4 = this.ruleModusPonens(theorem3, theorem2);
		// ($0>$0)
		const theorem5 = this.ruleModusPonens(theorem4, theorem1);

		return theorem5;
	}
}
