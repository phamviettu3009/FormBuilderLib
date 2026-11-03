import type { Rule } from "../../../core/validator/rule.ts";
import { Plugin } from "../../../core/plugin-metadata.ts";

@Plugin("notOneOf")
export class NotOneOfRule implements Rule {
  validate(value: unknown, ruleValue?: unknown): boolean {
    return !Array.isArray(ruleValue) || !ruleValue.includes(value);
  }
}
