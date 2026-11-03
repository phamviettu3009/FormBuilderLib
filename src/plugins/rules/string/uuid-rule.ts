import type { Rule } from "../../../core/validator/rule.ts";
import { Plugin } from "../../../core/plugin-metadata.ts";
import { isEmptyValue } from "./string-rule-utils.ts";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Plugin("uuid")
export class UuidRule implements Rule {
  validate(value: unknown): boolean {
    if (isEmptyValue(value)) {
      return true;
    }
    return typeof value === "string" && UUID_PATTERN.test(value);
  }
}
