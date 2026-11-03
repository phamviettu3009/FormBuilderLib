import type { FormAction, FormBuilderSchema } from "../core/form/FormBuilder";
import { SchemaExtractor } from "../core/schema-extractor";
import { resolveFieldMappings } from "../core/field-mapper";
import { pluginRegistry } from "../core/plugin-registry";
import { Validator } from "../core/validator/validator";
import { additionalPlaygroundForms } from "./validation-playground-extra";

export interface ValidationProbe {
  label: string;
  field: string;
  value: unknown;
  values?: Record<string, unknown>;
  shouldPass: boolean;
}

export interface PlaygroundForm {
  id: string;
  number: string;
  title: string;
  summary: string;
  coverage: string[];
  schema: FormBuilderSchema;
  mapper?: Record<string, unknown>;
  probes: ValidationProbe[];
  transitions?: Record<string, string>;
  optionReplacement?: {
    field: string;
    options: Array<{ label: string; value: string | number | boolean }>;
  };
}

export interface ProbeResult extends ValidationProbe {
  passed: boolean;
  actualPass: boolean;
  error?: string;
}

export interface FormTestResult {
  formId: string;
  passed: boolean;
  checks: ProbeResult[];
  components: string[];
  missingComponents: string[];
}

export interface ValidationSuiteResult {
  forms: FormTestResult[];
  passedForms: number;
  totalForms: number;
  coveredRules: string[];
  missingRules: string[];
  totalRules: number;
  coveredComponents: string[];
  missingComponents: string[];
  totalComponents: number;
}

const validation = (
  rule: string,
  message: string,
  value?: unknown,
) => ({ rule, ...(value === undefined ? {} : { value }), message });

const probe = (
  label: string,
  field: string,
  value: unknown,
  shouldPass: boolean,
  values?: Record<string, unknown>,
): ValidationProbe => ({ label, field, value, shouldPass, values });

function standardActions(id: string): FormAction[] {
  return [
    {
      id: `submit-${id}`,
      type: "submit",
      useComponent: "button",
      label: "Gửi dữ liệu",
      placement: "primary",
      validateBeforeRun: true,
      loadingWhileSubmitting: true,
    },
    {
      id: `reset-${id}`,
      type: "reset",
      useComponent: "button",
      label: "Đặt lại",
      placement: "secondary",
    },
  ];
}

function makeSingleSchema(
  id: string,
  title: string,
  description: string,
  fields: FormBuilderSchema["fields"],
  fieldNames: string[],
  options: {
    labelPosition?: "top" | "left";
    direction?: "horizontal" | "vertical";
    columns?: number;
    actions?: FormAction[];
  } = {},
): FormBuilderSchema {
  const actions = options.actions ?? standardActions(id);
  return {
    id,
    version: 1,
    formType: "antd-form",
    title,
    description,
    layout: {
      labelPosition: options.labelPosition ?? "top",
      gutter: 18,
      groups: [
        {
          id: `${id}-main`,
          title,
          sections: [
            {
              id: `${id}-fields`,
              title: "Thông tin",
              description,
              layout: {
                direction: options.direction ?? "horizontal",
                columns: options.columns ?? 2,
                gutter: 18,
              },
              fields: [
                ...fieldNames.map((name) => ({ name })),
                ...actions.map((action) => ({
                  type: "action" as const,
                  name: action.id,
                })),
              ],
            },
          ],
        },
      ],
    },
    fields,
    actions,
  };
}

const approvedReference = (value: unknown): boolean =>
  typeof value === "string" && /^[A-Z]{2}-\d{2}$/.test(value);

