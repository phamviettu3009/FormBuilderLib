export interface Condition {
  name: string;
  operator:
    | "equals"
    | "notEquals"
    | "in"
    | "exists"
    | "lessThan"
    | "greaterThan"
    | "lessThanOrEqual"
    | "greaterThanOrEqual";
  value?: unknown;
  action: {
    display?: "hide" | "remove";
    disable?: boolean;
    focus?: boolean;
    resetValue?: boolean;
    ignoreValidation?: boolean;
  };
}

export interface FormFieldOption {
  label: string;
  value: string | number | boolean;
}

export interface FormField {
  name: string;
  useComponent: string;
  label: string;
  required?: boolean;
  placeholder?: string;
  value?: unknown;
  props?: Record<string, unknown> | null;
  options?: FormFieldOption[] | string;
  when?: Condition[];
  liveValidation?: {
    active: boolean;
    debounce?: number;
    trigger?: "onChange" | "onBlur";
  };
  validations?: Array<{
    rule?: string;
    type?: string;
    value?: unknown;
    message: string;
  }>;
}

export type FormFieldDefinition = Omit<FormField, "name">;

export type MapperReference = `@${string}`;

export type Mappable<Value> =
  | MapperReference
  | (Value extends (...args: never[]) => unknown
      ? Value
      : Value extends readonly (infer Item)[]
        ? Mappable<Item>[]
        : Value extends object
          ? { [Key in keyof Value]: Mappable<Value[Key]> }
          : Value);

export interface FormSectionField {
  name: string;
  type?: "field" | "action";
  column?: number;
  span?: number;
}

export interface FormSection {
  id: string;
  title?: string;
  description?: string;
  layout?: {
    direction?: "horizontal" | "vertical";
    columns?: number;
    gutter?: number;
  };
  fields: FormSectionField[];
}

export interface FormGroup {
  id: string;
  title: string;
  sections: FormSection[];
}

export interface ResolvedFormSection extends Omit<FormSection, "fields"> {
  fields: Array<FormField & Pick<FormSectionField, "column" | "span">>;
  items: ResolvedFormSectionItem[];
}

export type ResolvedFormSectionItem =
  | {
      type: "field";
      field: FormField & Pick<FormSectionField, "column" | "span">;
    }
  | { type: "action"; action: FormAction; column?: number; span?: number };

export type FormActionType = "submit" | "reset" | "custom";

export interface FormAction {
  id: string;
  type: FormActionType;
  useComponent: string;
  label?: string;
  props?: Record<string, unknown>;
  placement?: "primary" | "secondary";
  validateBeforeRun?: boolean;
  validationGroups?: string[];
  loadingWhileSubmitting?: boolean;
  confirm?: {
    title: string;
    description?: string;
  };
}

export interface FormBuilderSchema {
  id?: string;
  version?: number;
  formType: string;
  title?: string;
  description?: string;
  layout?: {
    labelPosition?: "top" | "left";
    gutter?: number;
    groups: FormGroup[];
  };
  fields: Record<string, Mappable<FormFieldDefinition>>;
  actions?: FormAction[];
}
