export const PLUGIN_NAME = Symbol.for("form-builder.pluginName");

export function Plugin(name: string) {
  return <T extends Function>(pluginClass: T): T => {
    Object.defineProperty(pluginClass, PLUGIN_NAME, {
      configurable: false,
      enumerable: false,
      value: name,
      writable: false,
    });
    return pluginClass;
  };
}
