import { Form } from "antd";
import { pluginRegistry } from "@local/form-builder";

pluginRegistry.register("form", {
  name: "antd-form",
  class: Form,
  submitHandlerProp: "onFinish",
});