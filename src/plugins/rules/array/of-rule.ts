import { pluginRegistry } from "../../../core/plugin-registry.ts";
import type { Rule } from "../../../core/validator/rule.ts";
import { Plugin } from "../../../core/plugin-metadata.ts";

interface ElementRuleConfig {
  rule: string;
  value?: unknown;
}

@Plugin("arrayOf")
export class ArrayOfRule implements Rule {
  validate(
    value: unknown,
    ruleValue?: unknown,
    values: Record<string, unknown> = {},
  ): boolean {
    if (value === undefined || value === null) {
      return true;
    }
    if (!Array.isArray(value)) {
      return false;
    }

    const rules = getElementRules(ruleValue);
    if (rules.length === 0) {
      return false;
    }

    return value.every((item) =>
      rules.every((config) => {
        try {
          const RuleClass = pluginRegistry.getPluginByName(
            config.rule,
            "validation",
          ).class;
          return new RuleClass().validate(item, config.value, values);
        } catch {
          return false;
        }
      }),
    );
  }
}

function getElementRules(value: unknown): ElementRuleConfig[] {
  if (Array.isArray(value)) {
    return value.filter(isElementRuleConfig);
  }
  return isElementRuleConfig(value) ? [value] : [];
}

function isElementRuleConfig(value: unknown): value is ElementRuleConfig {
  return (
    typeof value === "object" &&
    value !== null &&
    "rule" in value &&
    typeof value.rule === "string"
  );
}
