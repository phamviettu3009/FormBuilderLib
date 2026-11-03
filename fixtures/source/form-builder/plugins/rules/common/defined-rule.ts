import type { Rule } from "../../../core/validator/rule.ts";
import { Plugin } from "../../../core/plugin-metadata.ts";

@Plugin("defined")
export class DefinedRule implements Rule {
  validate(value: unknown): boolean {
    return value !== undefined;
  }
}
