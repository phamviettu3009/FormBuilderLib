import type { Rule } from "../../../core/validator/rule.ts";
import { Plugin } from "../../../core/plugin-metadata.ts";
import { isEmptyValue } from "./string-rule-utils.ts";

const DATETIME_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(Z|[+-]\d{2}:\d{2})$/i;

@Plugin("datetime")
export class DateTimeRule implements Rule {
  validate(value: unknown): boolean {
    if (isEmptyValue(value)) {
      return true;
    }
    if (typeof value !== "string") {
      return false;
    }

    const match = DATETIME_PATTERN.exec(value);
    if (!match || !Number.isFinite(Date.parse(value))) {
      return false;
    }

    const [
      ,
      yearText,
      monthText,
      dayText,
      hourText,
      minuteText,
      secondText,
      zone,
    ] = match;
    const year = Number(yearText);
    const month = Number(monthText);
    const day = Number(dayText);
    const hour = Number(hourText);
    const minute = Number(minuteText);
    const second = Number(secondText);
    const calendarDate = new Date(0);
    calendarDate.setUTCFullYear(year, month - 1, day);

    if (
      calendarDate.getUTCFullYear() !== year ||
      calendarDate.getUTCMonth() !== month - 1 ||
      calendarDate.getUTCDate() !== day ||
      hour > 23 ||
      minute > 59 ||
      second > 59
    ) {
      return false;
    }

    if (zone.toUpperCase() !== "Z") {
      const [, offsetHour, offsetMinute] =
        /[+-](\d{2}):(\d{2})/.exec(zone) ?? [];
      return Number(offsetHour) <= 23 && Number(offsetMinute) <= 59;
    }
    return true;
  }
}
