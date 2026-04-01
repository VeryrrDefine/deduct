import { CstParser } from 'chevrotain';
import {
	allTokens,
	AnyProposition,
	LeftRightarrow,
	LetterProposition,
	LParen,
	Not,
	Rightarrow,
	RParen,
} from './lexer';

export class PropositionParser extends CstParser {
	constructor() {
		super(allTokens);

		this.performSelfAnalysis();
	}

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
		this.SUBRULE(this.notProposition); // 左侧：基础命题
		this.OPTION(() => {
			// 可选右侧递归
			this.CONSUME(Rightarrow);
			this.SUBRULE2(this.implicationProposition); // 右侧递归实现右结合
		});
	});

	public notProposition = this.RULE('notProposition', () => {
		this.OPTION(() => {
			this.CONSUME(Not);
		});
		this.SUBRULE(this.baseProposition);
	});

	// 基础命题：原子或括号
	public baseProposition = this.RULE('baseProposition', () => {
		this.OR([
			{ ALT: () => this.SUBRULE(this.letterProposition) },
			{ ALT: () => this.SUBRULE(this.anyProposition) },
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
}

const parser = new PropositionParser();

export default parser;
