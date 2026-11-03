import type { Rule } from "../../../core/validator/rule.ts";
import { Plugin } from "../../../core/plugin-metadata.ts";
import { getDateLimit, isEmptyDate, toDate } from "./date-rule-utils.ts";

@Plugin("dateMin")
export class DateMinRule implements Rule {
  validate(value: unknown, ruleValue?: unknown): boolean {
    if (isEmptyDate(value)) {
      return true;
    }
    const minimum = getDateLimit(ruleValue, "dateMin");
    const date = toDate(value);
    return date !== undefined && date.getTime() >= minimum.getTime();
  }
}
