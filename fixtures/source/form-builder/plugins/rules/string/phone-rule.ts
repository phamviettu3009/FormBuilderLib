import type { Rule } from "../../../core/validator/rule.ts";
import { Plugin } from "../../../core/plugin-metadata.ts";

@Plugin("phone")
export class PhoneRule implements Rule {
  validate(value: unknown): boolean {
    if (typeof value !== "string" || value.trim().length === 0) {
      return true;
    }
    const normalizedValue = value.replace(/[\s().-]/g, "");
    return /^(?:0|\+?84)[35789]\d{8}$/.test(normalizedValue);
  }
}
