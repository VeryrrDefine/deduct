import { createToken, Lexer } from 'chevrotain';
export const AnyProposition = createToken({
	name: 'AnyProposition',
	pattern: /\$[a-zA-Z0-9_]*/,
});

export const LetterProposition = createToken({
	name: 'LetterProposition',
	pattern: /[a-zA-Z_][a-zA-Z0-9_]*/,
});

export const LeftRightarrow = createToken({
	name: 'LeftRightarrow',
	pattern: /<>|↔/,
});
export const Rightarrow = createToken({
	name: 'Rightarrow',
	pattern: />|→/,
});

export const LParen = createToken({ name: 'LParen', pattern: /\(/ });
export const RParen = createToken({ name: 'RParen', pattern: /\)/ });

const Whitespace = createToken({
	name: 'Whitespace',
	pattern: /\s+/,
	// This is normally computed automatically...
	line_breaks: true,
});

export const allTokens = [
	AnyProposition,
	LetterProposition,
	LeftRightarrow,
	Rightarrow,
	LParen,
	RParen,
	Whitespace,
];

export const PropositionLexer = new Lexer(allTokens);

export default PropositionLexer;
