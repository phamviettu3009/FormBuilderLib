import type { FormControlContext } from "./FormControlContext";

export class FormValidatorControl {
  private readonly context: FormControlContext;

  constructor(context: FormControlContext) {
    this.context = context;
  }

  validate = (): boolean => {
    return this.context.requireOperations().validate();
  };

  validateField = (fieldName: string, groupId?: string): boolean => {
    return this.context.requireOperations().validateField(fieldName, groupId);
  };

  validateGroup = (groupId: string): boolean => {
    return this.context.requireOperations().validateGroup(groupId);
  };

  getErrors = (): Record<string, Record<string, string>> => {
    return Object.fromEntries(
      Object.entries(this.context.snapshot.errors).map(([groupId, errors]) => [
        groupId,
        { ...errors },
      ]),
    );
  };

  getError = (
    fieldName: string,
    groupId = this.context.snapshot.activeGroupId,
  ): string | undefined => {
    return this.context.snapshot.errors[groupId]?.[fieldName];
  };
}
