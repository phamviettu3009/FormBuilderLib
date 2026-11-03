import type { Rule } from "../../../core/validator/rule.ts";
import { Plugin } from "../../../core/plugin-metadata.ts";
import { getArrayLimit, isEmptyArrayValue } from "./array-rule-utils.ts";

@Plugin("arrayLength")
export class ArrayLengthRule implements Rule {
  validate(value: unknown, ruleValue?: unknown): boolean {
    if (isEmptyArrayValue(value)) {
      return true;
    }
    if (!Array.isArray(value)) {
      return false;
    }
    return value.length === getArrayLimit(ruleValue, "arrayLength");
  }
}
