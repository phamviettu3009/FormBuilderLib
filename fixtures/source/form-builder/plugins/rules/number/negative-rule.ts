import type { Rule } from "../../../core/validator/rule.ts";
import { Plugin } from "../../../core/plugin-metadata.ts";
import { isEmptyValue, toFiniteNumber } from "./number-rule-utils.ts";

@Plugin("negative")
export class NegativeRule implements Rule {
  validate(value: unknown): boolean {
    if (isEmptyValue(value)) {
      return true;
    }
    const numericValue = toFiniteNumber(value);
    return numericValue !== undefined && numericValue < 0;
  }
}
