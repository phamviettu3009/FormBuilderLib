export function isEmptyArrayValue(value: unknown): boolean {
  return value === undefined || value === null;
}

export function getArrayLimit(value: unknown, ruleName: string): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    throw new Error(
      `Validation rule "${ruleName}" requires a non-negative integer value`,
    );
  }
  return value;
}
