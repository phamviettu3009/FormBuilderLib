import { pluginRegistry } from "../../../core/plugin-registry.ts";
import type { Rule } from "../../../core/validator/rule.ts";
import { Plugin } from "../../../core/plugin-metadata.ts";

interface ConditionalRule {
  rule: string;
  value?: unknown;
}

interface WhenRuleConfig {
  field: string;
  is?: unknown;
  then?: ConditionalRule;
  otherwise?: ConditionalRule;
}

@Plugin("when")
export class WhenRule implements Rule {
  validate(
    value: unknown,
    ruleValue?: unknown,
    values: Record<string, unknown> = {},
  ): boolean {
    if (!isWhenRuleConfig(ruleValue)) {
      return false;
    }

    const actual = getPathValue(values, ruleValue.field);
    const selected =
      actual === ruleValue.is ? ruleValue.then : ruleValue.otherwise;
    if (!selected) {
      return true;
    }

    try {
      const RuleClass = pluginRegistry.getPluginByName(
        selected.rule,
        "validation",
      ).class;
      return new RuleClass().validate(value, selected.value, values);
    } catch {
      return false;
    }
  }
}

function isWhenRuleConfig(value: unknown): value is WhenRuleConfig {
  return (
    typeof value === "object" &&
    value !== null &&
    "field" in value &&
    typeof value.field === "string"
  );
}

function getPathValue(source: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((current, key) => {
    if (current === null || typeof current !== "object") {
      return undefined;
    }
    return (current as Record<string, unknown>)[key];
  }, source);
}