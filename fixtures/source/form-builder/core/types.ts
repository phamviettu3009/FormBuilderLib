import type { ElementType } from "react";
import type { Rule } from "./validator/rule";

export type RuleConstructor = new () => Rule;

export interface ComponentBinding {
  child?: ElementType;
  valueProp?: string;
  eventValueProp?: string;
  invalidProp?: string;
  errorMessageProp?: string;
  supportsOptions?: boolean;
  labelPosition?: "before" | "after";
  actionTypeProp?: string;
}

export interface FormPlugin<TClass = RuleConstructor | ElementType> {
  name: string;
  class: TClass;
  submitHandlerProp?: string;
  componentBinding?: ComponentBinding;
}

export interface PluginDefinitions {
  validation: RuleConstructor;
  component: ElementType;
  form: ElementType;
}
