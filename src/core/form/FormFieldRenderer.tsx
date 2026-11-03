import type { CSSProperties, ElementType } from "react";
import type { ComponentBinding } from "../types";
import type { FormField, FormFieldOption } from "./schema";

interface FormFieldRendererProps {
  field: FormField;
  column?: number;
  span?: number;
  component: ElementType;
  binding?: ComponentBinding;
  options?: FormFieldOption[];
  value: unknown;
  error?: string;
  labelStyle?: CSSProperties;
  errorStyle?: CSSProperties;
  disabled: boolean;
  hidden: boolean;
  onChange: (value: unknown) => void;
  onBlur: () => void;
}

function normalizeChangeValue(value: unknown, eventValueProp: string): unknown {
  if (typeof value === "object" && value !== null) {
    if (
      "target" in value &&
      typeof value.target === "object" &&
      value.target !== null &&
      eventValueProp in value.target
    ) {
      return (value.target as Record<string, unknown>)[eventValueProp];
    }
    if (eventValueProp in value) {
      return (value as Record<string, unknown>)[eventValueProp];
    }
  }

  return value;
}

export function FormFieldRenderer({
  field,
  column,
  span,
  component: FieldComponent,
  binding,
  options,
  value,
  error,
  labelStyle,
  errorStyle,
  disabled,
  hidden,
  onChange,
  onBlur,
}: FormFieldRendererProps) {
  const fieldId = `field-${field.name}`;
  const errorId = `${fieldId}-error`;
  const labelPosition = binding?.labelPosition ?? "before";
  const label = (
    <label className="form-builder-label" htmlFor={fieldId} style={labelStyle}>
      {field.label}
      {field.required && (
        <span className="form-builder-label__required" aria-hidden="true">
          *
        </span>
      )}
    </label>
  );

  return (
    <div
      className={`form-builder-field form-builder-field--label-${labelPosition}${hidden ? " form-builder-field--hidden" : ""}`}
      style={{
        gridColumn: column
          ? `${column} / span ${span ?? 1}`
          : span
            ? `span ${span}`
            : undefined,
      }}
      aria-hidden={hidden}
      data-field-name={field.name}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          onBlur();
        }
      }}
    >
      <div className="form-builder-field-control">
        {labelPosition === "before" && label}
        <FieldComponent
          {...(field.props ?? {})}
          {...(binding?.child ? { child: binding.child } : {})}
          id={fieldId}
          {...{ [binding?.valueProp ?? "value"]: value }}
          {...(binding?.invalidProp
            ? { [binding.invalidProp]: Boolean(error) }
            : {})}
          {...(binding?.errorMessageProp
            ? { [binding.errorMessageProp]: error }
            : {})}
          placeholder={field.placeholder}
          options={options}
          disabled={disabled || hidden}
          onChange={(nextValue: unknown) =>
            onChange(
              normalizeChangeValue(
                nextValue,
                binding?.eventValueProp ?? "value",
              ),
            )
          }
          aria-invalid={Boolean(error)}
          {...(field.required ? { "aria-required": true } : {})}
          aria-describedby={error ? errorId : undefined}
        />
        {labelPosition === "after" && label}
      </div>
      {error && (
        <span className="form-builder-error" id={errorId} role="alert" style={errorStyle}>
          {error}
        </span>
      )}
    </div>
  );
}
