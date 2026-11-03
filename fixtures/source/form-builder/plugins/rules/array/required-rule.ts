import type { Rule } from "../../../core/validator/rule.ts";
import { Plugin } from "../../../core/plugin-metadata.ts";

@Plugin("arrayRequired")
export class ArrayRequiredRule implements Rule {
  validate(value: unknown): boolean {
    return Array.isArray(value);
  }
}
