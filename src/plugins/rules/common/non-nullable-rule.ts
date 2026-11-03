import type { Rule } from "../../../core/validator/rule.ts";
import { Plugin } from "../../../core/plugin-metadata.ts";

@Plugin("nonNullable")
export class NonNullableRule implements Rule {
  validate(value: unknown): boolean {
    return value !== null;
  }
}
