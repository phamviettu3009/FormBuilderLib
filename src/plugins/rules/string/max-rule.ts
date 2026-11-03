import type { Rule } from "../../../core/validator/rule.ts";
import { Plugin } from "../../../core/plugin-metadata.ts";
import { getLengthLimit, isEmptyValue } from "./string-rule-utils.ts";

@Plugin("stringMax")
export class StringMaxRule implements Rule {
  validate(value: unknown, ruleValue?: unknown): boolean {
    if (isEmptyValue(value)) {
      return true;
    }
    if (typeof value !== "string") {
      return false;
    }
    return value.length <= getLengthLimit(ruleValue, "stringMax");
  }
}
