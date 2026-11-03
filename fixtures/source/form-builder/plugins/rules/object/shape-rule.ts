import { pluginRegistry } from "../../../core/plugin-registry.ts";
import type { Rule } from "../../../core/validator/rule.ts";
import { Plugin } from "../../../core/plugin-metadata.ts";
import { getObjectRuleConfigs, isRecord } from "./object-rule-utils.ts";

@Plugin("objectShape")
export class ObjectShapeRule implements Rule {
  validate(
    value: unknown,
    ruleValue?: unknown,
    values: Record<string, unknown> = {},
  ): boolean {
    if (value === undefined || value === null) {
      return true;
    }
    if (!isRecord(value) || !isRecord(ruleValue)) {
      return false;
    }

    return Object.entries(ruleValue).every(([key, fieldRule]) => {
      const configs = getObjectRuleConfigs(fieldRule);
      if (configs.length === 0) {
        return false;
      }
      return configs.every((config) => {
        try {
          const RuleClass = pluginRegistry.getPluginByName(
            config.rule,
            "validation",
          ).class;
          return new RuleClass().validate(value[key], config.value, values);
        } catch {
          return false;
        }
      });
    });
  }
}
