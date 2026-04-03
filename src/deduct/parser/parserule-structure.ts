export class RuleParser {
	ruleString: string;
	metaRules: string;
	originalRule: string;
	constructor(ruleString: string) {
		this.ruleString = ruleString;
		this.metaRules = '';
		this.originalRule = '';
		for (let i = 0; i < ruleString.length; i++) {
			if (ruleString[i].match(/c/)) {
				this.metaRules += ruleString[i];
			} else {
				this.originalRule = this.ruleString.slice(i);
				break;
			}
		}
	}
}
