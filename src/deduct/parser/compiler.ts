import type { IToken, TokenType } from 'chevrotain';
import { FormalSystemRule } from '../formalsystem/fsRule';
import PropositionLexer, {
	AnyProposition,
	BelongTo,
	Colon,
	Comma,
	Conjunction,
	Disjunction,
	Equals,
	Exists,
	Forall,
	LeftRightarrow,
	LetterProposition,
	LParen,
	Not,
	Rightarrow,
	RParen,
	VDash,
} from './lexer';
import {
	AnyPropositionAST,
	AnyTermAST,
	ConjunctionPropositionAST,
	DisjunctionPropositionAST,
	ExistsPropositionAST,
	ForallPropositionAST,
	IffPropositionAST,
	ImplicationPropositionAST,
	LetterPropositionAST,
	LetterTermAST,
	NotPropositionAST,
	Proposition,
	Term,
	TermBelongToAST,
	TermEqualsAST,
} from './ast';

export class PropositionParser {
	tokens: IToken[];
	pos: number = 0;
	constructor(x: IToken[]) {
		this.tokens = x;
	}
	curToken() {
		if (this.pos >= this.tokens.length) throw new Error('Index out of range');
		return this.tokens[this.pos];
	}
	static priorities = {
		NOT: 2,
		IMPL: 3,
		CONJ: 4,
		DISJ: 5,
		IFF: 6,
		LOWEST: 7,
	};
	parseVariable(priority = PropositionParser.priorities.LOWEST): Term {
		const cur = this.curToken();
		if (cur.tokenType === LetterProposition) {
			this.consumeCurrent(cur.tokenType);
			return new LetterTermAST(cur.image);
		} else if (cur.tokenType === AnyProposition) {
			this.consumeCurrent(cur.tokenType);
			return new AnyTermAST(cur.image.slice(1));
		} else {
			throw new Error(`Unknown Variable Token: ${cur.tokenType.name}`);
		}
	}
	/**
	 * Any parse,must stop, the 1st token after this proposition,
	 */
	parseProposition(priority = PropositionParser.priorities.LOWEST): Proposition {
		const cur = this.curToken();

		let left: Proposition = new Proposition();

		if (cur.tokenType === Not) {
			this.nextToken();
			left = new NotPropositionAST(this.parseProposition(PropositionParser.priorities.NOT));
		} else if (cur.tokenType === LParen) {
			this.nextToken();
			left = this.parseProposition(PropositionParser.priorities.LOWEST);
			this.consumeCurrent(RParen);
		} else if (cur.tokenType === AnyProposition || cur.tokenType === LetterProposition) {
			let token = cur;
			let left_temp: Proposition;
			if (cur.tokenType === AnyProposition) {
				left_temp = new AnyPropositionAST(token.image.slice(1));
			} else {
				left_temp = new LetterPropositionAST(token.image);
			}
			// 下一个token有没有符号 等于， 属于？
			let nexttoken = this.getNextToken();

			// 判断下一个token是否存在
			if (nexttoken && (nexttoken.tokenType === Equals || nexttoken.tokenType == BelongTo)) {
				// 直接从parseVariable解析变量
				let left_temp2 = this.parseVariable();
				this.nextToken();
				let right = this.parseVariable();
				if (nexttoken.tokenType === Equals) {
					left = new TermEqualsAST(left_temp2, right);
				} else {
					left = new TermBelongToAST(left_temp2, right);
				}
			} else {
				left = left_temp;
				this.nextToken();
			}
		} else if (cur.tokenType === Forall) {
			// 结构∀x:y
			this.consumeCurrent(Forall);
			let variable = this.parseVariable();

			this.consumeCurrent(Colon);

			let expression = this.parseProposition(PropositionParser.priorities.NOT);
			left = new ForallPropositionAST(variable, expression);
		} else if (cur.tokenType === Exists) {
			// 结构∃x:y
			this.consumeCurrent(Exists);
			let variable = this.parseVariable();

			this.consumeCurrent(Colon);

			let expression = this.parseProposition(PropositionParser.priorities.NOT);
			left = new ExistsPropositionAST(variable, expression);
		} else {
			throw new Error(`Unknown Proposition Token: ${cur.tokenType.name}`);
		}

		let thisToken = this.tokens[this.pos];

		if (thisToken) {
			const infix = PropositionParser.infixTokens[thisToken.tokenType.name];
			let priority2 = this.getPriority(thisToken.tokenType);
			if (priority2 <= priority)
				if (infix) {
					this.nextToken();
					let right = this.parseProposition(this.getPriority(thisToken.tokenType));
					return new infix(left, right);
				} else {
					return left;
				}
			else {
				return left;
			}
			// else {
			// 	throw new Error(`Unsupported: ${thisToken.tokenType.name}`);
			// }
		} else {
			return left;
		}
	}
	getPriority(x: TokenType) {
		switch (x) {
			case Rightarrow:
				return PropositionParser.priorities.IMPL;
			case LeftRightarrow:
				return PropositionParser.priorities.IFF;
			case Disjunction:
				return PropositionParser.priorities.DISJ;
			case Conjunction:
				return PropositionParser.priorities.CONJ;
		}
		return PropositionParser.priorities.LOWEST;
	}
	static infixTokens = {
		[Rightarrow.name]: ImplicationPropositionAST,
		[LeftRightarrow.name]: IffPropositionAST,
		[Disjunction.name]: DisjunctionPropositionAST,
		[Conjunction.name]: ConjunctionPropositionAST,
	};

	parseRule(): FormalSystemRule {
		const conditions: Proposition[] = [];
		while (this.curToken().tokenType !== VDash) {
			conditions.push(this.parseProposition());
			// console.log(conditions);
			if (this.curToken().tokenType === VDash) break;
			else this.consumeCurrent(Comma);
		}
		this.consumeCurrent(VDash);
		const result: Proposition = this.parseProposition();
		return new FormalSystemRule(conditions, result);
	}

	/**
	 *
	 * @returns Token before next
	 */
	nextToken() {
		return this.tokens[this.pos++];
	}

	getNextToken() {
		return this.tokens[this.pos + 1];
	}

	consumeCurrent(tokenType: TokenType) {
		let tok = this.nextToken();
		if (this.tokens[this.pos - 1].tokenType !== tokenType)
			throw new Error(
				`Expected ${tokenType.name}, actual ${this.tokens[this.pos - 1].tokenType.name}`,
			);
		return tok;
	}
}

export function parseAndConvertToAst(code: string, isRule = false): any {
	const lexResult = PropositionLexer.tokenize(code);
	if (lexResult.errors.length > 0) {
		throw `Lexing Error: ${lexResult.errors.map((e) => e.message).join(', ')}, string ${code}`;
	}
	// console.log(lexResult);
	// throw new Error('');
	const parser = new PropositionParser(lexResult.tokens);

	return isRule ? parser.parseRule() : parser.parseProposition();
	// const parser = new PropositionParser();
	// parser.input = lexResult.tokens;
	// const cst = isRule ? parser.fsRule() : parser.proposition();
	// if (parser.errors.length > 0) {
	// 	throw '语法解析出错：' + parser.errors.map((e) => e.message).join(', ');
	// }
	// const visitor = new CstToAstVisitor();
	// return visitor.visit(cst);
}

export function toProposition(code: string): Proposition {
	return parseAndConvertToAst(code);
}
export function toRule(code: string): FormalSystemRule {
	// console.log('Parsing ' + code);
	return parseAndConvertToAst(code, true);
}
