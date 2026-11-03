import type { CSSProperties } from "react";
import { FormActions } from "./FormActions";
import { FormControl } from "./FormControl";
import { FormFieldRenderer } from "./FormFieldRenderer";
import { FormSectionRenderer } from "./FormSectionRenderer";
import { useFormBuilder } from "./hook-form";
import type { FormAction, FormBuilderSchema } from "./schema";

export { FormControl } from "./FormControl";
export type {
  Condition,
  FormAction,
  FormActionType,
  FormBuilderSchema,
  FormField,
  FormFieldDefinition,
  FormFieldOption,
  Mappable,
  MapperReference,
  FormGroup,
  FormSection,
  FormSectionField,
  ResolvedFormSection,
  ResolvedFormSectionItem,
} from "./schema";

export interface FormBuilderStyles {
  sectionGap?: number | string;
  fieldGap?: number | string;
  labelGap?: number | string;
  errorGap?: number | string;
  form?: CSSProperties;
  label?: CSSProperties;
  error?: CSSProperties;
}

function toCssLength(value: number | string | undefined): string | undefined {
  return typeof value === "number" ? `${value}px` : value;
}

export interface FormBuilderProps {
  schema: FormBuilderSchema;
  styles?: FormBuilderStyles;
  activeGroupId?: string;
  onActiveGroupChange?: (groupId: string) => void;
  onAction?: (action: FormAction) => void;
  control?: FormControl;
  mapper?: Record<string, unknown>;
  onSubmit?: (values: Record<string, unknown>) => void | Promise<void>;
}

export function FormBuilder({
  schema,
  styles,
  activeGroupId,
  onActiveGroupChange,
  onAction,
  control,
  mapper,
  onSubmit,
}: FormBuilderProps) {
  const {
    activeGroup,
    activeGroupId: resolvedActiveGroupId,
    fieldActions,
    values,
    errors,
    submittedValues,
    submitError,
    submitting,
    formBuilderRef,
    formComponent: FormComponent,
    formProps,
    getComponentByType,
    getFieldOptions,
    getActionComponent,
    handleAction,
    handleFieldChange,
    handleFieldBlur,
  } = useFormBuilder(schema, {
    activeGroupId,
    onActiveGroupChange,
    onAction,
    control,
    mapper,
    onSubmit,
  });

  return (
    <div
      className="form-builder"
      ref={formBuilderRef}
      style={{
        ...styles?.form,
        "--form-builder-section-gap": toCssLength(styles?.sectionGap),
        "--form-builder-field-gap": toCssLength(styles?.fieldGap),
        "--form-builder-label-gap": toCssLength(styles?.labelGap),
        "--form-builder-error-gap": toCssLength(styles?.errorGap),
      } as CSSProperties}
    >
      {(schema.title || schema.description) && (
        <header className="form-builder-header">
          <div>
            {schema.title && <h2>{schema.title}</h2>}
            {schema.description && <p>{schema.description}</p>}
          </div>
          {schema.version !== undefined && (
            <span className="form-builder-version">
              Phiên bản {schema.version}
            </span>
          )}
        </header>
      )}
      <FormComponent {...formProps}>
        {activeGroup && (
          <div
            id={`tabpanel-${activeGroup.id}`}
            role="tabpanel"
            className="form-builder-group"
          >
            {activeGroup.sections.map((section) => {
              const visibleItems = section.items.filter(
                (item) =>
                  item.type === "action" ||
                  fieldActions[item.field.name].display !== "remove",
              );
              if (visibleItems.length === 0) {
                return null;
              }

              return (
                <FormSectionRenderer
                  key={section.id}
                  section={section}
                  gutter={section.layout?.gutter ?? schema.layout?.gutter ?? 16}
                >
                  {visibleItems.map((item) => {
                    if (item.type === "action") {
                      return (
                        <FormActions
                          key={`action:${item.action.id}`}
                          actions={[item.action]}
                          column={
                            section.layout?.direction === "vertical"
                              ? undefined
                              : item.column
                          }
                          span={
                            section.layout?.direction === "vertical"
                              ? undefined
                              : item.span
                          }
                          submitting={submitting}
                          getActionComponent={getActionComponent}
                          onAction={handleAction}
                        />
                      );
                    }
                    const field = item.field;
                    const component = getComponentByType(field.useComponent);
                    return (
                      <FormFieldRenderer
                        key={`field:${field.name}`}
                        field={field}
                        column={
                          section.layout?.direction === "vertical"
                            ? undefined
                            : field.column
                        }
                        span={
                          section.layout?.direction === "vertical"
                            ? undefined
                            : field.span
                        }
                        component={component.component}
                        binding={component.binding}
                        options={getFieldOptions(field)}
                        value={values[field.name]}
                        error={
                          errors[JSON.stringify([activeGroup.id, field.name])]
                        }
                        labelStyle={styles?.label}
                        errorStyle={styles?.error}
                        disabled={fieldActions[field.name].disabled}
                        hidden={fieldActions[field.name].display === "hide"}
                        onChange={(value) =>
                          handleFieldChange(activeGroup.id, field.name, value)
                        }
                        onBlur={() =>
                          handleFieldBlur(activeGroup.id, field.name)
                        }
                      />
                    );
                  })}
                </FormSectionRenderer>
              );
            })}
          </div>
        )}
        {!activeGroup && (
          <p className="form-builder-submit-error" role="alert" style={styles?.error}>
            Không tìm thấy group "{resolvedActiveGroupId}" trong schema.
          </p>
        )}
        {submitError && (
          <p className="form-builder-submit-error" role="alert" style={styles?.error}>
            {submitError}
          </p>
        )}
      </FormComponent>
      {submittedValues && (
        <section className="form-builder-result" aria-live="polite">
          <h3>Dữ liệu đã gửi</h3>
          <pre>{JSON.stringify(submittedValues, null, 2)}</pre>
        </section>
      )}
    </div>
  );
}
