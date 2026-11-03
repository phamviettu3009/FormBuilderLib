import { FormControlContext } from "./FormControlContext";
import type {
  FormControlOperations,
  FormControlSnapshot,
} from "./FormControlContext";
import { FormFieldControl } from "./FormFieldControl";
import { FormGroupControl } from "./FormGroupControl";
import { FormValidatorControl } from "./FormValidatorControl";
import { FormValueControl } from "./FormValueControl";

export class FormControl {
  private readonly context = new FormControlContext();
  readonly value = new FormValueControl(this.context);
  readonly validator = new FormValidatorControl(this.context);
  readonly group = new FormGroupControl(this.context);
  readonly field = new FormFieldControl(this.context);

  reset(): void {
    this.context.requireOperations().reset();
  }

  connect(
    snapshot: FormControlSnapshot,
    operations: FormControlOperations,
  ): void {
    this.context.connect(snapshot, operations);
  }

  disconnect(): void {
    this.context.disconnect();
  }
}
