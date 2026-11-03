import type { FormFieldDefinition, FormBuilderSchema } from "./form/schema";

export function hasMapperReference(value: unknown): boolean {
  if (typeof value === "string") {
    return value.startsWith("@") && !value.startsWith("@@");
  }
  if (Array.isArray(value)) {
    return value.some(hasMapperReference);
  }
  if (
    value !== null &&
    typeof value === "object" &&
    (Object.getPrototypeOf(value) === Object.prototype ||
      Object.getPrototypeOf(value) === null)
  ) {
    return Object.values(value).some(hasMapperReference);
  }
  return false;
}

export function resolveFieldMappings(
  fields: FormBuilderSchema["fields"],
  mapper?: Record<string, unknown>,
): Record<string, FormFieldDefinition> {
  return Object.fromEntries(
    Object.entries(fields).map(([name, field]) => [
      name,
      resolveMappedValue(field, mapper, `fields.${name}`),
    ]),
  ) as Record<string, FormFieldDefinition>;
}

function resolveMappedValue(
  value: unknown,
  mapper: Record<string, unknown> | undefined,
  location: string,
): unknown {
  if (typeof value === "string") {
    if (value.startsWith("@@")) {
      return value.slice(1);
    }
    if (!value.startsWith("@")) {
      return value;
    }

    let resolved: unknown = mapper;
    for (const segment of value.slice(1).split(".")) {
      if (
        !segment ||
        resolved === null ||
        typeof resolved !== "object" ||
        !Object.hasOwn(resolved, segment)
      ) {
        throw new Error(`Mapper reference "${value}" not found at ${location}`);
      }
      resolved = (resolved as Record<string, unknown>)[segment];
    }
    return resolved;
  }

  if (Array.isArray(value)) {
    const resolved = value.map((item, index) =>
      resolveMappedValue(item, mapper, `${location}[${index}]`),
    );
    return resolved.every((item, index) => Object.is(item, value[index]))
      ? value
      : resolved;
  }

  if (
    value !== null &&
    typeof value === "object" &&
    (Object.getPrototypeOf(value) === Object.prototype ||
      Object.getPrototypeOf(value) === null)
  ) {
    const entries = Object.entries(value);
    const resolved = entries.map(([key, item]) => [
      key,
      resolveMappedValue(item, mapper, `${location}.${key}`),
    ] as const);
    return resolved.every(([, item], index) => Object.is(item, entries[index][1]))
      ? value
      : Object.fromEntries(resolved);
  }

  return value;
}