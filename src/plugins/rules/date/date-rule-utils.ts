export function isEmptyDate(value: unknown): boolean {
  return value === undefined || value === null || value === "";
}

export function toDate(value: unknown): Date | undefined {
  if (value instanceof Date) {
    return Number.isFinite(value.getTime()) ? value : undefined;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const timestamp = Date.parse(value);
    return Number.isFinite(timestamp) ? new Date(timestamp) : undefined;
  }
  if (typeof value !== "object" || value === null) {
    return undefined;
  }

  try {
    if (
      "isValid" in value &&
      typeof value.isValid === "function" &&
      !value.isValid()
    ) {
      return undefined;
    }
    if ("toDate" in value && typeof value.toDate === "function") {
      const date = value.toDate();
      return date instanceof Date && Number.isFinite(date.getTime())
        ? date
        : undefined;
    }
  } catch {
    return undefined;
  }
  return undefined;
}

export function getDateLimit(value: unknown, ruleName: string): Date {
  const date = toDate(value);
  if (!date) {
    throw new Error(`Validation rule "${ruleName}" requires a valid date`);
  }
  return date;
}
