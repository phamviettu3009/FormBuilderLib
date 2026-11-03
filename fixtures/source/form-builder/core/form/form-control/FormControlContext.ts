import type { FormFieldOption } from "../schema";

export interface FormFieldState {
  value: unknown;
  error?: string;
  disabled: boolean;
  hidden: boolean;
}

export interface FormControlSnapshot {
  values: Record<string, unknown>;
  initialValues?: Record<string, unknown>;
  errors: Record<string, Record<string, string>>;
  fieldStates: Record<string, Record<string, FormFieldState>>;
  groups: Array<{ id: string; title: string }>;
  activeGroupId: string;
}

export interface FormControlOperations {
  setValue: (fieldName: string, value: unknown) => void;
  setValues: (values: Record<string, unknown>) => void;
  resetField: (fieldName: string) => void;
  setOptions: (fieldName: string, options: FormFieldOption[]) => void;
  validate: () => boolean;
  validateField: (fieldName: string, groupId?: string) => boolean;
  validateGroup: (groupId: string) => boolean;
  reset: () => void;
}

export class FormControlContext {
  snapshot: FormControlSnapshot = {
    values: {},
    errors: {},
    fieldStates: {},
    groups: [],
    activeGroupId: "",
  };
  private operations?: FormControlOperations;
  private readonly valueListeners = new Set<
    (values: Record<string, unknown>, changed: string[]) => void
  >();

  connect(
    snapshot: FormControlSnapshot,
    operations: FormControlOperations,
  ): void {
    const previousValues = this.snapshot.values;
    this.snapshot = snapshot;
    this.operations = operations;
    const names = new Set([
      ...Object.keys(previousValues),
      ...Object.keys(snapshot.values),
    ]);
    const changed = [...names].filter(
      (name) =>
        Object.hasOwn(previousValues, name) !==
          Object.hasOwn(snapshot.values, name) ||
        !Object.is(previousValues[name], snapshot.values[name]),
    );
    if (changed.length > 0) {
      for (const listener of this.valueListeners) {
        listener(snapshot.values, changed);
      }
    }
  }

  subscribeValues(
    listener: (values: Record<string, unknown>, changed: string[]) => void,
  ): () => void {
    this.valueListeners.add(listener);
    return () => this.valueListeners.delete(listener);
  }

  disconnect(): void {
    this.operations = undefined;
  }

  requireOperations(): FormControlOperations {
    if (!this.operations) {
      throw new Error("FormControl is not connected to a mounted FormBuilder");
    }
    return this.operations;
  }
}
