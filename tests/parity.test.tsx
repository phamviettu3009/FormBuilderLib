import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { act, createElement, type ElementType } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import postcss from "postcss";
import selectorParser from "postcss-selector-parser";
import { FormBuilder, FormControl, pluginRegistry } from "../src/index";
import "../verification/consumer/src/plugins/form-register";
import "../verification/consumer/src/plugins/component-register";
import "../verification/consumer/src/plugins/validation-register";
import { SchemaExtractor } from "../src/core/schema-extractor";
import { Validator } from "../src/core/validator/validator";
import { FormBuilder as OriginalBuilder, FormControl as OriginalControl } from "../fixtures/source/form-builder/core/form/FormBuilder";
import { SchemaExtractor as OriginalExtractor } from "../fixtures/source/form-builder/core/schema-extractor";
import { Validator as OriginalValidator } from "../fixtures/source/form-builder/core/validator/validator";
import { pluginRegistry as originalRegistry } from "../fixtures/source/form-builder/core/plugin-registry";
import "../fixtures/source/form-builder/plugins/component-register";
import "../fixtures/source/form-builder/plugins/form-register";
import "../fixtures/source/form-builder/plugins/validation-register";
import { playgroundForms, runValidationSuite } from "../fixtures/source/form-builder/examples/validation-playground";

