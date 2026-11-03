import type { FormControlContext } from "./FormControlContext";

export class FormGroupControl {
  private readonly context: FormControlContext;

  constructor(context: FormControlContext) {
    this.context = context;
  }

  getAll = (): Array<{ id: string; title: string }> => {
    return this.context.snapshot.groups.map((group) => ({ ...group }));
  };

  getActiveId = (): string => {
    return this.context.snapshot.activeGroupId;
  };
}
