import type { Rule } from "../../../core/validator/rule.ts";
import { Plugin } from "../../../core/plugin-metadata.ts";
import {
  getNumericLimit,
  isEmptyValue,
  toFiniteNumber,
} from "./number-rule-utils.ts";

@Plugin("moreThan")
export class MoreThanRule implements Rule {
  validate(value: unknown, ruleValue?: unknown): boolean {
    if (isEmptyValue(value)) {
      return true;
    }
    const minimum = getNumericLimit(ruleValue, "moreThan");
    const numericValue = toFiniteNumber(value);
    return numericValue !== undefined && numericValue > minimum;
  }
}
