import equal from "fast-deep-equal";
import type { FormControlContext } from "./FormControlContext";

export class FormValueControl {
  private readonly context: FormControlContext;

  constructor(context: FormControlContext) {
    this.context = context;
  }

  get = (fieldName: string): unknown => {
    return this.context.snapshot.values[fieldName];
  };

  getAll = (): Record<string, unknown> => {
    return { ...this.context.snapshot.values };
  };

  set = (fieldName: string, value: unknown): void => {
    this.context.requireOperations().setValue(fieldName, value);
  };

  setMany = (values: Record<string, unknown>): void => {
    this.context.requireOperations().setValues(values);
  };

  resetField = (fieldName: string): void => {
    this.context.requireOperations().resetField(fieldName);
  };

  isDirty = (fieldName?: string): boolean => {
    const { values, initialValues = {} } = this.context.snapshot;
    return fieldName === undefined
      ? !equal(values, initialValues)
      : !equal(values[fieldName], initialValues[fieldName]);
  };

  watch: {
    (fieldName: string, listener: (value: unknown) => void): () => void;
    (listener: (values: Record<string, unknown>) => void): () => void;
  } = (
    fieldNameOrListener: string | ((values: Record<string, unknown>) => void),
    listener?: (value: unknown) => void,
  ): (() => void) => {
    if (typeof fieldNameOrListener === "function") {
      return this.context.subscribeValues((values) =>
        fieldNameOrListener({ ...values }),
      );
    }
    if (!listener) {
      throw new Error("A listener is required when watching a field");
    }
    return this.context.subscribeValues((values, changed) => {
      if (changed.includes(fieldNameOrListener)) {
        listener(values[fieldNameOrListener]);
      }
    });
  };
}
