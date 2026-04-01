import {
	AnyPropositionAST,
	IffPropositionAST,
	ImplicationPropositionAST,
	LetterPropositionAST,
} from './ast';
import PropositionLexer from './lexer';
import { PropositionParser } from './parser';

const parserInstance = new PropositionParser();

class CstToAstVisitor extends parserInstance.getBaseCstVisitorConstructor() {
	constructor() {
		super();
		this.validateVisitor();
	}

	proposition(ctx: any) {
		return this.visit(ctx.iffProposition);
	}
	iffProposition(ctx: any): any {
		if (!ctx.iffProposition) {
			return this.visit(ctx.implicationProposition);
		}
		return new IffPropositionAST(
			this.visit(ctx.implicationProposition),
			this.visit(ctx.iffProposition),
		);
	}
	implicationProposition(ctx: any): any {
		if (!ctx.implicationProposition) {
			return this.visit(ctx.baseProposition);
		}
		return new ImplicationPropositionAST(
			this.visit(ctx.baseProposition),
			this.visit(ctx.implicationProposition),
		);
	}

	baseProposition(ctx: any): any {
		if (ctx.letterProposition) {
			return this.visit(ctx.letterProposition);
		}

		if (ctx.anyProposition) {
			return this.visit(ctx.anyProposition);
		}

		return this.visit(ctx.proposition);
	}

	letterProposition(ctx: any): any {
		return new LetterPropositionAST(ctx.LetterProposition[0].image);
	}
	anyProposition(ctx: any): any {
		return new AnyPropositionAST(ctx.AnyProposition[0].image);
	}
}

export function parseAndConvertToAst(code: string) {
	const lexResult = PropositionLexer.tokenize(code);

	if (lexResult.errors.length > 0) {
		throw '词法分析出错：' + lexResult.errors.map((e) => e.message).join(', ');
	}

	const parser = new PropositionParser();
	parser.input = lexResult.tokens;
	const cst = parser.iffProposition();

	if (parser.errors.length > 0) {
		throw '语法解析出错：' + parser.errors.map((e) => e.message).join(', ');
	}

	const visitor = new CstToAstVisitor();
	return visitor.visit(cst);
}
