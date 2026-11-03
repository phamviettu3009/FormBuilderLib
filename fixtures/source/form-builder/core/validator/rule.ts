export type ValidateRule = (ruleName: string) => boolean;

export interface Rule {
  validate(
    value: unknown,
    ruleValue?: unknown,
    values?: Record<string, unknown>,
    validateRule?: ValidateRule,
  ): boolean;
}
