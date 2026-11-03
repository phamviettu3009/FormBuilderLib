import { Form } from "antd";
import { pluginRegistry } from "../core/plugin-registry";

pluginRegistry.register("form", {
  name: "antd-form",
  class: Form,
  submitHandlerProp: "onFinish",
});
