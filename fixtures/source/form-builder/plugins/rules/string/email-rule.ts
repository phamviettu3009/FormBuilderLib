import type { Rule } from "../../../core/validator/rule.ts";
import { Plugin } from "../../../core/plugin-metadata.ts";

@Plugin("email")
export class EmailRule implements Rule {
  validate(value: unknown): boolean {
    if (typeof value !== "string" || value.length === 0) {
      return true;
    }
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }
}
