import type { ElementType } from "react";
import { pluginRegistry } from "../plugin-registry";
import type { SchemaExtractor } from "../schema-extractor";

export class ComponentBuilder {
  private readonly components = new Map<string, ElementType>();

  constructor(schema: SchemaExtractor) {
    this.loadAllComponents(schema);
  }

  getComponentByType(type: string): ElementType {
    const component = this.components.get(type);
    if (!component) {
      throw new Error(`Component not found for field type: ${type}`);
    }

    return component;
  }

  private loadAllComponents(schema: SchemaExtractor): void {
    const registeredComponents = new Map(
      pluginRegistry
        .getAllPlugins("component")
        .map((plugin) => [plugin.name, plugin.class]),
    );

    for (const type of schema.componentTypes) {
      const component = registeredComponents.get(type);
      if (!component) {
        throw new Error(`Component plugin not found for field type: ${type}`);
      }
      this.components.set(type, component);
    }
  }
}
