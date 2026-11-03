import type { FormControlContext, FormFieldState } from "./FormControlContext";
import type { FormFieldOption } from "../schema";

export class FormFieldControl {
  private readonly context: FormControlContext;

  constructor(context: FormControlContext) {
    this.context = context;
  }

  getState = (
    fieldName: string,
    groupId = this.context.snapshot.activeGroupId,
  ): FormFieldState | undefined => {
    const state = this.context.snapshot.fieldStates[groupId]?.[fieldName];
    return state ? { ...state } : undefined;
  };

  setOptions = (fieldName: string, options: FormFieldOption[]): void => {
    this.context.requireOperations().setOptions(fieldName, options);
  };
}