const basePlaygroundForms: PlaygroundForm[] = [
  {
    id: "contact",
    number: "01",
    title: "Hồ sơ liên hệ",
    summary: "Thông tin người đăng ký và dữ liệu liên hệ tùy chọn.",
    coverage: [
      "required, stringMin, stringMax, email, phone",
      "Live validation: onChange và onBlur, có debounce",
      "Giá trị trống được bỏ qua ở email/phone khi không bắt buộc",
      "Props, placeholder, required indicator, submit và reset",
    ],
    schema: makeSingleSchema(
      "contact",
      "Hồ sơ liên hệ",
      "Thông tin người đăng ký và dữ liệu liên hệ tùy chọn.",
      {
        fullName: {
          useComponent: "input",
          label: "Họ và tên",
          placeholder: "Nguyễn Minh An",
          required: true,
          value: "Minh An",
          liveValidation: { active: true, debounce: 180, trigger: "onChange" },
          validations: [
            validation("required", "Hãy nhập họ tên."),
            validation("stringMin", "Họ tên cần ít nhất 2 ký tự.", 2),
            validation("stringMax", "Họ tên tối đa 40 ký tự.", 40),
          ],
        },
        email: {
          useComponent: "input",
          label: "Email (không bắt buộc)",
          placeholder: "an@example.com",
          props: { type: "email" },
          value: "an@example.com",
          liveValidation: { active: true, debounce: 220, trigger: "onBlur" },
          validations: [validation("email", "Email chưa đúng định dạng.")],
        },
        phone: {
          useComponent: "input",
          label: "Điện thoại (không bắt buộc)",
          placeholder: "0912345678",
          props: { type: "tel" },
          value: "0912345678",
          liveValidation: { active: true, debounce: 180, trigger: "onBlur" },
          validations: [validation("phone", "Số điện thoại chưa hợp lệ.")],
        },
      },
      ["fullName", "email", "phone"],
    ),
    probes: [
      probe("required chấp nhận nội dung", "fullName", "Minh An", true),
      probe("required từ chối rỗng", "fullName", "", false),
      probe("stringMin từ chối quá ngắn", "fullName", "A", false),
      probe("stringMax từ chối quá dài", "fullName", "A".repeat(41), false),
      probe("email chấp nhận hợp lệ", "email", "a@example.com", true),
      probe("email bỏ qua chuỗi rỗng", "email", "", true),
      probe("email từ chối định dạng sai", "email", "not-an-email", false),
      probe("phone chấp nhận số VN", "phone", "0912345678", true),
      probe("phone bỏ qua chuỗi rỗng", "phone", "", true),
      probe("phone từ chối số sai", "phone", "123", false),
    ],
  },
  {
    id: "numbers",
    number: "02",
    title: "Kết quả & chỉ số",
    summary: "Ràng buộc số bao gồm/không bao gồm và kiểu dữ liệu.",
    coverage: [
      "typeError, min, max, lessThan, moreThan",
      "positive, negative, integer",
      "Numeric input component; kiểm tra cả number và integer",
      "Section ngang với các field độc lập",
    ],
    schema: makeSingleSchema(
      "numbers",
      "Kết quả & chỉ số",
      "Ràng buộc số bao gồm/không bao gồm và kiểu dữ liệu.",
      {
        score: {
          useComponent: "numeric",
          label: "Điểm tổng",
          value: 74,
          props: { min: 0, max: 100, precision: 0 },
          validations: [
            validation("typeError", "Điểm phải là số nguyên.", "integer"),
            validation("min", "Điểm tối thiểu là 0.", 0),
            validation("max", "Điểm tối đa là 100.", 100),
          ],
        },
        underLimit: {
          useComponent: "numeric",
          label: "Nhỏ hơn 10",
          value: 8,
          validations: [validation("lessThan", "Giá trị phải nhỏ hơn 10.", 10)],
        },
        overLimit: {
          useComponent: "numeric",
          label: "Lớn hơn 5",
          value: 6,
          validations: [validation("moreThan", "Giá trị phải lớn hơn 5.", 5)],
        },
        profit: {
          useComponent: "numeric",
          label: "Lợi nhuận",
          value: 12,
          validations: [validation("positive", "Giá trị phải dương.")],
        },
        loss: {
          useComponent: "numeric",
          label: "Chênh lệch âm",
          value: -4,
          validations: [validation("negative", "Giá trị phải âm.")],
        },
        whole: {
          useComponent: "numeric",
          label: "Số nguyên",
          value: 4,
          validations: [validation("integer", "Cần nhập số nguyên.")],
        },
      },
      ["score", "underLimit", "overLimit", "profit", "loss", "whole"],
    ),
    probes: [
      probe("typeError nhận số nguyên", "score", 74, true),
      probe("typeError từ chối chuỗi số", "score", "74", false),
      probe("min từ chối dưới ngưỡng", "score", -1, false),
      probe("max từ chối trên ngưỡng", "score", 101, false),
      probe("lessThan nhận 9", "underLimit", 9, true),
      probe("lessThan từ chối đúng 10", "underLimit", 10, false),
      probe("moreThan nhận 6", "overLimit", 6, true),
      probe("moreThan từ chối đúng 5", "overLimit", 5, false),
      probe("positive nhận số dương", "profit", 1, true),
      probe("positive từ chối 0", "profit", 0, false),
      probe("negative nhận số âm", "loss", -1, true),
      probe("negative từ chối 0", "loss", 0, false),
      probe("integer nhận số nguyên", "whole", 4, true),
      probe("integer từ chối số thập phân", "whole", 4.5, false),
    ],
  },
  {
    id: "choices",
    number: "03",
    title: "Tùy chọn & trạng thái",
    summary: "Tập giá trị cho phép, giá trị bị cấm và quy tắc null/undefined.",
    coverage: [
      "oneOf, notOneOf, booleanRequired",
      "defined, nonNullable",
      "options tĩnh; checkbox chấp nhận false khi chỉ yêu cầu boolean đã được cung cấp",
      "Cùng schema thể hiện validations bằng rule và type",
    ],
    schema: makeSingleSchema(
      "choices",
      "Tùy chọn & trạng thái",
      "Tập giá trị cho phép, giá trị bị cấm và quy tắc null/undefined.",
      {
        plan: {
          useComponent: "select",
          label: "Gói dịch vụ",
          value: "starter",
          options: [
            { label: "Starter", value: "starter" },
            { label: "Studio", value: "studio" },
            { label: "Enterprise", value: "enterprise" },
          ],
          validations: [
            validation("oneOf", "Chọn một gói trong danh sách.", [
              "starter",
              "studio",
              "enterprise",
            ]),
          ],
        },
        handle: {
          useComponent: "input",
          label: "Tên tài khoản",
          value: "minhan",
          validations: [
            validation("notOneOf", "Tên này đã được dành riêng.", [
              "admin",
              "root",
            ]),
          ],
        },
        accepted: {
          useComponent: "checkbox",
          label: "Đã xác nhận trạng thái",
          value: false,
          validations: [
            validation("booleanRequired", "Cần cung cấp trạng thái boolean."),
          ],
        },
        declared: {
          useComponent: "input",
          label: "Giá trị phải được khai báo",
          value: "",
          validations: [
            { type: "defined", message: "Giá trị không được undefined." },
          ],
        },
        nonNull: {
          useComponent: "input",
          label: "Giá trị không được null",
          value: "đã nhập",
          validations: [
            validation("nonNullable", "Giá trị không được null."),
          ],
        },
      },
      ["plan", "handle", "accepted", "declared", "nonNull"],
    ),
    probes: [
      probe("oneOf nhận phần tử được phép", "plan", "studio", true),
      probe("oneOf từ chối phần tử ngoài tập", "plan", "custom", false),
      probe("notOneOf nhận tên thường", "handle", "minhan", true),
      probe("notOneOf từ chối admin", "handle", "admin", false),
      probe("booleanRequired chấp nhận false", "accepted", false, true),
      probe("booleanRequired từ chối null", "accepted", null, false),
      probe("defined chấp nhận null", "declared", null, true),
      probe("defined từ chối undefined", "declared", undefined, false),
      probe("nonNullable chấp nhận undefined theo implementation hiện tại", "nonNull", undefined, true),
      probe("nonNullable từ chối null", "nonNull", null, false),
    ],
  },
  {
    id: "calendar",
    number: "04",
    title: "Ngày & định danh",
    summary: "Ngày hợp lệ, giới hạn thời gian, ISO datetime và UUID.",
    coverage: [
      "date, dateMin, dateMax, datetime, uuid",
      "Input native date và text field theo props của component",
      "Giới hạn ngày gồm cả giá trị min/max",
      "Rule date chấp nhận Date, chuỗi parse được và đối tượng isValid-compatible",
    ],
    schema: makeSingleSchema(
      "calendar",
      "Ngày & định danh",
      "Ngày hợp lệ, giới hạn thời gian, ISO datetime và UUID.",
      {
        birthDate: {
          useComponent: "input",
          label: "Ngày sinh",
          props: { type: "date" },
          value: "2000-05-12",
          validations: [validation("date", "Ngày không hợp lệ.")],
        },
        bookingDate: {
          useComponent: "input",
          label: "Ngày đặt lịch",
          props: { type: "date" },
          value: "2026-06-15",
          validations: [
            validation("dateMin", "Ngày phải từ 2025 trở đi.", "2025-01-01"),
            validation("dateMax", "Ngày phải trước hoặc trong năm 2027.", "2027-12-31"),
          ],
        },
        timestamp: {
          useComponent: "input",
          label: "Thời điểm ISO",
          placeholder: "2026-06-15T10:30:00Z",
          value: "2026-06-15T10:30:00Z",
          validations: [validation("datetime", "Cần ISO datetime có timezone.")],
        },
        recordId: {
          useComponent: "input",
          label: "UUID",
          value: "550e8400-e29b-41d4-a716-446655440000",
          validations: [validation("uuid", "UUID không hợp lệ.")],
        },
      },
      ["birthDate", "bookingDate", "timestamp", "recordId"],
    ),
    probes: [
      probe("date nhận ngày ISO", "birthDate", "2000-05-12", true),
      probe("date từ chối ngày sai", "birthDate", "31/31/2026", false),
      probe("dateMin nhận ngày sau min", "bookingDate", "2026-06-15", true),
      probe("dateMin từ chối ngày trước min", "bookingDate", "2024-12-31", false),
      probe("dateMax từ chối ngày sau max", "bookingDate", "2028-01-01", false),
      probe("datetime nhận ISO có timezone", "timestamp", "2026-06-15T10:30:00Z", true),
      probe("datetime từ chối ngày thiếu timezone", "timestamp", "2026-06-15T10:30:00", false),
      probe("uuid nhận UUID v4", "recordId", "550e8400-e29b-41d4-a716-446655440000", true),
      probe("uuid từ chối chuỗi thường", "recordId", "not-a-uuid", false),
    ],
  },
  {
    id: "text-patterns",
    number: "05",
    title: "Mã & đường dẫn",
    summary: "Độ dài chính xác, regex và URL có giao thức an toàn.",
    coverage: [
      "stringLength, matches, url",
      "Một field ghép nhiều validations theo thứ tự",
      "Props maxLength và placeholder",
      "Regex được truyền qua validation.value",
    ],
    schema: makeSingleSchema(
      "text-patterns",
      "Mã & đường dẫn",
      "Độ dài chính xác, regex và URL có giao thức an toàn.",
      {
        campaignCode: {
          useComponent: "input",
          label: "Mã chiến dịch",
          placeholder: "ABC-12",
          props: { maxLength: 6, autoCapitalize: "characters" },
          value: "ABC-12",
          validations: [
            validation("stringLength", "Mã cần đúng 6 ký tự.", 6),
            validation("matches", "Dùng định dạng ABC-12.", "^[A-Z]{3}-\\d{2}$"),
          ],
        },
        website: {
          useComponent: "input",
          label: "Website",
          placeholder: "https://example.com",
          props: { type: "url" },
          value: "https://example.com",
          validations: [validation("url", "URL cần dùng http hoặc https.")],
        },
      },
      ["campaignCode", "website"],
      { columns: 1, direction: "vertical" },
    ),
    probes: [
      probe("stringLength nhận đúng độ dài", "campaignCode", "ABC-12", true),
      probe("stringLength từ chối thiếu ký tự", "campaignCode", "AB-12", false),
      probe("matches nhận pattern hợp lệ", "campaignCode", "XYZ-99", true),
      probe("matches từ chối sai pattern", "campaignCode", "abc-12", false),
      probe("url nhận HTTPS", "website", "https://example.com/path", true),
      probe("url từ chối giao thức không an toàn", "website", "javascript:alert(1)", false),
    ],
  },
  {
    id: "collections",
    number: "06",
    title: "Danh sách lựa chọn",
    summary: "Kiểm tra mảng, số lượng phần tử và kiểu của từng phần tử.",
    coverage: [
      "arrayRequired, arrayMin, arrayMax, arrayLength, arrayOf",
      "Select multiple với option tĩnh và giá trị number",
      "arrayOf gọi rule con integer trên từng item",
      "Min/max/length bỏ qua null và undefined theo từng rule",
    ],
    schema: makeSingleSchema(
      "collections",
      "Danh sách lựa chọn",
      "Kiểm tra mảng, số lượng phần tử và kiểu của từng phần tử.",
      {
        topics: {
          useComponent: "select",
          label: "Chủ đề",
          value: ["forms", "testing"],
          props: { mode: "multiple", placeholder: "Chọn 2 đến 4 chủ đề" },
          options: [
            { label: "Forms", value: "forms" },
            { label: "Testing", value: "testing" },
            { label: "React", value: "react" },
            { label: "Schema", value: "schema" },
          ],
          validations: [
            validation("arrayRequired", "Giá trị cần là một danh sách."),
            validation("arrayMin", "Chọn ít nhất 2 chủ đề.", 2),
            validation("arrayMax", "Chọn tối đa 4 chủ đề.", 4),
          ],
        },
        fixedTopics: {
          useComponent: "select",
          label: "Đúng 3 chủ đề",
          value: ["forms", "react", "schema"],
          props: { mode: "multiple" },
          options: [
            { label: "Forms", value: "forms" },
            { label: "React", value: "react" },
            { label: "Schema", value: "schema" },
          ],
          validations: [
            validation("arrayLength", "Cần đúng 3 lựa chọn.", 3),
          ],
        },
        integerList: {
          useComponent: "select",
          label: "Danh sách số nguyên",
          value: [1, 2],
          props: { mode: "multiple" },
          options: [
            { label: "1", value: 1 },
            { label: "2", value: 2 },
            { label: "2.5", value: 2.5 },
          ],
          validations: [
            validation("arrayOf", "Mỗi phần tử cần là số nguyên.", {
              rule: "integer",
            }),
          ],
        },
      },
      ["topics", "fixedTopics", "integerList"],
    ),
    probes: [
      probe("arrayRequired chấp nhận mảng", "topics", ["forms", "testing"], true),
      probe("arrayRequired từ chối chuỗi", "topics", "forms", false),
      probe("arrayMin chấp nhận đủ số lượng", "topics", ["forms", "react"], true),
      probe("arrayMin từ chối thiếu phần tử", "topics", ["forms"], false),
      probe("arrayMax chấp nhận giới hạn", "topics", ["a", "b", "c", "d"], true),
      probe("arrayMax từ chối quá giới hạn", "topics", ["a", "b", "c", "d", "e"], false),
      probe("arrayLength nhận đúng 3 phần tử", "fixedTopics", [1, 2, 3], true),
      probe("arrayLength từ chối 2 phần tử", "fixedTopics", [1, 2], false),
      probe("arrayOf nhận các số nguyên", "integerList", [1, 2, 3], true),
      probe("arrayOf từ chối phần tử thập phân", "integerList", [1, 2.5], false),
    ],
  },
  {
    id: "objects",
    number: "07",
    title: "Hồ sơ có cấu trúc",
    summary: "Validate shape của object và danh sách key được phép.",
    coverage: [
      "objectShape, noUnknown, stringMin, integer",
      "JSON editor cập nhật object thực, không validate chuỗi JSON",
      "Shape kiểm tra rule lồng theo từng key",
      "noUnknown nhận danh sách key hợp lệ",
    ],
    schema: makeSingleSchema(
      "objects",
      "Hồ sơ có cấu trúc",
      "Validate shape của object và danh sách key được phép.",
      {
        profile: {
          useComponent: "json-editor",
          label: "Hồ sơ JSON",
          value: { name: "Linh", age: 28 },
          validations: [
            validation("objectShape", "Tên hoặc tuổi trong hồ sơ chưa hợp lệ.", {
              name: { rule: "stringMin", value: 2 },
              age: { rule: "integer" },
            }),
          ],
        },
        metadata: {
          useComponent: "json-editor",
          label: "Metadata cho phép source/campaign",
          value: { source: "newsletter" },
          validations: [
            validation("noUnknown", "Metadata có key không được hỗ trợ.", [
              "source",
              "campaign",
            ]),
          ],
        },
      },
      ["profile", "metadata"],
      { columns: 1, direction: "vertical" },
    ),
    probes: [
      probe("objectShape nhận đủ shape hợp lệ", "profile", { name: "Linh", age: 28 }, true),
      probe("objectShape từ chối field lồng sai", "profile", { name: "L", age: 28 }, false),
      probe("objectShape từ chối age không nguyên", "profile", { name: "Linh", age: 28.5 }, false),
      probe("noUnknown nhận key được khai báo", "metadata", { source: "web", campaign: "spring" }, true),
      probe("noUnknown từ chối key lạ", "metadata", { source: "web", debug: true }, false),
    ],
  },
  {
    id: "conditional-validation",
    number: "08",
    title: "Đăng ký theo điều kiện",
    summary: "Rule phụ thuộc field khác và callback kiểm tra tùy chỉnh.",
    coverage: [
      "when với nhánh then/otherwise và rule lồng stringMin",
      "test với callback đồng bộ nhận value và toàn bộ values",
      "Select tĩnh, validation.value dạng object và function",
      "Nhánh điều kiện được kiểm tra bằng nhiều bộ values",
    ],
    schema: makeSingleSchema(
      "conditional-validation",
      "Đăng ký theo điều kiện",
      "Mã số thuế có yêu cầu khác nhau theo loại hồ sơ.",
      {
        accountType: {
          useComponent: "select",
          label: "Loại hồ sơ",
          value: "business",
          options: [
            { label: "Doanh nghiệp", value: "business" },
            { label: "Cá nhân", value: "personal" },
          ],
        },
        taxCode: {
          useComponent: "input",
          label: "Mã hồ sơ",
          value: "AB123456",
          validations: [
            validation("when", "Mã hồ sơ chưa đủ độ dài theo loại.", {
              field: "accountType",
              is: "business",
              then: { rule: "stringMin", value: 8 },
              otherwise: { rule: "stringMin", value: 3 },
            }),
          ],
        },
        reference: {
          useComponent: "input",
          label: "Mã tham chiếu nội bộ",
          placeholder: "AB-12",
          value: "AB-12",
          validations: [
            validation("test", "Mã tham chiếu cần theo dạng AB-12.", approvedReference),
          ],
        },
      },
      ["accountType", "taxCode", "reference"],
    ),
    probes: [
      probe("when then: doanh nghiệp đủ độ dài", "taxCode", "AB123456", true, { accountType: "business" }),
      probe("when then: doanh nghiệp thiếu độ dài", "taxCode", "AB12", false, { accountType: "business" }),
      probe("when otherwise: cá nhân đủ độ dài", "taxCode", "ABC", true, { accountType: "personal" }),
      probe("test nhận callback hợp lệ", "reference", "AB-12", true),
      probe("test từ chối callback sai", "reference", "ab-12", false),
    ],
  },
  {
    id: "field-conditions",
    number: "09",
    title: "Điều kiện hiển thị field",
    summary: "Các operator và action thay đổi trạng thái field theo values.",
    coverage: [
      "Operator: equals, notEquals, in, exists, lessThan, greaterThan, lessThanOrEqual, greaterThanOrEqual",
      "Action: hide, remove, disable, focus, resetValue, ignoreValidation",
      "Field bị remove không xuất hiện trong values submit; hidden vẫn mounted",
      "Reset target dùng lại giá trị ban đầu khi điều kiện chuyển sang true",
    ],
    schema: makeSingleSchema(
      "field-conditions",
      "Điều kiện hiển thị field",
      "Thử điều kiện trên chế độ, quyền truy cập, dữ liệu và ngưỡng số.",
      {
        mode: {
          useComponent: "select",
          label: "Chế độ",
          value: "visible",
          options: [
            { label: "Hiện", value: "visible" },
            { label: "Ẩn", value: "hidden" },
            { label: "Thành viên", value: "member" },
            { label: "Khách", value: "guest" },
          ],
        },
        accessCode: {
          useComponent: "input",
          label: "Mã truy cập (exists)",
          value: undefined,
          placeholder: "Nhập để bật trạng thái exists",
        },
        amount: {
          useComponent: "numeric",
          label: "Giá trị điều kiện",
          value: 6,
        },
        skipChecks: {
          useComponent: "checkbox",
          label: "Bỏ qua validation của field được chọn",
          value: false,
        },
        resetSwitch: {
          useComponent: "checkbox",
          label: "Bật để reset field về giá trị ban đầu",
          value: false,
        },
        equalsTarget: {
          useComponent: "input",
          label: "Ẩn khi mode equals hidden",
          value: "always visible otherwise",
          when: [
            { name: "mode", operator: "equals", value: "hidden", action: { display: "hide" } },
          ],
        },
        notEqualsTarget: {
          useComponent: "input",
          label: "Ẩn khi mode notEquals visible",
          value: "visible only in visible mode",
          when: [
            { name: "mode", operator: "notEquals", value: "visible", action: { display: "hide" } },
          ],
        },
        inTarget: {
          useComponent: "input",
          label: "Remove khi mode thuộc member/guest",
          value: "removed from submit values",
          when: [
            { name: "mode", operator: "in", value: ["member", "guest"], action: { display: "remove" } },
          ],
        },
        existsTarget: {
          useComponent: "input",
          label: "Disable khi accessCode exists",
          value: "locked when code is present",
          when: [
            { name: "accessCode", operator: "exists", action: { disable: true } },
          ],
        },
        lessTarget: {
          useComponent: "input",
          label: "Disable khi amount < 3",
          value: "threshold field",
          when: [
            { name: "amount", operator: "lessThan", value: 3, action: { disable: true } },
          ],
        },
        greaterTarget: {
          useComponent: "input",
          label: "Focus khi amount > 8",
          value: "focus target",
          when: [
            { name: "amount", operator: "greaterThan", value: 8, action: { focus: true } },
          ],
        },
        lessEqualTarget: {
          useComponent: "input",
          label: "Ẩn khi amount <= 4",
          value: "inclusive lower condition",
          when: [
            { name: "amount", operator: "lessThanOrEqual", value: 4, action: { display: "hide" } },
          ],
        },
        greaterEqualTarget: {
          useComponent: "input",
          label: "Bỏ qua validation khi amount >= 9",
          value: "inclusive upper condition",
          validations: [validation("required", "Field này yêu cầu giá trị.")],
          when: [
            { name: "amount", operator: "greaterThanOrEqual", value: 9, action: { ignoreValidation: true } },
          ],
        },
        resetTarget: {
          useComponent: "input",
          label: "Giá trị được reset",
          value: "original value",
          when: [
            { name: "resetSwitch", operator: "equals", value: true, action: { resetValue: true } },
          ],
        },
        skippedTarget: {
          useComponent: "input",
          label: "Validation được bỏ qua theo checkbox",
          value: "present",
          validations: [validation("required", "Giá trị cần có khi không skip.")],
          when: [
            { name: "skipChecks", operator: "equals", value: true, action: { ignoreValidation: true } },
          ],
        },
      },
      [
        "mode",
        "accessCode",
        "amount",
        "skipChecks",
        "resetSwitch",
        "equalsTarget",
        "notEqualsTarget",
        "inTarget",
        "existsTarget",
        "lessTarget",
        "greaterTarget",
        "lessEqualTarget",
        "greaterEqualTarget",
        "resetTarget",
        "skippedTarget",
      ],
      { columns: 2 },
    ),
    probes: [
      probe("required của field condition pass", "skippedTarget", "present", true),
      probe("required của field condition fail", "skippedTarget", "", false),
    ],
  },
  {
    id: "workflow",
    number: "10",
    title: "Đăng ký nhiều bước",
    summary: "Luồng nhiều group, mapper options, validation theo group và submit có confirm.",
    coverage: [
      "Nhiều group/section, labelPosition left, layout dọc/ngang",
      "Options lấy từ @options.interests và thay được bằng FormControl.field.setOptions",
      "Custom next/back, reset, submit, validationGroups, confirm, loadingWhileSubmitting",
      "Form id/version/title/description, static value và mapper values",
    ],
    schema: {
      id: "workflow",
      version: 3,
      formType: "antd-form",
      title: "Đăng ký chương trình",
      description: "Thông tin được chia thành hai bước; mỗi bước có validation riêng.",
      layout: {
        labelPosition: "left",
        gutter: 20,
        groups: [
          {
            id: "requester",
            title: "Người đăng ký",
            sections: [
              {
                id: "requester-details",
                title: "Liên hệ",
                description: "Bước một chỉ kiểm tra thông tin liên hệ.",
                layout: { direction: "vertical", gutter: 14 },
                fields: [
                  { name: "requesterName" },
                  { name: "requesterEmail" },
                  { name: "interests" },
                  { type: "action", name: "continue-requester" },
                  { type: "action", name: "reset-workflow" },
                ],
              },
            ],
          },
          {
            id: "program-details",
            title: "Chương trình",
            sections: [
              {
                id: "program-details-fields",
                title: "Thông tin lựa chọn",
                description: "Bước cuối xác nhận lựa chọn và gửi hồ sơ.",
                layout: { direction: "horizontal", columns: 2, gutter: 18 },
                fields: [
                  { name: "organization" },
                  { name: "seats" },
                  { type: "action", name: "back-requester" },
                  { type: "action", name: "submit-workflow" },
                ],
              },
            ],
          },
        ],
      },
      fields: {
        requesterName: {
          useComponent: "input",
          label: "Người liên hệ",
          required: "@ui.nameRequired",
          placeholder: "@ui.namePlaceholder",
          value: "@values.requesterName",
          validations: [
            validation("required", "Nhập người liên hệ."),
            validation("stringMin", "@messages.nameMin", "@values.min"),
          ],
        },
        requesterEmail: {
          useComponent: "input",
          label: "Email công việc",
          required: true,
          placeholder: "name@example.com",
          value: "an@example.com",
          liveValidation: { active: true, trigger: "onBlur", debounce: 120 },
          validations: [
            validation("required", "Nhập email công việc."),
            validation("email", "Email công việc chưa hợp lệ."),
          ],
        },
        interests: {
          useComponent: "select",
          label: "Chủ đề quan tâm",
          value: "schema",
          options: "@options.interests",
          validations: [
            validation("oneOf", "Chọn một chủ đề trong danh sách.", [
              "schema",
              "design",
              "testing",
            ]),
          ],
        },
        organization: {
          useComponent: "input",
          label: "Đơn vị",
          placeholder: "Tên đơn vị",
          value: "Studio North",
          validations: [validation("stringMin", "Tên đơn vị cần 2 ký tự.", 2)],
        },
        seats: {
          useComponent: "numeric",
          label: "Số chỗ",
          value: 2,
          props: { min: "@limits.minSeats", max: "@limits.maxSeats", precision: 0 },
          validations: [
            validation("integer", "Số chỗ phải là số nguyên."),
            validation("min", "Cần ít nhất 1 chỗ.", "@limits.minSeats"),
            validation("max", "Tối đa 20 chỗ.", "@limits.maxSeats"),
          ],
        },
      },
      actions: [
        {
          id: "continue-requester",
          type: "custom",
          useComponent: "button",
          label: "Tiếp tục",
          placement: "primary",
          validateBeforeRun: true,
          validationGroups: ["requester"],
        },
        {
          id: "back-requester",
          type: "custom",
          useComponent: "button",
          label: "Quay lại",
          placement: "secondary",
        },
        {
          id: "reset-workflow",
          type: "reset",
          useComponent: "button",
          label: "Đặt lại",
          placement: "secondary",
        },
        {
          id: "submit-workflow",
          type: "submit",
          useComponent: "button",
          label: "Xác nhận đăng ký",
          placement: "primary",
          validateBeforeRun: true,
          validationGroups: ["requester", "program-details"],
          loadingWhileSubmitting: true,
          confirm: {
            title: "Gửi đăng ký?",
            description: "Thông tin sẽ được gửi để xử lý.",
          },
        },
      ],
    },
    mapper: {
      values: { requesterName: "Minh An", min: 2 },
      ui: { nameRequired: true, namePlaceholder: "Tên người liên hệ" },
      messages: { nameMin: "Tên người liên hệ cần ít nhất 2 ký tự." },
      limits: { minSeats: 1, maxSeats: 20 },
      options: {
        interests: [
          { label: "Schema", value: "schema" },
          { label: "Design systems", value: "design" },
          { label: "Testing", value: "testing" },
        ],
      },
    },
    transitions: {
      "continue-requester": "program-details",
      "back-requester": "requester",
    },
    optionReplacement: {
      field: "interests",
      options: [
        { label: "Rule engine", value: "schema" },
        { label: "Accessibility", value: "design" },
        { label: "Browser QA", value: "testing" },
      ],
    },
    probes: [
      probe("required nhận tên", "requesterName", "Minh An", true),
      probe("required từ chối tên trống", "requesterName", "", false),
      probe("mapped stringMin nhận đủ ký tự", "requesterName", "An", true),
      probe("mapped stringMin từ chối tên ngắn", "requesterName", "A", false),
      probe("email công việc nhận địa chỉ hợp lệ", "requesterEmail", "an@example.com", true),
      probe("mapper option hợp lệ", "interests", "testing", true),
      probe("mapper option ngoài tập bị từ chối", "interests", "unknown", false),
      probe("integer/min/max nhận số chỗ hợp lệ", "seats", 2, true),
      probe("integer từ chối số chỗ thập phân", "seats", 2.5, false),
      probe("min từ chối 0 chỗ", "seats", 0, false),
      probe("max từ chối quá 20 chỗ", "seats", 21, false),
    ],
  },
];

