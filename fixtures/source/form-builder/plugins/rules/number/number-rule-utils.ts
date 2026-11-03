export function isEmptyValue(value: unknown): value is null | undefined | "" {
  return value === undefined || value === null || value === "";
}

export function toFiniteNumber(value: unknown): number | undefined {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) ? parsedValue : undefined;
  }
  return undefined;
}

export function getNumericLimit(value: unknown, ruleName: string): number {
  const numericValue = toFiniteNumber(value);
  if (numericValue === undefined) {
    throw new Error(
      `Validation rule "${ruleName}" requires a finite numeric value`,
    );
  }
  return numericValue;
}
