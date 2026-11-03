export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function getObjectRuleConfigs(
  value: unknown,
): Array<{ rule: string; value?: unknown }> {
  if (Array.isArray(value)) {
    return value.filter(isObjectRuleConfig);
  }
  return isObjectRuleConfig(value) ? [value] : [];
}

function isObjectRuleConfig(
  value: unknown,
): value is { rule: string; value?: unknown } {
  return isRecord(value) && typeof value.rule === "string";
}