export const playgroundForms: PlaygroundForm[] = [
  ...basePlaygroundForms,
  ...additionalPlaygroundForms,
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function collectNestedRuleNames(value: unknown, rules: Set<string>): void {
  if (Array.isArray(value)) {
    value.forEach((item) => collectNestedRuleNames(item, rules));
    return;
  }
  if (!isRecord(value)) {
    return;
  }
  if (typeof value.rule === "string") {
    collectRuleName(value.rule, value.value, rules);
  }
  Object.values(value).forEach((item) => collectNestedRuleNames(item, rules));
}

function collectRuleName(
  name: string,
  value: unknown,
  rules: Set<string>,
): void {
  rules.add(name);
  if (name === "when" || name === "arrayOf" || name === "objectShape") {
    collectNestedRuleNames(value, rules);
  }
}

export function collectPlaygroundRuleNames(): Set<string> {
  const rules = new Set<string>();
  for (const form of playgroundForms) {
    for (const field of Object.values(resolveFieldMappings(form.schema.fields, form.mapper))) {
      for (const item of field.validations ?? []) {
        const name = item.rule ?? item.type;
        if (name) {
          collectRuleName(name, item.value, rules);
        }
      }
    }
  }
  return rules;
}

function getFormComponentNames(form: PlaygroundForm): Set<string> {
  const names = new Set(
    Object.values(resolveFieldMappings(form.schema.fields, form.mapper)).map((field) => field.useComponent),
  );
  for (const action of form.schema.actions ?? []) {
    names.add(action.useComponent);
  }
  return names;
}

export function collectPlaygroundComponentNames(): Set<string> {
  return new Set(playgroundForms.flatMap((form) => [...getFormComponentNames(form)]));
}

export function runValidationSuite(): ValidationSuiteResult {
  const registeredRules = new Set(
    pluginRegistry.getAllPlugins("validation").map((item) => item.name),
  );
  const coveredRules = collectPlaygroundRuleNames();
  const requiredRules = [...registeredRules].sort();
  const missingRules = requiredRules.filter((name) => !coveredRules.has(name));
  const registeredComponents = new Set(
    pluginRegistry.getAllPlugins("component").map((item) => item.name),
  );
  const coveredComponents = collectPlaygroundComponentNames();
  const missingComponents = [...registeredComponents]
    .filter((name) => !coveredComponents.has(name))
    .sort();

  const forms = playgroundForms.map((form): FormTestResult => {
    const extractor = new SchemaExtractor(form.schema, form.mapper);
    const validator = new Validator(extractor);
    const components = [...getFormComponentNames(form)].sort();
    const unregisteredComponents = components.filter(
      (name) => !registeredComponents.has(name),
    );
    const checks = form.probes.map((item): ProbeResult => {
      const field = extractor.fields.find((candidate) => candidate.name === item.field);
      if (!field) {
        return { ...item, passed: false, actualPass: false, error: "Field not found in schema." };
      }
      try {
        const values = { ...(item.values ?? {}), [item.field]: item.value };
        const error = validator.getFieldError(field, item.value, values);
        const actualPass = error === undefined;
        return {
          ...item,
          actualPass,
          passed: actualPass === item.shouldPass,
          error,
        };
      } catch (error) {
        return {
          ...item,
          passed: false,
          actualPass: false,
          error: error instanceof Error ? error.message : "Unknown rule error.",
        };
      }
    });
    return {
      formId: form.id,
      passed:
        checks.every((check) => check.passed) &&
        unregisteredComponents.length === 0,
      checks,
      components,
      missingComponents: unregisteredComponents,
    };
  });

  return {
    forms,
    passedForms: forms.filter((form) => form.passed).length,
    totalForms: forms.length,
    coveredRules: [...coveredRules].sort(),
    missingRules,
    totalRules: registeredRules.size,
    coveredComponents: [...coveredComponents].sort(),
    missingComponents,
    totalComponents: registeredComponents.size,
  };
}