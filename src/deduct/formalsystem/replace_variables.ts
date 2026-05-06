import {
	TermEqualsAST,
	type AnyTermAST,
	type LetterTermAST,
	type Proposition,
	type Term,
} from '../parser/ast';

/**
 * 替换变量， 替换自由出现的变量为指定的值。
 * #rp(命题, 变量，项)
 * 命题中如果有Vy:(x=y), 如果x替换成y，y会被量词约束，这是不允许的。
 * Vy:(x=y)，将x替换成$0，因为$0可能是y，所以也会报错。
 *
 * $0替换为x,$0可能是任何一个变量，因此不做处理。
 * 不替换全称量词和存在量词中Vx的x。
 *
 * 如果命题为
 *
 * @param x 命题
 * @param from 被替换的变量
 * @param to 结果项
 * @param times 替换次数: -x表示从右到左,0表示全部替换
 * @param varEnv 全称量词 存在量词的环境
 **/
export function replaceVariable(
	x: Proposition,
	from: LetterTermAST | AnyTermAST,
	to: Term,
	times: number,
	varEnv: (LetterTermAST | AnyTermAST)[] = [],
) {
	const newProposition = x.clone();
	// 变量列表
	// newProposition.variables
}
