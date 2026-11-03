# Local Form Builder

An ESM-only React form builder copied from the sibling FormBuilder application. The original application is not modified. Core behavior and default rule implementations are preserved. UI adapters and all plugin registration belong to the consuming application, not the library.

## Build and pack

```powershell
npm ci
npm run typecheck
npm run lint
npm run build
npm pack --ignore-scripts
npm install --prefix verification/consumer
npm test
npm pack
```

The output is `local-form-builder-0.1.0.tgz`. Install the archive in another application:

```powershell
npm install "C:\Users\phamv\OneDrive\Desktop\FE\form-builder-lib\local-form-builder-0.1.0.tgz"
```

React and React DOM are peer dependencies. The supported peer range matches the original application's React 19.3 dependency. Build tooling requires a modern Node version supported by Vite 8; verification uses Node 24. The library does not install or declare Ant Design. Modern browser/ES2023 behavior is retained; SSR and older React versions are not claimed as supported.

## Ant Design usage

Install Ant Design 5.29 or a compatible 5.x version only in the consuming application. With React 19, install its official compatibility patch too:

```powershell
npm install antd @ant-design/v5-patch-for-react-19
```

Keep application configuration in `src/plugins/form-register.ts`, `src/plugins/component-register.ts`, and `src/plugins/validation-register.ts`. Working examples, including the UI wrapper, are in [verification/consumer/src/plugins](verification/consumer/src/plugins). Import these modules once before rendering forms:

```tsx
import "@ant-design/v5-patch-for-react-19";
import "./plugins/form-register";
import "./plugins/component-register";
import "./plugins/validation-register";
import { FormBuilder, FormControl } from "@local/form-builder";
import type { FormBuilderSchema, FormBuilderStyles } from "@local/form-builder";
import "@local/form-builder/styles.css";

const control = new FormControl();
const styles: FormBuilderStyles = {
  sectionGap: 32,
  fieldGap: "1rem",
  labelGap: 10,
  errorGap: 4,
  label: { fontSize: 14, fontWeight: 600 },
};

const schema: FormBuilderSchema = {
  formType: "antd-form",
  layout: {
    groups: [{
      id: "contact",
      title: "Contact",
      sections: [{ id: "details", fields: [{ name: "name" }] }],
    }],
  },
  fields: {
    name: {
      useComponent: "input",
      label: "Name",
      placeholder: "@ui.namePlaceholder",
      validations: [{ rule: "stringMin", value: "@limits.min", message: "Name is too short" }],
    },
  },
};

export function ContactForm() {
  return <FormBuilder schema={schema} control={control} styles={styles}
    mapper={{ ui: { namePlaceholder: "Enter name" }, limits: { min: 2 } }} />;
}
```

Keep one stable control instance per mounted form, normally created with `useState(() => new FormControl())`. Do not share a control instance across simultaneously mounted forms.

## Entry points

- `@local/form-builder`: FormBuilder, FormControl, useFormValue, schema/styles/plugin/rule types, pluginRegistry and the optional Plugin decorator. Importing it does not register UI plugins or default rules.
- `@local/form-builder/rules`: exports the 35 default validation rule classes from `src/plugins/rules`; importing it does not register any rules. Numeric bounds are exported as `NumberMinRule` and `NumberMaxRule`.
- `@local/form-builder/styles.css`: includes only the original form-specific selectors, preserving declarations, cascade order and media queries. It retains Ant Design-specific form selectors but does not style the host page's body, root, headings or playground UI.

All JavaScript entries share the same registry and are passive. Only CSS is marked as a library side effect. If the consuming application's package uses `sideEffects: false`, exclude its plugin registration files from that setting so its bundler retains them. The package ships compiled JavaScript and TypeScript declarations, not decorator syntax. Consumers do not need Babel/decorator configuration merely to import it. Internal modules are not public import paths. The former `@local/form-builder/antd` entry is removed; replace it with application-owned registration imports.

## Custom plugins without Ant Design

```tsx
import { FormBuilder, pluginRegistry } from "@local/form-builder";
import type { Rule } from "@local/form-builder";
import { RequiredRule, EmailRule } from "@local/form-builder/rules";

pluginRegistry.register("validation", { class: RequiredRule });
pluginRegistry.register("validation", { class: EmailRule });

pluginRegistry.register("form", { name: "native-form", class: "form" });
pluginRegistry.register("component", { name: "input", class: "input" });
pluginRegistry.register("component", { name: "button", class: "button" });

class CustomRule implements Rule {
  validate(value: unknown): boolean {
    return typeof value === "string" && value.trim().length > 0;
  }
}
pluginRegistry.register("validation", { name: "customRequired", class: CustomRule });
```

Use `formType: "native-form"` in the schema. Plugins must be registered before a schema using them is rendered. Select default rules explicitly in the application's `validation-register.ts` and register additional rules through the same registry. Registration remains a singleton with the original overwrite-on-duplicate behavior. React and React DOM are external to the package bundle; only fast-deep-equal is a runtime dependency of core.

## Preserved behavior

- activeGroupId, onActiveGroupChange and onAction are optional. The first group is the default; supplied activeGroupId retains controlled behavior.
- Reset actions reset internally before invoking the one-argument onAction callback, after validateBeforeRun succeeds. Programmatic control.reset() is unchanged.
- Mapper references work recursively within fields, retain mapped value types, support `@@` literals and throw for missing paths. Mapper is not the editable form state. Configuration-only updates preserve user edits; mapped field.value changes synchronize values.
- Styles are per form; numeric gaps are pixels, strings are CSS lengths, and omitted options preserve defaults/schema gutters.
- Rule validation stays synchronous. The fourth callback delegates by rule name with the current value, ruleValue and values; circular calls are rejected.
- Conditional focus, live validation, group validation, option overrides, value subscriptions, dirty checking and reset behavior are unchanged.
- The original native window.confirm, Vietnamese messages and automatic submitted-value JSON output are deliberately retained. Applications should account for these behaviors, especially with sensitive form data; they were not removed during packaging.

## Verification

`fixtures/source` is a read-only snapshot used for parity tests, not part of the published archive. Tests compare all 174 existing playground probes, React workflows, core/rule source and scoped CSS against that snapshot. Tests also verify passive imports and explicit default/custom rule registration. The original playground's two demo-only components are registered only in tests, not exported by the library. Install the consumer dependencies before running tests; test-only aliases resolve its UI dependencies and share one React runtime without adding Ant Design to the library.

`verification/consumer` is a separate application that installs the actual archive and owns Ant Design, its wrapper and all three registration modules. It also demonstrates a custom rule delegating to a default rule. It uses no Babel or source aliases for builds. From that directory, run `npm install`, `npm run typecheck`, `npm run build`, then `npm run dev -- --host 127.0.0.1 --port 5175 --strictPort`. Source checking stays strict; `skipLibCheck` is enabled for Ant Design 5's React 19-incompatible third-party declarations. This application is excluded from the archive.

The archive includes only dist, this README and npm's package metadata. No playground application, test snapshots or development configuration are included. `private: true` prevents accidental publishing while still allowing npm pack and local archive installation.