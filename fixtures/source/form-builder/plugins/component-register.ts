import {
  AutoComplete,
  Button,
  Calendar,
  Cascader,
  Checkbox,
  ColorPicker,
  DatePicker,
  Input,
  InputNumber,
  Mentions,
  Radio,
  Rate,
  Segmented,
  Select,
  Slider,
  Switch,
  TimePicker,
  Transfer,
  TreeSelect,
  Upload,
} from "antd";
import { pluginRegistry } from "../core/plugin-registry";
import AntdWapper from "./components/AntdWapper";

pluginRegistry.register("component", {
  name: "input",
  class: AntdWapper,
  componentBinding: {
    child: Input,
    invalidProp: "_invalid",
    errorMessageProp: "_errorMessage",
  },
});

pluginRegistry.register("component", {
  name: "password",
  class: AntdWapper,
  componentBinding: {
    child: Input.Password,
    invalidProp: "_invalid",
    errorMessageProp: "_errorMessage",
  },
});

pluginRegistry.register("component", {
  name: "search",
  class: AntdWapper,
  componentBinding: {
    child: Input.Search,
    invalidProp: "_invalid",
    errorMessageProp: "_errorMessage",
  },
});

pluginRegistry.register("component", {
  name: "otp",
  class: AntdWapper,
  componentBinding: {
    child: Input.OTP,
    invalidProp: "_invalid",
    errorMessageProp: "_errorMessage",
  },
});

pluginRegistry.register("component", {
  name: "textarea",
  class: AntdWapper,
  componentBinding: {
    child: Input.TextArea,
    invalidProp: "_invalid",
    errorMessageProp: "_errorMessage",
  },
});

pluginRegistry.register("component", {
  name: "input-number",
  class: AntdWapper,
  componentBinding: {
    child: InputNumber,
    invalidProp: "_invalid",
    errorMessageProp: "_errorMessage",
  },
});

pluginRegistry.register("component", {
  name: "select",
  class: AntdWapper,
  componentBinding: {
    child: Select,
    invalidProp: "_invalid",
    errorMessageProp: "_errorMessage",
    supportsOptions: true,
  },
});

pluginRegistry.register("component", {
  name: "auto-complete",
  class: AntdWapper,
  componentBinding: {
    child: AutoComplete,
    invalidProp: "_invalid",
    errorMessageProp: "_errorMessage",
    supportsOptions: true,
  },
});

pluginRegistry.register("component", {
  name: "mentions",
  class: AntdWapper,
  componentBinding: {
    child: Mentions,
    invalidProp: "_invalid",
    errorMessageProp: "_errorMessage",
    supportsOptions: true,
  },
});

pluginRegistry.register("component", {
  name: "tree-select",
  class: AntdWapper,
  componentBinding: {
    child: TreeSelect,
    invalidProp: "_invalid",
    errorMessageProp: "_errorMessage",
    supportsOptions: true,
  },
});

pluginRegistry.register("component", {
  name: "cascader",
  class: AntdWapper,
  componentBinding: {
    child: Cascader,
    invalidProp: "_invalid",
    errorMessageProp: "_errorMessage",
    supportsOptions: true,
  },
});

pluginRegistry.register("component", {
  name: "date-picker",
  class: AntdWapper,
  componentBinding: {
    child: DatePicker,
    invalidProp: "_invalid",
    errorMessageProp: "_errorMessage",
  },
});

pluginRegistry.register("component", {
  name: "date-range-picker",
  class: AntdWapper,
  componentBinding: {
    child: DatePicker.RangePicker,
    invalidProp: "_invalid",
    errorMessageProp: "_errorMessage",
  },
});

pluginRegistry.register("component", {
  name: "time-picker",
  class: AntdWapper,
  componentBinding: {
    child: TimePicker,
    invalidProp: "_invalid",
    errorMessageProp: "_errorMessage",
  },
});

pluginRegistry.register("component", {
  name: "time-range-picker",
  class: AntdWapper,
  componentBinding: {
    child: TimePicker.RangePicker,
    invalidProp: "_invalid",
    errorMessageProp: "_errorMessage",
  },
});

pluginRegistry.register("component", {
  name: "upload",
  class: AntdWapper,
  componentBinding: {
    child: Upload,
    invalidProp: "_invalid",
    errorMessageProp: "_errorMessage",
    valueProp: "fileList",
    eventValueProp: "fileList",
  },
});

pluginRegistry.register("component", {
  name: "checkbox",
  class: Checkbox,
  componentBinding: {
    valueProp: "checked",
    eventValueProp: "checked",
    labelPosition: "after",
  },
});

pluginRegistry.register("component", {
  name: "checkbox-group",
  class: Checkbox.Group,
  componentBinding: { supportsOptions: true },
});

pluginRegistry.register("component", {
  name: "radio",
  class: Radio.Group,
  componentBinding: { supportsOptions: true },
});

pluginRegistry.register("component", {
  name: "switch",
  class: Switch,
  componentBinding: { valueProp: "checked" },
});

pluginRegistry.register("component", {
  name: "segmented",
  class: Segmented,
  componentBinding: { supportsOptions: true },
});

pluginRegistry.register("component", {
  name: "calendar",
  class: Calendar,
});

pluginRegistry.register("component", {
  name: "slider",
  class: Slider,
});

pluginRegistry.register("component", {
  name: "rate",
  class: Rate,
});

pluginRegistry.register("component", {
  name: "color-picker",
  class: ColorPicker,
});

pluginRegistry.register("component", {
  name: "transfer",
  class: Transfer,
  componentBinding: { valueProp: "targetKeys" },
});

pluginRegistry.register("component", {
  name: "button",
  class: Button,
  componentBinding: {
    actionTypeProp: "htmlType",
  },
});
