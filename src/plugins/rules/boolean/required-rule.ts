import type { Rule } from "../../../core/validator/rule.ts";
import { Plugin } from "../../../core/plugin-metadata.ts";

@Plugin("booleanRequired")
export class BooleanRequiredRule implements Rule {
  validate(value: unknown): boolean {
    return value !== undefined && value !== null;
  }
}
