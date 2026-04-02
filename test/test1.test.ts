// import { FormalSystem } from '../src/deduct/formalsystem';
// import { RULES } from '../src/deduct/formalsystem/rules';
// import { ImplicationPropositionAST, LetterPropositionAST } from '../src/deduct/parser/ast';
// import { parseAndConvertToAst } from '../src/deduct/parser/compiler';
// import deduct from '../src/index';

import { replMain } from '../src/repl';

replMain();

// describe("init", function () {
// it("2", function () {
// const lexer = deduct.parser.PropositionLexer;
// const lexresult = lexer.tokenize('$0>$1>t<>t');
// console.log(lexresult);

// const ast = parseAndConvertToAst('($0>$1>t<>t<>$4)');
// console.log(ast);
// console.log(ast.toString());

// const ast2 = parseAndConvertToAst('$0>$1');

// const ast3 = parseAndConvertToAst('$0');
// const ast4 = parseAndConvertToAst('$2');
// const ast5 = parseAndConvertToAst('~$2>$3>$4');
// const astpierce = parseAndConvertToAst('(($0>$1)>$0)>$0');
// console.log(ast5);
// console.log(astpierce);
// const asttest = parseAndConvertToAst('|- $0>($1>$0)', true);
// const asttest2 = parseAndConvertToAst('$0 |- ($1>$0)', true);
// console.log(asttest, asttest2);
// console.log(RULES.a1.toString());
// const applied = RULES.a1.applyRule();
// console.log(applied.toString());
// const result = applied.applyResult({
// 	$0: new LetterPropositionAST('a'),
// 	$1: new LetterPropositionAST('a'),
// });
// console.log(result.toString());
// console.log();
// console.log();
// console.log();
// console.log(RULES.a2.toString());
// const applied2 = RULES.a2.applyRule();
// console.log(applied2.toString());
// const result2 = applied2.applyResult({
// 	$0: new LetterPropositionAST('a'),
// 	$1: new LetterPropositionAST('a'),
// 	$2: new LetterPropositionAST('a'),
// });
// console.log(result2.toString());
// console.log();
// console.log();
// console.log();
// console.log(RULES.mp.toString());
// const applied3 = RULES.mp.applyRule(
// 	new ImplicationPropositionAST(new LetterPropositionAST('a'), new LetterPropositionAST('b')),
// 	new LetterPropositionAST('a'),
// );
// console.log(applied3.toString());
// const result3 = applied3.applyResult({});
// console.log(result3.toString());

// const matchmap = {};
// const trytomatch = FormalSystem.match(ast3, ast2, matchmap);
// console.log(trytomatch, matchmap);

// console.log('Match modus ponens');
// const mpMatch = FormalSystem.ruleModusPonens(ast2, ast3);
// console.log('modus ponens match result:', mpMatch);

// const match2 = FormalSystem.ruleDotI(ast2);
// console.log(match2.toString());
// const mpMatch2 = FormalSystem.ruleModusPonens(ast2, ast3);
// console.log('modus ponens match result:', mpMatch2);
// const trytomatch2 = FormalSystem.match(ast3, ast4, matchmap);
// console.log(trytomatch2, matchmap);
// const parser = deduct.parser.PropositionParser;
// const parser2 = new parser();
// parser2
// expect(3).toBeGreaterThan(2);
// const parser = new deduct.parser.PropositionParser();
// });
// });
