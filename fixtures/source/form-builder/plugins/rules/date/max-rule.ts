import type { Rule } from "../../../core/validator/rule.ts";
import { Plugin } from "../../../core/plugin-metadata.ts";
import { getDateLimit, isEmptyDate, toDate } from "./date-rule-utils.ts";

@Plugin("dateMax")
export class DateMaxRule implements Rule {
  validate(value: unknown, ruleValue?: unknown): boolean {
    if (isEmptyDate(value)) {
      return true;
    }
    const maximum = getDateLimit(ruleValue, "dateMax");
    const date = toDate(value);
    return date !== undefined && date.getTime() <= maximum.getTime();
  }
}
