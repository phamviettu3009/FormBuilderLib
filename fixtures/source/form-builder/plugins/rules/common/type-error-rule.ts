import type { Rule } from "../../../core/validator/rule.ts";
import { Plugin } from "../../../core/plugin-metadata.ts";

type SupportedType =
  "string" | "number" | "boolean" | "integer" | "array" | "object" | "date";

@Plugin("typeError")
export class TypeErrorRule implements Rule {
  validate(value: unknown, ruleValue?: unknown): boolean {
    if (value === undefined || value === null) {
      return true;
    }

    const expectedType =
      typeof ruleValue === "string"
        ? ruleValue
        : isRecord(ruleValue) && typeof ruleValue.type === "string"
          ? ruleValue.type
          : undefined;

    if (!expectedType) {
      return true;
    }

    switch (expectedType as SupportedType) {
      case "string":
        return typeof value === "string";
      case "number":
        return typeof value === "number" && Number.isFinite(value);
      case "boolean":
        return typeof value === "boolean";
      case "integer":
        return typeof value === "number" && Number.isInteger(value);
      case "array":
        return Array.isArray(value);
      case "object":
        return typeof value === "object" && !Array.isArray(value);
      case "date":
        return value instanceof Date && Number.isFinite(value.getTime());
      default:
        return false;
    }
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
