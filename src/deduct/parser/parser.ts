import { CstParser } from 'chevrotain';
import {
	allTokens,
	AnyProposition,
	Colon,
	Comma,
	Conjunction,
	Disjunction,
	Exists,
	Forall,
	LeftRightarrow,
	LetterProposition,
	LParen,
	Not,
	Rightarrow,
	RParen,
	VDash,
} from './lexer';

export class PropositionParser extends CstParser {
	constructor() {
		super(allTokens);

		this.performSelfAnalysis();
	}

	public fsRule = this.RULE('fsRule', () => {
		this.OPTION(() => {
			this.SUBRULE(this.proposition); // 第一个 proposition
			this.MANY(() => {
				// 后续可选的 ", proposition"
				this.CONSUME(Comma);
				this.SUBRULE2(this.proposition); // 注意使用 SUBRULE2 或 SUBRULE 均可
			});
		});
		this.CONSUME(VDash);
		this.SUBRULE3(this.proposition);
	});

	// 完整命题 = 当且仅当命题
	public proposition = this.RULE('proposition', () => {
		this.SUBRULE(this.iffProposition);
	});

	// 当且仅当命题（右结合）
	public iffProposition = this.RULE('iffProposition', () => {
		this.SUBRULE(this.implicationProposition); // 左侧：蕴含命题
		this.OPTION(() => {
			// 可选右侧递归
			this.CONSUME(LeftRightarrow);
			this.SUBRULE2(this.iffProposition); // 右侧递归实现右结合
		});
	});

	// 蕴含命题（右结合）
	public implicationProposition = this.RULE('implicationProposition', () => {
		this.SUBRULE(this.disjunctionProposition); // 左侧：析取命题
		this.OPTION(() => {
			// 可选右侧递归
			this.CONSUME(Rightarrow);
			this.SUBRULE2(this.implicationProposition); // 右侧递归实现右结合
		});
	});

	public disjunctionProposition = this.RULE('disjunctionProposition', () => {
		this.SUBRULE(this.conjunctionProposition); // 左侧：合取命题
		this.OPTION(() => {
			// 可选右侧递归
			this.CONSUME(Disjunction);
			this.SUBRULE2(this.disjunctionProposition);
		});
	});

	public conjunctionProposition = this.RULE('conjunctionProposition', () => {
		this.SUBRULE(this.notProposition); // 左侧：否定命题
		this.OPTION(() => {
			// 可选右侧递归
			this.CONSUME(Conjunction);
			this.SUBRULE2(this.conjunctionProposition);
		});
	});

	public notProposition = this.RULE('notProposition', () => {
		this.OPTION(() => {
			this.MANY(() => {
				this.CONSUME(Not);
			});
		});
		this.SUBRULE(this.baseProposition);
	});

	// 基础命题：原子或括号
	public baseProposition = this.RULE('baseProposition', () => {
		this.OR([
			{ ALT: () => this.SUBRULE(this.letterProposition) },
			{ ALT: () => this.SUBRULE(this.anyProposition) },
			{
				ALT: () => this.SUBRULE(this.forAllProposition),
			},
			{
				ALT: () => this.SUBRULE(this.existsProposition),
			},
			{
				ALT: () => {
					this.CONSUME(LParen);
					this.SUBRULE(this.proposition); // 括号内允许完整命题
					this.CONSUME(RParen);
				},
			},
		]);
	});

	public letterProposition = this.RULE('letterProposition', () => {
		this.CONSUME(LetterProposition);
	});
	public anyProposition = this.RULE('anyProposition', () => {
		this.CONSUME(AnyProposition);
	});

	public forAllProposition = this.RULE('forAllProposition', () => {
		this.CONSUME(Forall);
		this.SUBRULE(this.variableOnly);
		this.CONSUME(Colon);
		this.SUBRULE(this.proposition);
	});
	public existsProposition = this.RULE('existsProposition', () => {
		this.CONSUME(Exists);
		this.SUBRULE(this.variableOnly);
		this.CONSUME(Colon);
		this.SUBRULE(this.proposition);
	});

	public term = this.RULE('term', () => {
		this.OR([
			{
				ALT: () => {
					this.SUBRULE(this.variableOnly);
				},
			},
		]);
	});
	public variableOnly = this.RULE('variableOnly', () => {
		this.OR([
			{
				ALT: () => {
					this.SUBRULE(this.letterVariable);
				},
			},
			{
				ALT: () => {
					this.SUBRULE(this.anyVariable);
				},
			},
		]);
	});
	public letterVariable = this.RULE('letterVariable', () => {
		this.CONSUME(LetterProposition);
	});
	public anyVariable = this.RULE('anyVariable', () => {
		this.CONSUME(AnyProposition);
	});
}

const parser = new PropositionParser();

export default parser;
