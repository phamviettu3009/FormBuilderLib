import { useSyncExternalStore } from "react";
import type { FormControl } from "./FormControl";

export function useFormValue(control: FormControl, fieldName: string): unknown {
  return useSyncExternalStore(
    (notify) => control.value.watch(fieldName, notify),
    () => control.value.get(fieldName),
    () => control.value.get(fieldName),
  );
}
