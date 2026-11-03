import type { Rule } from "../../../core/validator/rule.ts";
import { Plugin } from "../../../core/plugin-metadata.ts";
import { isEmptyValue } from "./string-rule-utils.ts";

@Plugin("url")
export class UrlRule implements Rule {
  validate(value: unknown): boolean {
    if (isEmptyValue(value)) {
      return true;
    }
    if (typeof value !== "string") {
      return false;
    }

    try {
      const url = new URL(value);
      return (
        (url.protocol === "http:" || url.protocol === "https:") &&
        url.hostname.length > 0
      );
    } catch {
      return false;
    }
  }
}
