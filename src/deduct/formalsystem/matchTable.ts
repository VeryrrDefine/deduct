import type { Proposition } from '../parser/ast';
import { toProposition } from '../parser/compiler';

export type MatchTable = {
	[key: string]: Proposition;
};

export type MatchStrTable = {
	[key: string]: string;
};

export function matchTableToStrTable(z: MatchTable) {
	return Object.fromEntries(Object.entries(z).map((x) => [x[0], x.toString()]));
}

export function matchStrTableToTable(z: MatchStrTable) {
	return Object.fromEntries(Object.entries(z).map((x) => [x[0], toProposition(x[1])]));
}
