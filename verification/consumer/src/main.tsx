import "@ant-design/v5-patch-for-react-19";
import "./plugins/form-register";
import "./plugins/component-register";
import "./plugins/validation-register";
import { useState } from "react";
import { createRoot } from "react-dom/client";
import { FormBuilder, FormControl, pluginRegistry, useFormValue } from "@local/form-builder";
import type { FormBuilderSchema, FormBuilderStyles } from "@local/form-builder";
import { pluginRegistry as rulesRegistry } from "@local/form-builder/rules";
import "@local/form-builder/styles.css";
import "./styles.css";

if (pluginRegistry !== rulesRegistry) {
  throw new Error("Package entries must share their plugin registry");
}

const schema: FormBuilderSchema = {
  formType: "antd-form",
  title: "Contact record",
  layout: {
    groups: [{
      id: "contact",
      title: "Contact",
      sections: [
        { id: "identity", title: "Identity", fields: [{ name: "name" }] },
        { id: "details", title: "Details", fields: [{ name: "email" }, { type: "action", name: "reset" }, { type: "action", name: "submit" }] },
      ],
    }],
  },
  fields: {
    name: {
      useComponent: "input",
      label: "Name",
      placeholder: "@ui.placeholder",
      required: "@ui.required",
      value: "@values.name",
      liveValidation: { active: true, debounce: 0 },
      validations: [
        { rule: "delegatedRequired", message: "Name is required" },
        { rule: "stringMin", value: "@limits.min", message: "@messages.min" },
      ],
    },
    email: {
      useComponent: "input",
      label: "Email",
      value: "an@example.com",
      validations: [{ rule: "email", message: "Invalid email" }],
    },
  },
  actions: [
    { id: "reset", type: "reset", useComponent: "button", label: "Reset" },
    { id: "submit", type: "submit", useComponent: "button", label: "Save", placement: "primary", validateBeforeRun: true },
  ],
};

const styles: FormBuilderStyles = {
  sectionGap: 28,
  fieldGap: 16,
  labelGap: 10,
  errorGap: 4,
  label: { fontFamily: "Georgia, serif", fontSize: 14, fontWeight: 600 },
  error: { color: "#b42318", fontSize: 12 },
};

function App() {
  const [control] = useState(() => new FormControl());
  const [mapper, setMapper] = useState({
    values: { name: "An" },
    ui: { placeholder: "Enter name", required: true },
    limits: { min: 2 },
    messages: { min: "At least two characters" },
  });
  const name = useFormValue(control, "name");
  const [submitted, setSubmitted] = useState<Record<string, unknown>>();

  return <main>
    <div className="verification-toolbar">
      <button type="button" onClick={() => setMapper((current) => ({ ...current, ui: { ...current.ui, placeholder: "Updated hint" }, limits: { min: 12 }, messages: { min: "At least twelve characters" } }))}>Update configuration</button>
      <button type="button" onClick={() => setMapper((current) => ({ ...current, values: { name: "Mapped replacement" } }))}>Replace mapped value</button>
      <button type="button" onClick={() => control.reset()}>Control reset</button>
    </div>
    <FormBuilder schema={schema} mapper={mapper} control={control} styles={styles}
      onSubmit={(values) => setSubmitted(values)} />
    <output data-testid="watched-name">{typeof name === "string" ? name : ""}</output>
    {submitted && <output data-testid="submitted-name">{String(submitted.name)}</output>}
  </main>;
}

createRoot(document.getElementById("root")!).render(<App />);