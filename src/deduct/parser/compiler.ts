import type { IToken, TokenType } from 'chevrotain';
import { FormalSystemRule } from '../formalsystem/fsRule';
import PropositionLexer, {
	AnyProposition,
	Comma,
	Conjunction,
	Disjunction,
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
	ConjunctionPropositionAST,
	DisjunctionPropositionAST,
	IffPropositionAST,
	ImplicationPropositionAST,
	LetterPropositionAST,
	NotPropositionAST,
	Proposition,
} from './ast';
import type { getPriority } from 'node:os';

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
	/**
	 * Any parse,must stop, the 1st token after this proposition,
	 */
	parseProposition(priority = PropositionParser.priorities.LOWEST): Proposition {
		const cur = this.curToken();

		let left: Proposition = new Proposition();

		if (cur.tokenType === Not) {
			this.nextToken();
			left = new NotPropositionAST(this.parseProposition(PropositionParser.priorities.NOT));
		} else if (cur.tokenType === AnyProposition) {
			let token = this.consumeCurrent(AnyProposition);

			left = new AnyPropositionAST(token.image.slice(1));
		} else if (cur.tokenType === LParen) {
			this.nextToken();
			left = this.parseProposition(PropositionParser.priorities.LOWEST);
			this.consumeCurrent(RParen);
		} else if (cur.tokenType === LetterProposition) {
			let token = this.consumeCurrent(LetterProposition);

			left = new LetterPropositionAST(token.image);
		} else {
			throw new Error(`Unknown Proposition: ${cur.tokenType.name}`);
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
