import type { Rule } from "../../../core/validator/rule.ts";
import { Plugin } from "../../../core/plugin-metadata.ts";
import { isEmptyValue } from "./string-rule-utils.ts";

@Plugin("matches")
export class MatchesRule implements Rule {
  validate(value: unknown, ruleValue?: unknown): boolean {
    if (isEmptyValue(value)) {
      return true;
    }
    if (typeof value !== "string") {
      return false;
    }

    let pattern: RegExp;
    try {
      pattern =
        ruleValue instanceof RegExp ? ruleValue : new RegExp(String(ruleValue));
    } catch {
      return false;
    }

    pattern.lastIndex = 0;
    return pattern.test(value);
  }
}
