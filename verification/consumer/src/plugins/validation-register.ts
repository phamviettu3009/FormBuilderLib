import { pluginRegistry, type Rule, type ValidateRule } from "@local/form-builder";
import {
  RequiredRule, EmailRule, PhoneRule, DateRule, NumberMinRule, NumberMaxRule,
  DefinedRule, NonNullableRule, OneOfRule, NotOneOfRule, TypeErrorRule,
  WhenRule, TestRule, StringMinRule, StringMaxRule, StringLengthRule,
  MatchesRule, UrlRule, UuidRule, DateTimeRule, LessThanRule, MoreThanRule,
  PositiveRule, NegativeRule, IntegerRule, DateMinRule, DateMaxRule,
  BooleanRequiredRule, ArrayRequiredRule, ArrayMinRule, ArrayMaxRule,
  ArrayLengthRule, ArrayOfRule, ObjectShapeRule, NoUnknownRule,
} from "@local/form-builder/rules";

const defaultRules = [
  RequiredRule, EmailRule, PhoneRule, DateRule, NumberMinRule, NumberMaxRule,
  DefinedRule, NonNullableRule, OneOfRule, NotOneOfRule, TypeErrorRule,
  WhenRule, TestRule, StringMinRule, StringMaxRule, StringLengthRule,
  MatchesRule, UrlRule, UuidRule, DateTimeRule, LessThanRule, MoreThanRule,
  PositiveRule, NegativeRule, IntegerRule, DateMinRule, DateMaxRule,
  BooleanRequiredRule, ArrayRequiredRule, ArrayMinRule, ArrayMaxRule,
  ArrayLengthRule, ArrayOfRule, ObjectShapeRule, NoUnknownRule,
];

for (const rule of defaultRules) {
  pluginRegistry.register("validation", { class: rule });
}

class DelegatedRequiredRule implements Rule {
  validate(
    _value: unknown,
    _ruleValue?: unknown,
    _values?: Record<string, unknown>,
    validateRule?: ValidateRule,
  ): boolean {
    return validateRule?.("required") ?? false;
  }
}

pluginRegistry.register("validation", { name: "delegatedRequired", class: DelegatedRequiredRule });