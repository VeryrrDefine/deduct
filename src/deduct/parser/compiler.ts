import { FormalSystemRule } from '../formalsystem/fsRule';

export function parseAndConvertToAst(code: string, isRule = false) {
	// const lexResult = PropositionLexer.tokenize(code);
	// if (lexResult.errors.length > 0) {
	// 	throw `Lexing Error: ${lexResult.errors.map((e) => e.message).join(', ')}, string ${code}`;
	// }
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
	// return parseAndConvertToAst(code);
}
export function toRule(code: string): FormalSystemRule {
	// return parseAndConvertToAst(code, true);
}
