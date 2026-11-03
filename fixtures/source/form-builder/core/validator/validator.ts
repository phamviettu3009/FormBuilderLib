import type { FormField } from "../form/FormBuilder";
import { pluginRegistry } from "../plugin-registry";
import type { SchemaExtractor } from "../schema-extractor";
import type { Rule } from "./rule";

export class Validator {
  private readonly schema: SchemaExtractor;
  private rules: Map<string, Rule> = new Map();

  constructor(schema: SchemaExtractor) {
    this.schema = schema;
    this.loadAllValidationRules();
  }

  validate(values: Record<string, unknown>): boolean {
    return this.schema.fields.every((field) =>
      this.validateField(field, values[field.name], values),
    );
  }

  validateField(
    field: FormField,
    value: unknown,
    values: Record<string, unknown> = {},
  ): boolean {
    return this.getFieldError(field, value, values) === undefined;
  }

  getFieldError(
    field: FormField,
    value: unknown,
    values: Record<string, unknown> = {},
  ): string | undefined {
    for (const validation of field.validations ?? []) {
      const ruleName = validation.rule ?? validation.type;
      if (!ruleName) {
        throw new Error(
          `Validation rule type is required for field: ${field.name}`,
        );
      }

      if (!this.validateRule(ruleName, value, validation.value, values)) {
        return validation.message;
      }
    }

    return undefined;
  }

  private validateRule(
    ruleName: string,
    value: unknown,
    ruleValue: unknown,
    values: Record<string, unknown>,
    activeRules: Set<string> = new Set(),
  ): boolean {
    if (activeRules.has(ruleName)) {
      throw new Error(`Circular validation rule: ${ruleName}`);
    }

    activeRules.add(ruleName);
    try {
      return this.getRule(ruleName).validate(
        value,
        ruleValue,
        values,
        (nextRuleName) =>
          this.validateRule(nextRuleName, value, ruleValue, values, activeRules),
      );
    } finally {
      activeRules.delete(ruleName);
    }
  }

  private getRule(ruleName: string): Rule {
    const cachedRule = this.rules.get(ruleName);
    if (cachedRule) {
      return cachedRule;
    }

    const plugin = pluginRegistry
      .getAllPlugins("validation")
      .find((registeredPlugin) => registeredPlugin.name === ruleName);
    if (!plugin) {
      throw new Error(`Validation rule not found: ${ruleName}`);
    }

    const rule = new plugin.class();
    this.rules.set(ruleName, rule);
    return rule;
  }

  private loadAllValidationRules(): void {
    for (const field of this.schema.validationFields) {
      for (const validation of field.validations ?? []) {
        const ruleName = validation.rule ?? validation.type;
        if (!ruleName) {
          throw new Error(
            `Validation rule type is required for field: ${field.name}`,
          );
        }
        this.getRule(ruleName);
      }
    }
  }
}
