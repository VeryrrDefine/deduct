import { FormalSystemRule } from '../formalsystem/fsRule';
import {
	AnyPropositionAST,
	ConjunctionPropositionAST,
	DisjunctionPropositionAST,
	IffPropositionAST,
	ImplicationPropositionAST,
	LetterPropositionAST,
	NotPropositionAST,
} from './ast';
import PropositionLexer from './lexer';
import { PropositionParser } from './parser';

const parserInstance = new PropositionParser();

class CstToAstVisitor extends parserInstance.getBaseCstVisitorConstructor() {
	constructor() {
		super();
		this.validateVisitor();
	}

	fsRule(ctx: any) {
		const t = this;
		let last = this.visit(ctx.proposition[ctx.proposition.length - 1]);
		let conditions = ctx.proposition.slice(0, -1);
		for (let i = 0; i < conditions.length; i++) {
			conditions[i] = this.visit(conditions[i]);
		}
		return new FormalSystemRule(conditions, last);
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
			return this.visit(ctx.disjunctionProposition);
		}
		return new ImplicationPropositionAST(
			this.visit(ctx.disjunctionProposition),
			this.visit(ctx.implicationProposition),
		);
	}

	disjunctionProposition(ctx: any): any {
		if (!ctx.disjunctionProposition) {
			return this.visit(ctx.conjunctionProposition);
		}
		return new DisjunctionPropositionAST(
			this.visit(ctx.conjunctionProposition),
			this.visit(ctx.disjunctionProposition),
		);
	}

	conjunctionProposition(ctx: any): any {
		if (!ctx.conjunctionProposition) {
			return this.visit(ctx.notProposition);
		}
		return new ConjunctionPropositionAST(
			this.visit(ctx.notProposition),
			this.visit(ctx.conjunctionProposition),
		);
	}

	notProposition(ctx: any): any {
		if (ctx.Not) {
			let goal = this.visit(ctx.baseProposition);
			for (let i = 0; i < ctx.Not.length; i++) {
				goal = new NotPropositionAST(goal);
			}
			return goal;
		}
		return this.visit(ctx.baseProposition);
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
		return new AnyPropositionAST(ctx.AnyProposition[0].image.slice(1));
	}
}

export function parseAndConvertToAst(code: string, isRule = false) {
	const lexResult = PropositionLexer.tokenize(code);

	if (lexResult.errors.length > 0) {
		throw '词法分析出错：' + lexResult.errors.map((e) => e.message).join(', ');
	}

	const parser = new PropositionParser();
	parser.input = lexResult.tokens;
	const cst = isRule ? parser.fsRule() : parser.proposition();

	if (parser.errors.length > 0) {
		throw '语法解析出错：' + parser.errors.map((e) => e.message).join(', ');
	}

	const visitor = new CstToAstVisitor();
	return visitor.visit(cst);
}
