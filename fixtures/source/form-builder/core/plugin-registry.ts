import type { FormPlugin, PluginDefinitions } from "./types";
import { PLUGIN_NAME } from "./plugin-metadata.ts";

type PluginType = keyof PluginDefinitions;
type PluginStores = {
  [Type in PluginType]: Map<string, FormPlugin<PluginDefinitions[Type]>>;
};

class PluginRegistry {
  private plugins: PluginStores = {
    validation: new Map(),
    component: new Map(),
    form: new Map(),
  };

  register<Type extends PluginType>(
    type: Type,
    plugin: Omit<FormPlugin<PluginDefinitions[Type]>, "name"> & {
      name?: string;
    },
  ): void {
    const name = getPluginName(plugin.class) ?? plugin.name;
    if (!name) {
      throw new Error(`Plugin name is required for type: ${type}`);
    }

    const registeredPlugin = { ...plugin, name } as FormPlugin<
      PluginDefinitions[Type]
    >;
    this.plugins[type].set(name, registeredPlugin);
  }

  getPluginByName<Type extends PluginType>(
    name: string,
    type: Type,
  ): FormPlugin<PluginDefinitions[Type]> {
    const plugin = this.plugins[type].get(name);
    if (!plugin) {
      throw new Error(`Plugin not found: ${name}`);
    }
    return plugin;
  }

  getAllPlugins<Type extends PluginType>(
    type: Type,
  ): FormPlugin<PluginDefinitions[Type]>[] {
    return Array.from(this.plugins[type].values());
  }
}

export const pluginRegistry = new PluginRegistry();

function getPluginName(pluginClass: unknown): string | undefined {
  if (typeof pluginClass !== "function") {
    return undefined;
  }

  const name = (
    pluginClass as Function & { [PLUGIN_NAME]?: unknown }
  )[PLUGIN_NAME];
  return typeof name === "string" && name.length > 0 ? name : undefined;
}
