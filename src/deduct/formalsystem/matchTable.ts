import type { Proposition } from '../parser/ast';

export type MatchTable = {
	[key: string]: Proposition;
};

export type MatchStrTable = {
	[key: string]: string;
};
