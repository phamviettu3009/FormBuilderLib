import type {
  FormBuilderSchema,
  FormField,
  FormGroup,
  ResolvedFormSection,
  ResolvedFormSectionItem,
} from "./form/FormBuilder";
import { resolveFieldMappings } from "./field-mapper";

export class SchemaExtractor {
  readonly groups: Array<
    Omit<FormGroup, "sections"> & { sections: ResolvedFormSection[] }
  >;
  readonly sections: ResolvedFormSection[];
  readonly fields: FormField[];
  readonly componentTypes: string[];
  readonly validationFields: FormField[];

  constructor(schema: FormBuilderSchema, mapper?: Record<string, unknown>) {
    const fieldsByName = new Map<string, FormField>(
      Object.entries(resolveFieldMappings(schema.fields, mapper)).map(([name, field]) => [
        name,
        { ...field, name },
      ]),
    );
    const actionsById = new Map(
      (schema.actions ?? []).map((action) => [action.id, action]),
    );
    const usedFieldNames = new Set<string>();
    this.groups = (schema.layout?.groups ?? []).map((group) => ({
      ...group,
      sections: group.sections.map((section) => {
        const items: ResolvedFormSectionItem[] = section.fields.map(
          ({ name, type, column, span }) => {
            if (type === "action") {
              const action = actionsById.get(name);
              if (!action) {
                throw new Error(
                  `Action "${name}" referenced by section "${section.id}" was not defined in schema.actions`,
                );
              }
              return { type: "action", action, column, span };
            }
            const field = fieldsByName.get(name);
            if (!field) {
              throw new Error(
                `Field "${name}" referenced by section "${section.id}" was not defined in schema.fields`,
              );
            }
            usedFieldNames.add(name);
            return { type: "field", field: { ...field, column, span } };
          },
        );
        return {
          ...section,
          items,
          fields: items.flatMap((item) =>
            item.type === "field" ? [item.field] : [],
          ),
        };
      }),
    }));
    const groupIds = new Set(this.groups.map((group) => group.id));
    for (const action of schema.actions ?? []) {
      for (const groupId of action.validationGroups ?? []) {
        if (!groupIds.has(groupId)) {
          throw new Error(
            `Validation group "${groupId}" referenced by action "${action.id}" was not defined in layout.groups`,
          );
        }
      }
    }
    this.sections = this.groups.flatMap((group) => group.sections);
    this.fields = [...usedFieldNames].map((name) => fieldsByName.get(name)!);
    this.componentTypes = [
      ...new Set(this.fields.map((field) => field.useComponent)),
    ];
    this.validationFields = this.fields.filter(
      (field) =>
        field.validations !== undefined && field.validations.length > 0,
    );
  }
}
