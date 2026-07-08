import type { Proposition, Term } from '../parser/ast';
import { parseToTerm as parseToTerm, toProposition } from '../parser/compiler';

export type MatchTable = {
	[key: string]: Proposition;
};

export type MatchStrTable = {
	[key: string]: string;
};

export type MatchVarTable = {
	[key: string]: Term;
};


export function matchTableToStrTable(z: MatchTable) {
	return Object.fromEntries(Object.entries(z).map((x) => [x[0], x.toString()]));
}

export function matchStrTableToTable(z: MatchStrTable) {
	return Object.fromEntries(Object.entries(z).map((x) => [x[0], toProposition(x[1])]));
}

export function matchStrTableToVarTable(z: MatchStrTable) {
	return Object.fromEntries(Object.entries(z).map((x) => [x[0], parseToTerm(x[1])]));
}
