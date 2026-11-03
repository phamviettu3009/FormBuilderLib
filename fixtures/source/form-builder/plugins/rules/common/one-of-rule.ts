import type { Rule } from "../../../core/validator/rule.ts";
import { Plugin } from "../../../core/plugin-metadata.ts";

@Plugin("oneOf")
export class OneOfRule implements Rule {
  validate(value: unknown, ruleValue?: unknown): boolean {
    if (value === undefined) {
      return true;
    }
    return Array.isArray(ruleValue) && ruleValue.includes(value);
  }
}
