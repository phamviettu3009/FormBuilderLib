import type { Rule } from "../../../core/validator/rule.ts";
import { Plugin } from "../../../core/plugin-metadata.ts";

type SyncTest = (value: unknown, values: Record<string, unknown>) => boolean;

@Plugin("test")
export class TestRule implements Rule {
  validate(
    value: unknown,
    ruleValue?: unknown,
    values: Record<string, unknown> = {},
  ): boolean {
    const test =
      typeof ruleValue === "function"
        ? ruleValue
        : isRecord(ruleValue) && typeof ruleValue.test === "function"
          ? ruleValue.test
          : undefined;

    if (!test) {
      return false;
    }

    const result = (test as SyncTest)(value, values);
    return typeof result === "boolean" && result;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}