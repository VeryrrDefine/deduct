import { FormalSystem } from '../src/deduct/formalsystem';
import { parseAndConvertToAst } from '../src/deduct/parser/compiler';
import deduct from '../src/index';

// describe("init", function () {
// it("2", function () {
// const lexer = deduct.parser.PropositionLexer;
// const lexresult = lexer.tokenize('$0>$1>t<>t');
// console.log(lexresult);

// const ast = parseAndConvertToAst('($0>$1>t<>t<>$4)');
// console.log(ast);
// console.log(ast.toString());

const ast2 = parseAndConvertToAst('$0>$1');

const ast3 = parseAndConvertToAst('$0');
const ast4 = parseAndConvertToAst('$2');
const ast5 = parseAndConvertToAst('~$2>$3>$4');
const astpierce = parseAndConvertToAst('(($0>$1)>$0)>$0');
console.log(ast5);
console.log(astpierce);
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
