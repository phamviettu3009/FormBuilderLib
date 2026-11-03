import dayjs from "dayjs";
import type { FormAction, FormBuilderSchema } from "../core/form/FormBuilder";
import type { PlaygroundForm, ValidationProbe } from "./validation-playground";

const validation = (rule: string, message: string, value?: unknown) => ({
  rule,
  ...(value === undefined ? {} : { value }),
  message,
});

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
      label: "Lưu biểu mẫu",
      placement: "primary",
      validateBeforeRun: true,
    },
    {
      id: `reset-${id}`,
      type: "reset",
      useComponent: "button",
      label: "Đặt lại",
    },
  ];
}

function makeSchema(
  id: string,
  title: string,
  description: string,
  fields: FormBuilderSchema["fields"],
  fieldNames: string[],
  columns = 2,
): FormBuilderSchema {
  const actions = standardActions(id);
  return {
    id,
    version: 1,
    formType: "antd-form",
    title,
    description,
    layout: {
      labelPosition: "top",
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
              layout: { direction: "horizontal", columns, gutter: 18 },
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

export const additionalPlaygroundForms: PlaygroundForm[] = [
  {
    id: "account-security",
    number: "11",
    title: "Tài khoản an toàn",
    summary: "Mật khẩu xác nhận phụ thuộc mật khẩu chính; hồ sơ có text area.",
    coverage: [
      "Controls: password, input, textarea",
      "required, stringMin, stringMax, matches, email, phone, typeError",
      "defined, nonNullable, test đối chiếu confirmPassword với password",
    ],
    schema: makeSchema(
      "account-security",
      "Tài khoản an toàn",
      "Mật khẩu xác nhận phải giống mật khẩu chính.",
      {
        password: {
          useComponent: "password",
          label: "Mật khẩu",
          value: "FormLab123",
          validations: [
            validation("required", "Nhập mật khẩu."),
            validation("stringMin", "Tối thiểu 8 ký tự.", 8),
            validation("stringMax", "Tối đa 24 ký tự.", 24),
            validation("matches", "Cần có chữ hoa và chữ số.", "^(?=.*[A-Z])(?=.*\\d).+$"),
            validation("typeError", "Mật khẩu cần là chuỗi.", "string"),
          ],
        },
        confirmPassword: {
          useComponent: "password",
          label: "Xác nhận mật khẩu",
          value: "FormLab123",
          validations: [
            validation(
              "test",
              "Hai mật khẩu phải giống nhau.",
              (value: unknown, values: Record<string, unknown>) =>
                value === values.password,
            ),
          ],
        },
        accountEmail: {
          useComponent: "input",
          label: "Email tài khoản",
          value: "qa@example.com",
          validations: [validation("email", "Email không hợp lệ.")],
        },
        recoveryPhone: {
          useComponent: "input",
          label: "Số khôi phục",
          value: "0912345678",
          validations: [validation("phone", "Số điện thoại không hợp lệ.")],
        },
        bio: {
          useComponent: "textarea",
          label: "Ghi chú hồ sơ",
          value: "Tài khoản thử nghiệm",
          props: { rows: 3, maxLength: 180 },
          validations: [validation("stringMax", "Tối đa 180 ký tự.", 180)],
        },
        declared: {
          useComponent: "input",
          label: "Giá trị đã khai báo",
          value: "",
          validations: [validation("defined", "Giá trị phải được khai báo.")],
        },
        nonNull: {
          useComponent: "input",
          label: "Giá trị không null",
          value: "active",
          validations: [validation("nonNullable", "Không chấp nhận null.")],
        },
      },
      ["password", "confirmPassword", "accountEmail", "recoveryPhone", "bio", "declared", "nonNull"],
    ),
    probes: [
      probe("required nhận mật khẩu", "password", "FormLab123", true),
      probe("required từ chối rỗng", "password", "", false),
      probe("stringMin từ chối mật khẩu ngắn", "password", "Ab1", false),
      probe("stringMax từ chối quá dài", "password", "A1".repeat(13), false),
      probe("matches nhận chữ hoa và số", "password", "FormLab123", true),
      probe("matches từ chối thiếu chữ số", "password", "FormLabOnly", false),
      probe("typeError từ chối number", "password", 12345678, false),
      probe("test nhận password trùng", "confirmPassword", "FormLab123", true, { password: "FormLab123" }),
      probe("test từ chối password khác", "confirmPassword", "Another123", false, { password: "FormLab123" }),
      probe("email nhận email hợp lệ", "accountEmail", "qa@example.com", true),
      probe("phone nhận số hợp lệ", "recoveryPhone", "0912345678", true),
      probe("defined nhận chuỗi rỗng", "declared", "", true),
      probe("defined từ chối undefined", "declared", undefined, false),
      probe("nonNullable nhận undefined theo implementation", "nonNull", undefined, true),
      probe("nonNullable từ chối null", "nonNull", null, false),
    ],
  },
  {
    id: "support-verification",
    number: "12",
    title: "Xác minh yêu cầu hỗ trợ",
    summary: "Kênh liên hệ quyết định độ dài OTP; từ khóa được lọc theo danh sách cấm.",
    coverage: [
      "Controls: search, otp, checkbox, select",
      "when thay đổi rule theo channel; oneOf/notOneOf kiểm soát category/query",
      "stringLength xác nhận OTP; validation đọc giá trị field channel",
    ],
    schema: makeSchema(
      "support-verification",
      "Xác minh yêu cầu hỗ trợ",
      "Chọn email hoặc SMS để áp dụng độ dài OTP tương ứng.",
      {
        channel: {
          useComponent: "select",
          label: "Kênh nhận mã",
          value: "sms",
          options: [
            { label: "SMS", value: "sms" },
            { label: "Email", value: "email" },
          ],
          validations: [validation("oneOf", "Chọn SMS hoặc email.", ["sms", "email"])],
        },
        otp: {
          useComponent: "otp",
          label: "Mã xác minh",
          value: "123456",
          validations: [
            validation("when", "Độ dài mã không phù hợp với kênh.", {
              field: "channel",
              is: "sms",
              then: { rule: "stringLength", value: 6 },
              otherwise: { rule: "stringLength", value: 8 },
            }),
          ],
        },
        query: {
          useComponent: "search",
          label: "Từ khóa yêu cầu",
          value: "Không nhận được mã",
          validations: [
            validation("stringMin", "Nhập ít nhất 4 ký tự.", 4),
            validation("notOneOf", "Từ khóa này không được hỗ trợ.", ["spam", "test"]),
          ],
        },
        urgent: {
          useComponent: "checkbox",
          label: "Yêu cầu khẩn",
          value: false,
          validations: [validation("booleanRequired", "Trạng thái khẩn phải được cung cấp.")],
        },
      },
      ["channel", "otp", "query", "urgent"],
    ),
    probes: [
      probe("oneOf nhận SMS", "channel", "sms", true),
      probe("oneOf từ chối fax", "channel", "fax", false),
      probe("when SMS nhận OTP 6 số", "otp", "123456", true, { channel: "sms" }),
      probe("when SMS từ chối OTP 8 số", "otp", "12345678", false, { channel: "sms" }),
      probe("when email nhận OTP 8 số", "otp", "12345678", true, { channel: "email" }),
      probe("notOneOf từ chối spam", "query", "spam", false),
      probe("stringMin từ chối query ngắn", "query", "bug", false),
      probe("booleanRequired nhận false", "urgent", false, true),
    ],
  },
  {
    id: "destination-picker",
    number: "13",
    title: "Điểm đến & nhóm làm việc",
    summary: "Auto-complete, mentions, tree select và cascader cùng phụ thuộc vùng.",
    coverage: [
      "Controls: auto-complete, mentions, tree-select, cascader",
      "Options tĩnh cho autocomplete/mentions/tree/cascader",
      "when yêu cầu mã vùng khác nhau theo destination",
      "typeError và matches kiểm tra mã đơn vị",
    ],
    schema: makeSchema(
      "destination-picker",
      "Điểm đến & nhóm làm việc",
      "Chọn vùng trước; mã đơn vị sẽ được kiểm tra theo vùng đó.",
      {
        destination: {
          useComponent: "select",
          label: "Vùng hoạt động",
          value: "north",
          options: [
            { label: "Miền Bắc", value: "north" },
            { label: "Miền Nam", value: "south" },
          ],
        },
        city: {
          useComponent: "auto-complete",
          label: "Thành phố",
          value: "Hà Nội",
          options: [
            { label: "Hà Nội", value: "Hà Nội" },
            { label: "Hải Phòng", value: "Hải Phòng" },
            { label: "TP. Hồ Chí Minh", value: "TP. Hồ Chí Minh" },
          ],
        },
        team: {
          useComponent: "mentions",
          label: "Người phụ trách",
          value: "@@linh",
          options: [
            { label: "Linh Nguyễn", value: "linh" },
            { label: "Minh An", value: "minhan" },
          ],
        },
        department: {
          useComponent: "tree-select",
          label: "Phòng ban",
          value: "design",
          options: [
            { label: "Design", value: "design" },
            { label: "Engineering", value: "engineering" },
            { label: "Operations", value: "operations" },
          ],
        },
        office: {
          useComponent: "cascader",
          label: "Văn phòng",
          value: ["north-office"],
          options: [
            { label: "Hà Nội", value: "north-office" },
            { label: "TP. Hồ Chí Minh", value: "south-office" },
          ],
        },
        branchCode: {
          useComponent: "input",
          label: "Mã chi nhánh",
          value: "HN-01",
          validations: [
            validation("when", "Mã chi nhánh không khớp vùng.", {
              field: "destination",
              is: "north",
              then: { rule: "matches", value: "^HN-\\d{2}$" },
              otherwise: { rule: "matches", value: "^SG-\\d{2}$" },
            }),
            validation("typeError", "Mã chi nhánh phải là chuỗi.", "string"),
          ],
        },
      },
      ["destination", "city", "team", "department", "office", "branchCode"],
    ),
    probes: [
      probe("when miền Bắc nhận mã HN", "branchCode", "HN-01", true, { destination: "north" }),
      probe("when miền Bắc từ chối mã SG", "branchCode", "SG-01", false, { destination: "north" }),
      probe("when miền Nam nhận mã SG", "branchCode", "SG-08", true, { destination: "south" }),
      probe("typeError từ chối mã dạng number", "branchCode", 101, false, { destination: "north" }),
    ],
  },
  {
    id: "appointment-window",
    number: "14",
    title: "Lịch hẹn & khung giờ",
    summary: "Ngày và giờ theo khoảng; ngày kết thúc phụ thuộc ngày bắt đầu.",
    coverage: [
      "Controls: date-picker, date-range-picker, time-picker, time-range-picker",
      "date, dateMin, dateMax, datetime, uuid, test",
      "test so sánh appointmentDate với latestDate trong values",
      "Dayjs values cho picker và callback cross-field",
    ],
    schema: makeSchema(
      "appointment-window",
      "Lịch hẹn & khung giờ",
      "Ngày kết thúc không được trước ngày bắt đầu.",
      {
        appointmentDate: {
          useComponent: "date-picker",
          label: "Ngày bắt đầu",
          value: dayjs("2026-07-14"),
          validations: [
            validation("date", "Ngày bắt đầu không hợp lệ."),
            validation("dateMin", "Ngày bắt đầu phải từ 2026.", "2026-01-01"),
          ],
        },
        latestDate: {
          useComponent: "date-picker",
          label: "Ngày kết thúc tối đa",
          value: dayjs("2026-07-20"),
          validations: [validation("dateMax", "Ngày kết thúc không vượt quá 2027.", "2027-12-31")],
        },
        dateWindow: {
          useComponent: "date-range-picker",
          label: "Khoảng ngày dự kiến",
          value: [dayjs("2026-07-14"), dayjs("2026-07-20")],
        },
        startTime: {
          useComponent: "time-picker",
          label: "Giờ bắt đầu",
          value: dayjs("2026-07-14T09:00:00"),
        },
        timeWindow: {
          useComponent: "time-range-picker",
          label: "Khung giờ",
          value: [dayjs("2026-07-14T09:00:00"), dayjs("2026-07-14T10:00:00")],
        },
        endsInWindow: {
          useComponent: "input",
          label: "Ngày kết thúc hợp lệ",
          value: "2026-07-20",
          validations: [
            validation(
              "test",
              "Ngày kết thúc phải nằm sau ngày bắt đầu và trong giới hạn.",
              (value: unknown, values: Record<string, unknown>) => {
                const start = dayjs(values.appointmentDate as string);
                const end = dayjs(value as string);
                const latest = dayjs(values.latestDate as string);
                return end.isValid() && !end.isBefore(start) && !end.isAfter(latest);
              },
            ),
          ],
        },
        startsAt: {
          useComponent: "input",
          label: "Timestamp ISO",
          value: "2026-07-14T09:00:00Z",
          validations: [validation("datetime", "Cần timestamp ISO đầy đủ timezone.")],
        },
        appointmentId: {
          useComponent: "input",
          label: "Mã lịch hẹn UUID",
          value: "550e8400-e29b-41d4-a716-446655440000",
          validations: [validation("uuid", "Mã lịch hẹn phải là UUID.")],
        },
      },
      ["appointmentDate", "latestDate", "dateWindow", "startTime", "timeWindow", "endsInWindow", "startsAt", "appointmentId"],
    ),
    probes: [
      probe("date nhận Dayjs hợp lệ", "appointmentDate", dayjs("2026-07-14"), true),
      probe("dateMin từ chối trước min", "appointmentDate", "2025-12-31", false),
      probe("dateMax từ chối sau max", "latestDate", "2028-01-01", false),
      probe("test nhận end trong window", "endsInWindow", "2026-07-20", true, {
        appointmentDate: "2026-07-14",
        latestDate: "2026-07-20",
      }),
      probe("test từ chối end trước start", "endsInWindow", "2026-07-10", false, {
        appointmentDate: "2026-07-14",
        latestDate: "2026-07-20",
      }),
      probe("datetime nhận timestamp UTC", "startsAt", "2026-07-14T09:00:00Z", true),
      probe("uuid nhận UUID v4", "appointmentId", "550e8400-e29b-41d4-a716-446655440000", true),
    ],
  },
  {
    id: "document-intake",
    number: "15",
    title: "Tiếp nhận hồ sơ",
    summary: "File bắt buộc khi hồ sơ thuộc nhóm kiểm duyệt; giới hạn loại và số lượng.",
    coverage: [
      "Controls: upload, switch, checkbox",
      "required, arrayRequired, arrayMin, arrayMax, arrayOf, when",
      "arrayOf dùng objectShape để kiểm tra metadata file",
      "when phụ thuộc chế độ kiểm duyệt có bật hay không",
    ],
    schema: makeSchema(
      "document-intake",
      "Tiếp nhận hồ sơ",
      "Bật kiểm duyệt sẽ yêu cầu ít nhất một file có metadata hợp lệ.",
      {
        moderated: {
          useComponent: "switch",
          label: "Bật kiểm duyệt",
          value: true,
        },
        consent: {
          useComponent: "checkbox",
          label: "Tôi xác nhận quyền sử dụng file",
          value: true,
          validations: [validation("booleanRequired", "Cần cung cấp trạng thái xác nhận.")],
        },
        documents: {
          useComponent: "upload",
          label: "Tệp đính kèm",
          value: [{ uid: "sample-1", name: "brief.pdf", status: "done" }],
          props: { listType: "text", maxCount: 3, beforeUpload: () => false },
          validations: [
            validation("when", "Chế độ này yêu cầu tệp hợp lệ.", {
              field: "moderated",
              is: true,
              then: { rule: "arrayRequired" },
              otherwise: { rule: "arrayOf", value: { rule: "typeError", value: "object" } },
            }),
            validation("arrayMin", "Thêm ít nhất 1 file.", 1),
            validation("arrayMax", "Tối đa 3 file.", 3),
            validation("arrayOf", "Metadata mỗi file phải là object.", {
              rule: "objectShape",
              value: {
                name: [
                  { rule: "required" },
                  { rule: "stringMin", value: 1 },
                ],
              },
            }),
          ],
        },
        fileCount: {
          useComponent: "input-number",
          label: "Số lượng theo khai báo",
          value: 1,
          props: { min: 0, max: 3, precision: 0 },
          validations: [
            validation("required", "Nhập số lượng."),
            validation("min", "Ít nhất 0 file.", 0),
            validation("max", "Tối đa 3 file.", 3),
            validation("integer", "Cần số nguyên."),
          ],
        },
      },
      ["moderated", "consent", "documents", "fileCount"],
    ),
    probes: [
      probe("when kiểm duyệt nhận mảng file", "documents", [{ uid: "1", name: "brief.pdf" }], true, { moderated: true }),
      probe("arrayRequired từ chối undefined khi kiểm duyệt", "documents", undefined, false, { moderated: true }),
      probe("arrayMin từ chối danh sách rỗng", "documents", [], false, { moderated: false }),
      probe("arrayMax từ chối quá 3 file", "documents", [1, 2, 3, 4], false, { moderated: false }),
      probe("arrayOf nhận metadata file đúng shape", "documents", [{ name: "brief.pdf" }], true, { moderated: false }),
      probe("arrayOf từ chối metadata file thiếu tên", "documents", [{}], false, { moderated: false }),
      probe("booleanRequired nhận false", "consent", false, true),
      probe("integer từ chối file count thập phân", "fileCount", 1.5, false),
    ],
  },
  {
    id: "notification-preferences",
    number: "16",
    title: "Tùy chọn thông báo",
    summary: "Kênh gửi quyết định nội dung bắt buộc; kiểm tra group controls.",
    coverage: [
      "Controls: checkbox-group, radio, segmented, select",
      "oneOf, notOneOf, required, booleanRequired, when",
      "Rule ở message field phụ thuộc kênh gửi notificationChannel",
      "Checkbox/radio/segmented options qua component binding",
    ],
    schema: makeSchema(
      "notification-preferences",
      "Tùy chọn thông báo",
      "Chọn kênh gửi để áp dụng yêu cầu địa chỉ phù hợp.",
      {
        notificationChannel: {
          useComponent: "radio",
          label: "Kênh thông báo",
          value: "email",
          options: [
            { label: "Email", value: "email" },
            { label: "SMS", value: "sms" },
          ],
          validations: [validation("oneOf", "Chọn email hoặc SMS.", ["email", "sms"])],
        },
        destinations: {
          useComponent: "checkbox-group",
          label: "Chủ đề gửi",
          value: ["product"],
          options: [
            { label: "Sản phẩm", value: "product" },
            { label: "Hóa đơn", value: "billing" },
            { label: "Tin tức", value: "news" },
          ],
          validations: [validation("arrayMin", "Chọn ít nhất một chủ đề.", 1)],
        },
        frequency: {
          useComponent: "segmented",
          label: "Tần suất",
          value: "weekly",
          options: [
            { label: "Ngay", value: "daily" },
            { label: "Tuần", value: "weekly" },
            { label: "Tháng", value: "monthly" },
          ],
          validations: [validation("notOneOf", "Không thể tắt toàn bộ tần suất.", ["never"])],
        },
        emailAddress: {
          useComponent: "input",
          label: "Địa chỉ email",
          value: "qa@example.com",
          validations: [
            validation("when", "Địa chỉ email không được để trống khi chọn email.", {
              field: "notificationChannel",
              is: "email",
              then: { rule: "required" },
            }),
            validation("email", "Định dạng email không hợp lệ."),
          ],
        },
        allowPush: {
          useComponent: "switch",
          label: "Cho phép push",
          value: false,
          validations: [validation("booleanRequired", "Push phải là trạng thái boolean.")],
        },
        consent: {
          useComponent: "checkbox",
          label: "Đồng ý nhận cập nhật",
          value: false,
          validations: [validation("booleanRequired", "Cần cung cấp trạng thái đồng ý.")],
        },
      },
      ["notificationChannel", "destinations", "frequency", "emailAddress", "allowPush", "consent"],
    ),
    probes: [
      probe("oneOf nhận SMS", "notificationChannel", "sms", true),
      probe("when email nhận địa chỉ nhập", "emailAddress", "qa@example.com", true, { notificationChannel: "email" }),
      probe("when email từ chối địa chỉ trống", "emailAddress", "", false, { notificationChannel: "email" }),
      probe("when SMS không bắt buộc email", "emailAddress", "", true, { notificationChannel: "sms" }),
      probe("arrayMin nhận ít nhất một topic", "destinations", ["product"], true),
      probe("notOneOf từ chối never", "frequency", "never", false),
      probe("booleanRequired chấp nhận false", "consent", false, true),
    ],
  },
  {
    id: "review-metrics",
    number: "17",
    title: "Đánh giá & chỉ số",
    summary: "Slider, rate, color picker và số lượng chịu ngưỡng theo mức ưu tiên.",
    coverage: [
      "Controls: slider, rate, color-picker, input-number",
      "min, max, lessThan, moreThan, positive, negative, integer, typeError",
      "when yêu cầu mức rating cao hơn khi priority là urgent",
      "Giá trị numeric được probe ở ngưỡng hợp lệ và biên sai",
    ],
    schema: makeSchema(
      "review-metrics",
      "Đánh giá & chỉ số",
      "Mức ưu tiên ảnh hưởng tới điểm đánh giá tối thiểu.",
      {
        priority: {
          useComponent: "segmented",
          label: "Mức ưu tiên",
          value: "urgent",
          options: [
            { label: "Thường", value: "normal" },
            { label: "Khẩn", value: "urgent" },
          ],
        },
        score: {
          useComponent: "rate",
          label: "Điểm đánh giá",
          value: 4,
          validations: [
            validation("when", "Ưu tiên khẩn cần rating từ 4 sao.", {
              field: "priority",
              is: "urgent",
              then: { rule: "moreThan", value: 3 },
              otherwise: { rule: "positive" },
            }),
          ],
        },
        completion: {
          useComponent: "slider",
          label: "Phần trăm hoàn thành",
          value: 68,
          props: { min: 0, max: 100 },
          validations: [
            validation("min", "Tối thiểu 0%.", 0),
            validation("max", "Tối đa 100%.", 100),
            validation("lessThan", "Cần dưới 101%.", 101),
          ],
        },
        accent: {
          useComponent: "color-picker",
          label: "Màu nhấn",
          value: "#1e5145",
        },
        revenue: {
          useComponent: "input-number",
          label: "Doanh thu",
          value: 12,
          validations: [
            validation("typeError", "Doanh thu phải là số hữu hạn.", "number"),
            validation("positive", "Doanh thu phải dương."),
          ],
        },
        delta: {
          useComponent: "input-number",
          label: "Delta",
          value: -2,
          validations: [
            validation("negative", "Delta cần âm."),
            validation("integer", "Delta cần là số nguyên."),
          ],
        },
      },
      ["priority", "score", "completion", "accent", "revenue", "delta"],
    ),
    probes: [
      probe("when urgent nhận score 4", "score", 4, true, { priority: "urgent" }),
      probe("when urgent từ chối score 3", "score", 3, false, { priority: "urgent" }),
      probe("when normal nhận score dương", "score", 1, true, { priority: "normal" }),
      probe("min nhận completion zero", "completion", 0, true),
      probe("max từ chối trên 100", "completion", 101, false),
      probe("lessThan từ chối đúng 101", "completion", 101, false),
      probe("typeError nhận số", "revenue", 12, true),
      probe("typeError từ chối chuỗi", "revenue", "12", false),
      probe("positive từ chối zero", "revenue", 0, false),
      probe("negative nhận số âm", "delta", -2, true),
      probe("negative từ chối số dương", "delta", 2, false),
      probe("integer từ chối thập phân", "delta", -2.5, false),
      probe("moreThan biên >3", "score", 3, false, { priority: "urgent" }),
    ],
  },
  {
    id: "team-access",
    number: "18",
    title: "Phân quyền nhóm",
    summary: "Transfer chọn thành viên; JSON policy phụ thuộc role được chọn.",
    coverage: [
      "Controls: transfer, json-editor, select",
      "objectShape, noUnknown, arrayOf, oneOf, when",
      "role admin yêu cầu ít nhất 2 thành viên; viewer chỉ cần một",
      "Policy JSON chỉ cho phép keys role/active",
    ],
    schema: makeSchema(
      "team-access",
      "Phân quyền nhóm",
      "Role được chọn quyết định số thành viên tối thiểu.",
      {
        role: {
          useComponent: "select",
          label: "Vai trò",
          value: "admin",
          options: [
            { label: "Admin", value: "admin" },
            { label: "Viewer", value: "viewer" },
          ],
          validations: [validation("oneOf", "Chọn admin hoặc viewer.", ["admin", "viewer"])],
        },
        members: {
          useComponent: "transfer",
          label: "Thành viên được cấp quyền",
          value: ["user-1", "user-2"],
          props: {
            dataSource: [
              { key: "user-1", title: "Linh Nguyễn", description: "Design" },
              { key: "user-2", title: "Minh An", description: "Engineering" },
              { key: "user-3", title: "An Phạm", description: "Operations" },
            ],
            render: (item: { title: string }) => item.title,
            listStyle: { width: 180, height: 190 },
          },
          validations: [
            validation("when", "Admin phải có ít nhất hai thành viên.", {
              field: "role",
              is: "admin",
              then: { rule: "arrayMin", value: 2 },
              otherwise: { rule: "arrayMin", value: 1 },
            }),
            validation("arrayOf", "Mỗi key thành viên phải là string.", {
              rule: "typeError",
              value: "string",
            }),
          ],
        },
        policy: {
          useComponent: "json-editor",
          label: "Policy JSON",
          value: { role: "admin", active: true },
          validations: [
            validation("objectShape", "Policy thiếu role/active hợp lệ.", {
              role: { rule: "oneOf", value: ["admin", "viewer"] },
              active: { rule: "typeError", value: "boolean" },
            }),
            validation("noUnknown", "Policy chứa key không được hỗ trợ.", ["role", "active"]),
          ],
        },
      },
      ["role", "members", "policy"],
    ),
    probes: [
      probe("oneOf nhận admin", "role", "admin", true),
      probe("when admin nhận 2 member", "members", ["user-1", "user-2"], true, { role: "admin" }),
      probe("when admin từ chối 1 member", "members", ["user-1"], false, { role: "admin" }),
      probe("when viewer nhận 1 member", "members", ["user-1"], true, { role: "viewer" }),
      probe("arrayOf từ chối member key không phải string", "members", [1], false, { role: "viewer" }),
      probe("objectShape nhận policy đúng", "policy", { role: "admin", active: true }, true),
      probe("objectShape từ chối active sai kiểu", "policy", { role: "admin", active: "yes" }, false),
      probe("noUnknown từ chối key lạ", "policy", { role: "viewer", active: true, debug: true }, false),
    ],
  },
  {
    id: "campaign-editor",
    number: "19",
    title: "Thiết lập chiến dịch",
    summary: "URL, mã chiến dịch và ngân sách phụ thuộc loại chiến dịch.",
    coverage: [
      "Controls: input-number, search, textarea",
      "url, matches, stringLength, min/max/positive, when/test",
      "campaignType quyết định minimum budget; callback so khớp owner",
      "Live validation onChange cho slug",
    ],
    schema: makeSchema(
      "campaign-editor",
      "Thiết lập chiến dịch",
      "Chiến dịch paid cần ngân sách và slug theo định dạng riêng.",
      {
        campaignType: {
          useComponent: "select",
          label: "Loại chiến dịch",
          value: "paid",
          options: [
            { label: "Paid", value: "paid" },
            { label: "Organic", value: "organic" },
          ],
        },
        budget: {
          useComponent: "input-number",
          label: "Ngân sách",
          value: 500,
          props: { min: 0 },
          validations: [
            validation("when", "Paid campaign cần ngân sách tối thiểu 100.", {
              field: "campaignType",
              is: "paid",
              then: { rule: "min", value: 100 },
              otherwise: { rule: "min", value: 0 },
            }),
            validation("max", "Ngân sách tối đa 10000.", 10000),
            validation("positive", "Ngân sách phải dương."),
          ],
        },
        slug: {
          useComponent: "search",
          label: "Campaign slug",
          value: "spring-26",
          liveValidation: { active: true, trigger: "onChange", debounce: 100 },
          validations: [
            validation("stringLength", "Slug cần đúng 9 ký tự.", 9),
            validation("matches", "Dùng chữ thường và dấu gạch ngang.", "^[a-z]+-\\d{2}$"),
          ],
        },
        landingPage: {
          useComponent: "input",
          label: "Landing page",
          value: "https://example.com/spring",
          validations: [validation("url", "Cần URL HTTP/HTTPS hợp lệ.")],
        },
        owner: {
          useComponent: "input",
          label: "Owner",
          value: "linh",
        },
        ownerConfirm: {
          useComponent: "input",
          label: "Xác nhận owner",
          value: "linh",
          validations: [
            validation(
              "test",
              "Owner xác nhận phải trùng owner.",
              (value: unknown, values: Record<string, unknown>) => value === values.owner,
            ),
          ],
        },
        notes: {
          useComponent: "textarea",
          label: "Ghi chú chiến dịch",
          value: "Spring launch",
        },
      },
      ["campaignType", "budget", "slug", "landingPage", "owner", "ownerConfirm", "notes"],
    ),
    probes: [
      probe("when paid nhận budget 500", "budget", 500, true, { campaignType: "paid" }),
      probe("when paid từ chối budget 50", "budget", 50, false, { campaignType: "paid" }),
      probe("when organic nhận budget 50", "budget", 50, true, { campaignType: "organic" }),
      probe("max từ chối trên limit", "budget", 10001, false, { campaignType: "organic" }),
      probe("positive từ chối zero budget", "budget", 0, false, { campaignType: "organic" }),
      probe("stringLength nhận slug 9 ký tự", "slug", "spring-26", true),
      probe("matches từ chối chữ hoa", "slug", "Spring-26", false),
      probe("url nhận landing page", "landingPage", "https://example.com", true),
      probe("test nhận owner trùng", "ownerConfirm", "linh", true, { owner: "linh" }),
      probe("test từ chối owner khác", "ownerConfirm", "an", false, { owner: "linh" }),
    ],
  },
  {
    id: "calendar-planner",
    number: "20",
    title: "Kế hoạch vận hành",
    summary: "Calendar, date picker và numeric nhập ngày/số; số kế hoạch phụ thuộc mode.",
    coverage: [
      "Controls: calendar, date-picker, numeric, button actions",
      "date, dateMin/dateMax, integer, min/max, test cross-field",
      "mode quyết định số lượng kế hoạch; date và count được kiểm tra kết hợp",
      "Kết thúc phủ đủ component registry cũ và mới",
    ],
    schema: makeSchema(
      "calendar-planner",
      "Kế hoạch vận hành",
      "Chế độ nhiều ngày yêu cầu tối thiểu ba task.",
      {
        calendarDate: {
          useComponent: "calendar",
          label: "Lịch vận hành",
          value: dayjs("2026-08-03"),
        },
        selectedDate: {
          useComponent: "date-picker",
          label: "Ngày đã chọn",
          value: dayjs("2026-08-03"),
          validations: [
            validation("date", "Ngày chọn không hợp lệ."),
            validation("dateMin", "Ngày phải từ tháng 8.", "2026-08-01"),
            validation("dateMax", "Ngày không vượt quá tháng 9.", "2026-09-30"),
          ],
        },
        mode: {
          useComponent: "segmented",
          label: "Chế độ lập kế hoạch",
          value: "multi-day",
          options: [
            { label: "Một ngày", value: "single" },
            { label: "Nhiều ngày", value: "multi-day" },
          ],
        },
        taskCount: {
          useComponent: "numeric",
          label: "Số task",
          value: 4,
          props: { min: 0, max: 12, precision: 0 },
          validations: [
            validation("when", "Nhiều ngày cần ít nhất 3 task.", {
              field: "mode",
              is: "multi-day",
              then: { rule: "min", value: 3 },
              otherwise: { rule: "min", value: 1 },
            }),
            validation("max", "Tối đa 12 task.", 12),
            validation("integer", "Task count phải là số nguyên."),
          ],
        },
        summary: {
          useComponent: "input",
          label: "Tóm tắt kế hoạch",
          value: "4 tasks scheduled",
          validations: [
            validation(
              "test",
              "Tóm tắt cần khớp số task.",
              (value: unknown, values: Record<string, unknown>) =>
                value === `${String(values.taskCount)} tasks scheduled`,
            ),
          ],
        },
        optionalCount: {
          useComponent: "input-number",
          label: "Giới hạn task tùy chọn",
          value: 8,
          validations: [
            validation("lessThan", "Giới hạn phải dưới 13.", 13),
            validation("moreThan", "Giới hạn phải lớn hơn 0.", 0),
          ],
        },
      },
      ["calendarDate", "selectedDate", "mode", "taskCount", "summary", "optionalCount"],
    ),
    probes: [
      probe("date nhận ngày kế hoạch", "selectedDate", dayjs("2026-08-03"), true),
      probe("dateMin từ chối tháng 7", "selectedDate", "2026-07-31", false),
      probe("dateMax từ chối tháng 10", "selectedDate", "2026-10-01", false),
      probe("when multi-day nhận 4 task", "taskCount", 4, true, { mode: "multi-day" }),
      probe("when multi-day từ chối 2 task", "taskCount", 2, false, { mode: "multi-day" }),
      probe("when single nhận 1 task", "taskCount", 1, true, { mode: "single" }),
      probe("max từ chối 13 task", "taskCount", 13, false, { mode: "single" }),
      probe("integer từ chối số task thập phân", "taskCount", 4.5, false, { mode: "single" }),
      probe("test summary khớp count", "summary", "4 tasks scheduled", true, { taskCount: 4 }),
      probe("test summary sai count", "summary", "3 tasks scheduled", false, { taskCount: 4 }),
      probe("lessThan từ chối đúng 13", "optionalCount", 13, false),
      probe("moreThan từ chối zero", "optionalCount", 0, false),
    ],
  },
];