beforeAll(() => {
  (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  for (const registry of [pluginRegistry, originalRegistry]) {
    for (const name of ["numeric", "json-editor"]) {
      registry.register("component", { name, class: () => createElement("input") });
    }
  }
});

describe("validation parity with the source snapshot", () => {
  it("retains the complete original playground coverage", () => {
    const result = runValidationSuite();
    expect(result.passedForms).toBe(result.totalForms);
    expect(result.missingRules).toEqual([]);
    expect(result.missingComponents).toEqual([]);
    expect(pluginRegistry.getAllPlugins("validation").map((plugin) => plugin.name).filter((name) => name !== "delegatedRequired"))
      .toEqual(originalRegistry.getAllPlugins("validation").map((plugin) => plugin.name));
  });

  for (const form of playgroundForms) {
    it(`${form.id}: preserves every probe result and error message`, () => {
      const original = new OriginalExtractor(form.schema, form.mapper);
      const copied = new SchemaExtractor(form.schema, form.mapper);
      const originalValidator = new OriginalValidator(original);
      const validator = new Validator(copied);
      for (const probe of form.probes) {
        const originalField = original.fields.find((field) => field.name === probe.field)!;
        const copiedField = copied.fields.find((field) => field.name === probe.field)!;
        const values = { ...probe.values, [probe.field]: probe.value };
        const expected = originalValidator.getFieldError(originalField, probe.value, values);
        const actual = validator.getFieldError(copiedField, probe.value, values);
        expect(actual, probe.label).toEqual(expected);
        expect(actual === undefined, probe.label).toBe(probe.shouldPass);
      }
    });
  }
});

function schema(value: unknown = "Initial") {
  return {
    formType: "antd-form",
    layout: {
      groups: [
        { id: "first", title: "First", sections: [{ id: "one", fields: [{ name: "name" }, { type: "action" as const, name: "reset" }, { type: "action" as const, name: "custom" }] }] },
        { id: "second", title: "Second", sections: [{ id: "two", fields: [{ name: "other" }] }] },
      ],
    },
    fields: {
      name: { useComponent: "input", label: "Name", value, validations: [{ rule: "required", message: "Name required" }] },
      other: { useComponent: "input", label: "Other", value: "", validations: [{ rule: "required", message: "Other required" }] },
    },
    actions: [
      { id: "reset", type: "reset" as const, useComponent: "button", label: "Reset" },
      { id: "custom", type: "custom" as const, useComponent: "button", label: "Custom" },
    ],
  };
}

for (const [name, Builder, Control] of [
  ["original", OriginalBuilder, OriginalControl],
  ["library", FormBuilder, FormControl],
] as const) {
  describe(`${name} React behavior`, () => {
    let host: HTMLDivElement;
    let root: Root;
    beforeEach(() => {
      host = document.createElement("div");
      document.body.appendChild(host);
      root = createRoot(host);
    });
    afterEach(() => {
      act(() => root.unmount());
      host.remove();
    });
    const render = (props: Record<string, unknown>) => {
      act(() => root.render(createElement(Builder as ElementType, props)));
    };

    it("defaults to the first group and safely handles actions without callbacks", () => {
      const control = new Control();
      render({ schema: schema(), control });
      expect(control.group.getActiveId()).toBe("first");
      act(() => control.value.set("name", "Edited"));
      act(() => Array.from(host.querySelectorAll("button")).find((button) => button.textContent === "Custom")!.click());
      act(() => Array.from(host.querySelectorAll("button")).find((button) => button.textContent === "Reset")!.click());
      expect(control.value.get("name")).toBe("Initial");
      act(() => { expect(control.validator.validate()).toBe(false); });
      expect(control.group.getActiveId()).toBe("second");
      expect(host.querySelector("[role=alert]")?.textContent).toBe("Other required");
      act(() => control.reset());
      expect(control.validator.getErrors()).toEqual({});
      expect(control.group.getActiveId()).toBe("second");
    });

    it("retains controlled navigation and the one-argument action callback", () => {
      const control = new Control();
      const onActiveGroupChange = vi.fn();
      const onAction = vi.fn();
      render({ schema: schema(), control, activeGroupId: "first", onActiveGroupChange, onAction });
      act(() => { control.validator.validate(); });
      expect(onActiveGroupChange).toHaveBeenCalledWith("second");
      expect(control.group.getActiveId()).toBe("first");
      act(() => Array.from(host.querySelectorAll("button")).find((button) => button.textContent === "Reset")!.click());
      expect(onAction.mock.calls[0]).toHaveLength(1);
      expect(onAction.mock.calls[0][0].type).toBe("reset");
    });

    it("updates mapped configuration without overwriting edited nested values", () => {
      const control = new Control();
      const definition = schema({ amount: "@values.amount", enabled: false });
      definition.fields.name = { ...definition.fields.name, placeholder: "@ui.placeholder" } as typeof definition.fields.name;
      const firstMapper = { values: { amount: 2 }, ui: { placeholder: "Initial hint" } };
      render({ schema: definition, control, mapper: firstMapper });
      act(() => control.value.set("name", { amount: 99, enabled: true }));
      render({ schema: definition, control, mapper: { ...firstMapper, ui: { placeholder: "New hint" } } });
      expect(control.value.get("name")).toEqual({ amount: 99, enabled: true });
      expect(host.querySelector("input")?.placeholder).toBe("New hint");
      render({ schema: definition, control, mapper: { ...firstMapper, values: { amount: 3 } } });
      expect(control.value.get("name")).toEqual({ amount: 3, enabled: false });
    });

    it("preserves scoped style variables, typography and removal behavior", () => {
      const control = new Control();
      const definition = schema();
      render({ schema: definition, control, styles: { sectionGap: 0, fieldGap: "1rem", labelGap: 10, errorGap: 4, label: { fontSize: 18 }, error: { color: "red" } } });
      const wrapper = host.querySelector<HTMLElement>(".form-builder")!;
      expect(wrapper.style.getPropertyValue("--form-builder-section-gap")).toBe("0px");
      expect(wrapper.style.getPropertyValue("--form-builder-field-gap")).toBe("1rem");
      expect(host.querySelector<HTMLElement>("label")?.style.fontSize).toBe("18px");
      act(() => control.value.set("name", ""));
      act(() => { control.validator.validate(); });
      expect(host.querySelector<HTMLElement>(".form-builder-error")?.style.color).toBe("red");
      render({ schema: definition, control });
      expect(wrapper.style.getPropertyValue("--form-builder-section-gap")).toBe("");
      expect(host.querySelector<HTMLElement>("label")?.style.fontSize).toBe("");
    });
  });
}

describe("application-owned plugin registration", () => {
  it("keeps package imports passive and supports selected default and custom rules", async () => {
    vi.resetModules();
    const library = await import("../src/index");
    const rules = await import("../src/rules");
    expect(rules.pluginRegistry).toBe(library.pluginRegistry);
    for (const type of ["form", "component", "validation"] as const) {
      expect(library.pluginRegistry.getAllPlugins(type)).toEqual([]);
    }

    library.pluginRegistry.register("validation", { class: rules.RequiredRule });
    class CustomRule {
      validate(value: unknown): boolean {
        return value === "accepted";
      }
    }
    library.pluginRegistry.register("validation", { name: "custom", class: CustomRule });
    expect(library.pluginRegistry.getAllPlugins("validation").map((plugin) => plugin.name))
      .toEqual(["required", "custom"]);
    const custom = library.pluginRegistry.getPluginByName("custom", "validation");
    expect(new custom.class().validate("accepted")).toBe(true);
    expect(new custom.class().validate("rejected")).toBe(false);
  });

  it("does not publish an Ant Design entry or declare an Ant Design dependency", () => {
    const metadata = JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf8"));
    expect(metadata.exports).not.toHaveProperty("./antd");
    for (const dependencies of [metadata.dependencies, metadata.devDependencies, metadata.peerDependencies]) {
      expect(dependencies).not.toHaveProperty("antd");
    }
  });
});

describe("packaging does not rewrite runtime code or form CSS", () => {
  it("copies runtime source byte-for-byte except the type-only props export", () => {
    const sourceRoot = join(process.cwd(), "src");
    const snapshotRoot = join(process.cwd(), "fixtures", "source", "form-builder");
    function check(directory: string) {
      for (const entry of readdirSync(directory, { withFileTypes: true })) {
        const path = join(directory, entry.name);
        if (entry.isDirectory()) {
          check(path);
        } else {
          const pathFromRoot = relative(sourceRoot, path);
          const actual = readFileSync(path, "utf8").replace("export interface FormBuilderProps", "interface FormBuilderProps");
          expect(actual, pathFromRoot).toBe(readFileSync(join(snapshotRoot, pathFromRoot), "utf8"));
        }
      }
    }
    check(join(sourceRoot, "core"));
    check(join(sourceRoot, "plugins", "rules"));
  });

  it("extracts only form selectors with unchanged declarations and media queries", () => {
    function rules(css: string, filter: boolean) {
      const result: unknown[] = [];
      postcss.parse(css).walkRules((rule) => {
        const selectors = selectorParser().astSync(rule.selector);
        if (filter) {
          selectors.each((selector) => {
            let isFormSelector = false;
            selector.walkClasses((node) => {
              if (node.value === "form-builder" || node.value.startsWith("form-builder-")) isFormSelector = true;
            });
            if (!isFormSelector) selector.remove();
          });
        }
        if (!selectors.nodes.length) return;
        const parents: string[] = [];
        for (let parent = rule.parent; parent; parent = parent.parent) {
          if (parent.type === "atrule") parents.push(`${parent.name} ${parent.params}`);
        }
        result.push({ selectors: selectors.toString(), declarations: rule.nodes.filter((node) => node.type === "decl").map((node) => ({ prop: node.prop, value: node.value, important: node.important })), parents });
      });
      return result;
    }
    expect(rules(readFileSync(join(process.cwd(), "dist", "styles.css"), "utf8"), false))
      .toEqual(rules(readFileSync(join(process.cwd(), "fixtures", "source", "styles.css"), "utf8"), true));
  });
});