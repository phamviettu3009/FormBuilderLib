import type { Rule } from "../../../core/validator/rule.ts";
import { Plugin } from "../../../core/plugin-metadata.ts";

@Plugin("date")
export class DateRule implements Rule {
  validate(value: unknown): boolean {
    if (value === undefined || value === null || value === "") {
      return true;
    }
    if (value instanceof Date) {
      return Number.isFinite(value.getTime());
    }
    if (typeof value === "string") {
      return value.trim().length > 0 && Number.isFinite(Date.parse(value));
    }
    if (typeof value === "object" && "isValid" in value) {
      const isValid = value.isValid;
      return typeof isValid === "function" && isValid.call(value);
    }
    return false;
  }
}
