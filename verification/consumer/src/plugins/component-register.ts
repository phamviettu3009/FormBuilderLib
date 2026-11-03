import {
  AutoComplete, Button, Calendar, Cascader, Checkbox, ColorPicker,
  DatePicker, Input, InputNumber, Mentions, Radio, Rate, Segmented,
  Select, Slider, Switch, TimePicker, Transfer, TreeSelect, Upload,
} from "antd";
import { pluginRegistry, type ComponentBinding } from "@local/form-builder";
import type { ElementType } from "react";
import AntdWapper from "./components/AntdWapper";

const wrappedComponents: [string, ElementType, ComponentBinding?][] = [
  ["input", Input],
  ["password", Input.Password],
  ["search", Input.Search],
  ["otp", Input.OTP],
  ["textarea", Input.TextArea],
  ["input-number", InputNumber],
  ["select", Select, { supportsOptions: true }],
  ["auto-complete", AutoComplete, { supportsOptions: true }],
  ["mentions", Mentions, { supportsOptions: true }],
  ["tree-select", TreeSelect, { supportsOptions: true }],
  ["cascader", Cascader, { supportsOptions: true }],
  ["date-picker", DatePicker],
  ["date-range-picker", DatePicker.RangePicker],
  ["time-picker", TimePicker],
  ["time-range-picker", TimePicker.RangePicker],
  ["upload", Upload, { valueProp: "fileList", eventValueProp: "fileList" }],
];

for (const [name, child, binding] of wrappedComponents) {
  pluginRegistry.register("component", {
    name,
    class: AntdWapper,
    componentBinding: {
      child,
      invalidProp: "_invalid",
      errorMessageProp: "_errorMessage",
      ...binding,
    },
  });
}

const components: [string, ElementType, ComponentBinding?][] = [
  ["checkbox", Checkbox, { valueProp: "checked", eventValueProp: "checked", labelPosition: "after" }],
  ["checkbox-group", Checkbox.Group, { supportsOptions: true }],
  ["radio", Radio.Group, { supportsOptions: true }],
  ["switch", Switch, { valueProp: "checked" }],
  ["segmented", Segmented, { supportsOptions: true }],
  ["calendar", Calendar],
  ["slider", Slider],
  ["rate", Rate],
  ["color-picker", ColorPicker],
  ["transfer", Transfer, { valueProp: "targetKeys" }],
  ["button", Button, { actionTypeProp: "htmlType" }],
];

for (const [name, component, componentBinding] of components) {
  pluginRegistry.register("component", { name, class: component, componentBinding });
}