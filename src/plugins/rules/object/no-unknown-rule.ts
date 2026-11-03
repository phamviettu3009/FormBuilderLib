import type { Rule } from "../../../core/validator/rule.ts";
import { Plugin } from "../../../core/plugin-metadata.ts";
import { isRecord } from "./object-rule-utils.ts";

@Plugin("noUnknown")
export class NoUnknownRule implements Rule {
  validate(value: unknown, ruleValue?: unknown): boolean {
    if (value === undefined || value === null) {
      return true;
    }
    if (!isRecord(value)) {
      return false;
    }

    const knownKeys = Array.isArray(ruleValue)
      ? ruleValue.filter((key): key is string => typeof key === "string")
      : isRecord(ruleValue)
        ? Object.keys(ruleValue)
        : undefined;
    return (
      knownKeys !== undefined &&
      Object.keys(value).every((key) => knownKeys.includes(key))
    );
  }
}
