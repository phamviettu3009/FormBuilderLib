import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import deepEqual from "fast-deep-equal";
import { hasMapperReference } from "../field-mapper";
import { ComponentBuilder } from "../component/component";
import { pluginRegistry } from "../plugin-registry";
import { SchemaExtractor } from "../schema-extractor";
import { Validator } from "../validator/validator";
import { FormControl } from "./FormControl";
import type { FormControlSnapshot } from "./FormControl";
import type {
  Condition,
  FormAction,
  FormBuilderSchema,
  FormField,
  FormFieldOption,
} from "./schema";

interface UseFormBuilderOptions {
  activeGroupId?: string;
  onActiveGroupChange?: (groupId: string) => void;
  onAction?: (action: FormAction) => void;
  control?: FormControl;
  mapper?: Record<string, unknown>;
  onSubmit?: (values: Record<string, unknown>) => void | Promise<void>;
}

interface FieldActions {
  display: "show" | "hide" | "remove";
  disabled: boolean;
  ignoreValidation: boolean;
}

interface ValidationTarget {
  groupId: string;
  field: FormField;
}

function matchesCondition(
  condition: Condition,
  values: Record<string, unknown>,
): boolean {
  const actualValue = values[condition.name];
  if (
    condition.operator === "lessThan" ||
    condition.operator === "greaterThan" ||
    condition.operator === "lessThanOrEqual" ||
    condition.operator === "greaterThanOrEqual"
  ) {
    const actualNumber = toNumber(actualValue);
    const expectedNumber = toNumber(condition.value);
    if (actualNumber === undefined || expectedNumber === undefined) {
      return false;
    }
    switch (condition.operator) {
      case "lessThan":
        return actualNumber < expectedNumber;
      case "greaterThan":
        return actualNumber > expectedNumber;
      case "lessThanOrEqual":
        return actualNumber <= expectedNumber;
      case "greaterThanOrEqual":
        return actualNumber >= expectedNumber;
    }
  }

  switch (condition.operator) {
    case "equals":
      return actualValue === condition.value;
    case "notEquals":
      return actualValue !== condition.value;
    case "in":
      return (
        Array.isArray(condition.value) && condition.value.includes(actualValue)
      );
    case "exists":
      return actualValue !== undefined && actualValue !== null;
  }
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }
  if (typeof value !== "string" || value.trim() === "") {
    return undefined;
  }
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : undefined;
}

function getMatchedConditionKeys(
  fields: FormField[],
  values: Record<string, unknown>,
): Set<string> {
  const matchedConditions = new Set<string>();
  for (const field of fields) {
    field.when?.forEach((condition, index) => {
      if (matchesCondition(condition, values)) {
        matchedConditions.add(`${field.name}:${index}`);
      }
    });
  }
  return matchedConditions;
}

function getValidationErrorKey(groupId: string, fieldName: string): string {
  return JSON.stringify([groupId, fieldName]);
}

function getFieldActions(
  conditions: Condition[] | undefined,
  values: Record<string, unknown>,
): FieldActions {
  const actions: FieldActions = {
    display: "show",
    disabled: false,
    ignoreValidation: false,
  };
  for (const condition of conditions ?? []) {
    if (!matchesCondition(condition, values)) {
      continue;
    }
    if (condition.action.display === "remove") {
      actions.display = "remove";
    } else if (
      condition.action.display === "hide" &&
      actions.display === "show"
    ) {
      actions.display = "hide";
    }
    actions.disabled ||= condition.action.disable ?? false;
    actions.ignoreValidation ||= condition.action.ignoreValidation ?? false;
  }
  return actions;
}

export function useFormBuilder(
  schema: FormBuilderSchema,
  options: UseFormBuilderOptions,
) {
  const {
    activeGroupId: providedActiveGroupId,
    onActiveGroupChange,
    onAction,
    control,
    mapper,
    onSubmit,
  } = options;
  const schemaExtractor = useMemo(
    () => new SchemaExtractor(schema, mapper),
    [schema, mapper],
  );
  const validator = useMemo(
    () => new Validator(schemaExtractor),
    [schemaExtractor],
  );
  const componentBuilder = useMemo(
    () => new ComponentBuilder(schemaExtractor),
    [schemaExtractor],
  );
  const formPlugin = pluginRegistry.getPluginByName(schema.formType, "form");
  const getComponentByType = (type: string) => {
    const plugin = pluginRegistry.getPluginByName(type, "component");
    return {
      component: componentBuilder.getComponentByType(type),
      binding: plugin.componentBinding,
    };
  };
  const getActionComponent = (name: string) => {
    const plugin = pluginRegistry.getPluginByName(name, "component");
    return { component: plugin.class, binding: plugin.componentBinding };
  };
  const { groups, fields } = schemaExtractor;
  const [internalActiveGroupId, setInternalActiveGroupId] = useState<string>();
  const activeGroupId = providedActiveGroupId ?? (
    groups.some((group) => group.id === internalActiveGroupId)
      ? internalActiveGroupId!
      : groups[0]?.id ?? ""
  );
  const handleActiveGroupChange = useCallback((groupId: string) => {
    if (providedActiveGroupId === undefined) {
      setInternalActiveGroupId(groupId);
    }
    onActiveGroupChange?.(groupId);
  }, [providedActiveGroupId, onActiveGroupChange]);

  const initialValues = useMemo(
    () =>
      Object.fromEntries(
        fields.map((field) => [field.name, field.value]),
      ),
    [fields],
  );
  const mappedValueEntries = useMemo(
    () => fields.flatMap((field) => {
      const source = schema.fields[field.name];
      const reference = typeof source === "string" ? source : source.value;
      return hasMapperReference(reference)
        ? [[field.name, { reference, value: field.value }] as const]
        : [];
    }),
    [fields, schema],
  );
  const initialFocusField = fields.find((field) =>
    field.when?.some(
      (condition) =>
        condition.action.focus && matchesCondition(condition, initialValues),
    ),
  );
  const initialFocusGroup = groups.find((group) =>
    group.sections.some((section) =>
      section.fields.some((field) => field.name === initialFocusField?.name),
    ),
  );
  const [values, setValues] = useState<Record<string, unknown>>(initialValues);
  const [optionOverrides, setOptionOverrides] = useState<
    Record<string, FormFieldOption[]>
  >({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submittedValues, setSubmittedValues] =
    useState<Record<string, unknown>>();
  const [submitError, setSubmitError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const formBuilderRef = useRef<HTMLDivElement>(null);
  const activeAction = useRef<FormAction | undefined>(undefined);
  const cancelledSubmitAction = useRef<string | undefined>(undefined);
  const didRequestInitialFocusGroup = useRef(false);
  const matchedResetConditions = useRef(
    getMatchedConditionKeys(fields, initialValues),
  );
  const previousMappedValues = useRef(new Map(mappedValueEntries));
  const liveValues = useRef(values);
  const liveValidationTimers = useRef(new Map<string, number>());
  const [focusRequest, setFocusRequest] = useState(() =>
    initialFocusField
      ? { fieldName: initialFocusField.name, version: 0 }
      : undefined,
  );
  const fieldActions = Object.fromEntries(
    fields.map((field) => [field.name, getFieldActions(field.when, values)]),
  );
  const activeGroup = groups.find((group) => group.id === activeGroupId);
  const getFieldOptions = (field: FormField) => {
    const plugin = pluginRegistry.getPluginByName(
      field.useComponent,
      "component",
    );
    if (
      plugin.componentBinding?.supportsOptions &&
      Object.hasOwn(optionOverrides, field.name)
    ) {
      return optionOverrides[field.name];
    }
    return Array.isArray(field.options) ? field.options : undefined;
  };

  const setFieldOptions = (fieldName: string, options: FormFieldOption[]) => {
    const field = fields.find((item) => item.name === fieldName);
    if (!field) {
      throw new Error(`Unknown field: ${fieldName}`);
    }
    const plugin = pluginRegistry.getPluginByName(
      field.useComponent,
      "component",
    );
    if (!plugin.componentBinding?.supportsOptions) {
      throw new Error(`Field "${fieldName}" does not support options`);
    }
    if (!Array.isArray(options)) {
      throw new Error("Options must be an array");
    }
    setOptionOverrides((current) => ({
      ...current,
      [fieldName]: options.map((option) => ({ ...option })),
    }));
  };

  useLayoutEffect(() => {
    liveValues.current = values;
  }, [values]);

  useEffect(() => {
    const timers = liveValidationTimers.current;
    return () => {
      for (const timeout of timers.values()) {
        window.clearTimeout(timeout);
      }
      timers.clear();
    };
  }, [activeGroupId, schemaExtractor]);

  const cancelLiveValidations = () => {
    for (const timeout of liveValidationTimers.current.values()) {
      window.clearTimeout(timeout);
    }
    liveValidationTimers.current.clear();
  };

  const scheduleLiveValidation = (
    groupId: string,
    name: string,
    trigger: "onChange" | "onBlur",
  ) => {
    const field = fields.find((item) => item.name === name);
    const config = field?.liveValidation;
    if (
      trigger === "onBlur" &&
      (!config?.active || (config.trigger ?? "onChange") !== trigger)
    ) {
      return;
    }
    const key = getValidationErrorKey(groupId, name);
    const pending = liveValidationTimers.current.get(key);
    if (pending !== undefined) {
      window.clearTimeout(pending);
      liveValidationTimers.current.delete(key);
    }
    if (
      !field ||
      !config?.active ||
      (config.trigger ?? "onChange") !== trigger
    ) {
      return;
    }
    const delay = Number.isFinite(config.debounce)
      ? Math.max(0, config.debounce ?? 0)
      : 0;
    const timeout = window.setTimeout(() => {
      liveValidationTimers.current.delete(key);
      const currentValues = liveValues.current;
      const actions = getFieldActions(field.when, currentValues);
      const error =
        actions.display === "show" &&
        !actions.disabled &&
        !actions.ignoreValidation
          ? validator.getFieldError(field, currentValues[name], currentValues)
          : undefined;
      setErrors((currentErrors) => {
        const nextErrors = { ...currentErrors };
        if (error) {
          nextErrors[key] = error;
        } else {
          delete nextErrors[key];
        }
        return nextErrors;
      });
    }, delay);
    liveValidationTimers.current.set(key, timeout);
  };

  const resetForm = () => {
    cancelLiveValidations();
    liveValues.current = initialValues;
    setValues(initialValues);
    matchedResetConditions.current = getMatchedConditionKeys(
      fields,
      initialValues,
    );
    setErrors({});
    setSubmittedValues(undefined);
    setSubmitError(undefined);
    activeAction.current = undefined;
  };

  const getFieldsForGroups = (
    selectedGroups: typeof groups,
  ): ValidationTarget[] =>
    selectedGroups.flatMap((group) => {
      const groupFields = new Map<string, FormField>();
      for (const section of group.sections) {
        for (const field of section.fields) {
          groupFields.set(field.name, field);
        }
      }
      return [...groupFields.values()].map((field) => ({
        groupId: group.id,
        field,
      }));
    });

  const validateFields = (
    fieldsToValidate: ValidationTarget[],
    replaceErrors: boolean,
  ): boolean => {
    cancelLiveValidations();
    const nextErrors: Record<string, string> = {};
    for (const { groupId, field } of fieldsToValidate) {
      if (
        field.validations?.length &&
        fieldActions[field.name].display === "show" &&
        !fieldActions[field.name].disabled &&
        !fieldActions[field.name].ignoreValidation
      ) {
        const error = validator.getFieldError(
          field,
          values[field.name],
          values,
        );
        if (error) {
          nextErrors[getValidationErrorKey(groupId, field.name)] = error;
        }
      }
    }

    setErrors((currentErrors) => {
      const mergedErrors = replaceErrors ? {} : { ...currentErrors };
      for (const { groupId, field } of fieldsToValidate) {
        delete mergedErrors[getValidationErrorKey(groupId, field.name)];
      }
      return { ...mergedErrors, ...nextErrors };
    });

    const firstInvalidTarget = fieldsToValidate.find(
      ({ groupId, field }) =>
        nextErrors[getValidationErrorKey(groupId, field.name)],
    );
    if (!firstInvalidTarget) {
      return true;
    }

    handleActiveGroupChange(firstInvalidTarget.groupId);
    setFocusRequest((currentRequest) => ({
      fieldName: firstInvalidTarget.field.name,
      version: (currentRequest?.version ?? 0) + 1,
    }));
    return false;
  };

  const updateFields = (updates: Record<string, unknown>) => {
    const nextValues = { ...liveValues.current, ...updates };
    const matchedConditions = getMatchedConditionKeys(fields, nextValues);
    const fieldsToReset = new Set<string>();
    let fieldToFocus: string | undefined;
    for (const field of fields) {
      field.when?.forEach((condition, index) => {
        const conditionKey = `${field.name}:${index}`;
        if (
          !fieldToFocus &&
          condition.action.focus &&
          matchedConditions.has(conditionKey) &&
          !matchedResetConditions.current.has(conditionKey)
        ) {
          fieldToFocus = field.name;
        }
        if (
          condition.action.resetValue &&
          matchedConditions.has(conditionKey) &&
          !matchedResetConditions.current.has(conditionKey)
        ) {
          fieldsToReset.add(field.name);
        }
      });
    }

    for (const fieldName of fieldsToReset) {
      nextValues[fieldName] = initialValues[fieldName];
    }
    matchedResetConditions.current = getMatchedConditionKeys(
      fields,
      nextValues,
    );
    if (fieldToFocus) {
      const targetFieldName = fieldToFocus;
      const targetGroup = groups.find((group) =>
        group.sections.some((section) =>
          section.fields.some((field) => field.name === targetFieldName),
        ),
      );
      if (targetGroup) {
        handleActiveGroupChange(targetGroup.id);
      }
      setFocusRequest((currentRequest) => ({
        fieldName: targetFieldName,
        version: (currentRequest?.version ?? 0) + 1,
      }));
    }
    liveValues.current = nextValues;
    setValues(nextValues);
    setErrors((currentErrors) => {
      const fieldsWithErrorsToClear = new Set([
        ...Object.keys(updates),
        ...fieldsToReset,
      ]);
      const keysToClear = Object.keys(currentErrors).filter((key) => {
        const [, fieldName] = JSON.parse(key) as [string, string];
        return fieldsWithErrorsToClear.has(fieldName);
      });
      if (keysToClear.length === 0) {
        return currentErrors;
      }
      const nextErrors = { ...currentErrors };
      for (const key of keysToClear) {
        delete nextErrors[key];
      }
      return nextErrors;
    });
    setSubmittedValues(undefined);
    setSubmitError(undefined);
  };

  const updateField = (name: string, value: unknown) => {
    updateFields({ [name]: value });
  };

  const resetField = (name: string) => {
    if (!Object.hasOwn(initialValues, name)) {
      throw new Error(`Unknown field: ${name}`);
    }
    for (const [key, timeout] of liveValidationTimers.current) {
      const [, fieldName] = JSON.parse(key) as [string, string];
      if (fieldName === name) {
        window.clearTimeout(timeout);
        liveValidationTimers.current.delete(key);
      }
    }
    updateField(name, initialValues[name]);
  };

  const handleFieldChange = (groupId: string, name: string, value: unknown) => {
    updateField(name, value);
    scheduleLiveValidation(groupId, name, "onChange");
  };

  const handleFieldBlur = (groupId: string, name: string) => {
    scheduleLiveValidation(groupId, name, "onBlur");
  };

  const getValidationGroups = (action: FormAction) =>
    action.validationGroups?.length
      ? groups.filter((group) => action.validationGroups?.includes(group.id))
      : groups;

  const handleAction = (action: FormAction) => {
    if (action.type !== "submit") {
      if (action.validateBeforeRun) {
        const validationGroups = getValidationGroups(action);
        if (!validateFields(getFieldsForGroups(validationGroups), false)) {
          return;
        }
      }
      if (action.type === "reset") {
        resetForm();
      }
      onAction?.(action);
      return;
    }

    activeAction.current = action;
    if (
      action.confirm &&
      !window.confirm(
        [action.confirm.title, action.confirm.description]
          .filter(Boolean)
          .join("\n"),
      )
    ) {
      cancelledSubmitAction.current = action.id;
      return;
    }
    cancelledSubmitAction.current = undefined;
  };

  const handleSubmit = async (eventOrValues: unknown) => {
    if (
      typeof eventOrValues === "object" &&
      eventOrValues !== null &&
      "preventDefault" in eventOrValues &&
      typeof eventOrValues.preventDefault === "function"
    ) {
      eventOrValues.preventDefault();
    }
    const action = activeAction.current;
    activeAction.current = undefined;
    if (!action) {
      return;
    }
    if (cancelledSubmitAction.current === action.id) {
      cancelledSubmitAction.current = undefined;
      return;
    }

    if (action.validateBeforeRun !== false) {
      if (
        !validateFields(getFieldsForGroups(getValidationGroups(action)), true)
      ) {
        return;
      }
    } else {
      setErrors({});
    }

    setSubmitting(true);
    setSubmitError(undefined);
    try {
      const valuesToSubmit = Object.fromEntries(
        Object.entries(values).filter(
          ([name]) => fieldActions[name]?.display !== "remove",
        ),
      );
      await onSubmit?.(valuesToSubmit);
      setSubmittedValues(valuesToSubmit);
    } catch (error) {
      if (!(error instanceof Error)) {
        throw error;
      }
      setSubmitError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const nextValues = { ...liveValues.current };
    const changedFieldNames: string[] = [];
    for (const [name, mapped] of mappedValueEntries) {
      const previous = previousMappedValues.current.get(name);
      if (
        (!previous ||
          !deepEqual(previous.reference, mapped.reference) ||
          !deepEqual(previous.value, mapped.value)) &&
        !deepEqual(nextValues[name], mapped.value)
      ) {
        nextValues[name] = mapped.value;
        changedFieldNames.push(name);
      }
    }
    previousMappedValues.current = new Map(mappedValueEntries);
    if (changedFieldNames.length === 0) {
      return;
    }
    cancelLiveValidations();
    matchedResetConditions.current = getMatchedConditionKeys(
      fields,
      nextValues,
    );
    liveValues.current = nextValues;
    // Synchronize mapper props into the editable form state.
    // oxlint-disable-next-line react/set-state-in-effect
    setValues(nextValues);
    setErrors((currentErrors) => {
      const nextErrors = { ...currentErrors };
      for (const key of Object.keys(nextErrors)) {
        const [, fieldName] = JSON.parse(key) as [string, string];
        if (changedFieldNames.includes(fieldName)) {
          delete nextErrors[key];
        }
      }
      return nextErrors;
    });
    setSubmittedValues(undefined);
    setSubmitError(undefined);
    // Mapper changes, not edits, trigger external value synchronization.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [fields, mappedValueEntries]);

  useEffect(() => {
    if (didRequestInitialFocusGroup.current) {
      return;
    }
    didRequestInitialFocusGroup.current = true;
    if (initialFocusGroup && initialFocusGroup.id !== activeGroupId) {
      handleActiveGroupChange(initialFocusGroup.id);
    }
  }, [activeGroupId, initialFocusGroup, handleActiveGroupChange]);

  useLayoutEffect(() => {
    if (!focusRequest) {
      return;
    }
    const timeout = window.setTimeout(() => {
      const fieldContainer = Array.from(
        formBuilderRef.current?.querySelectorAll<HTMLElement>(
          "[data-field-name]",
        ) ?? [],
      ).find((element) => element.dataset.fieldName === focusRequest.fieldName);
      const focusable = fieldContainer?.querySelector<HTMLElement>(
        "input:not(:disabled), textarea:not(:disabled), select:not(:disabled), button:not(:disabled), [tabindex]:not([tabindex='-1'])",
      );
      if (
        focusable &&
        fieldContainer &&
        getComputedStyle(fieldContainer).visibility !== "hidden"
      ) {
        focusable.focus();
      }
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [activeGroupId, focusRequest]);

  useLayoutEffect(() => {
    if (!control) {
      return;
    }
    const controlErrors: Record<string, Record<string, string>> = {};
    for (const [errorKey, message] of Object.entries(errors)) {
      const [groupId, fieldName] = JSON.parse(errorKey) as [string, string];
      (controlErrors[groupId] ??= {})[fieldName] = message;
    }
    const fieldStates: FormControlSnapshot["fieldStates"] = {};
    for (const group of groups) {
      const groupStates = (fieldStates[group.id] ??= {});
      for (const section of group.sections) {
        for (const field of section.fields) {
          groupStates[field.name] = {
            value: values[field.name],
            error: controlErrors[group.id]?.[field.name],
            disabled: fieldActions[field.name].disabled,
            hidden: fieldActions[field.name].display === "hide",
          };
        }
      }
    }

    control.connect(
      {
        values,
        initialValues,
        errors: controlErrors,
        fieldStates,
        groups: groups.map(({ id, title }) => ({ id, title })),
        activeGroupId,
      },
      {
        setValue: updateField,
        setValues: updateFields,
        resetField,
        setOptions: setFieldOptions,
        validate: () => validateFields(getFieldsForGroups(groups), true),
        validateField: (fieldName, groupId) => {
          const targetGroups = groupId
            ? groups.filter((group) => group.id === groupId)
            : groups.filter((group) =>
                group.sections.some((section) =>
                  section.fields.some((field) => field.name === fieldName),
                ),
              );
          if (groupId && targetGroups.length === 0) {
            throw new Error(`Unknown validation group: ${groupId}`);
          }
          const targets = getFieldsForGroups(targetGroups).filter(
            (target) => target.field.name === fieldName,
          );
          if (targets.length === 0) {
            throw new Error(
              `Unknown field "${fieldName}" in the requested group`,
            );
          }
          return validateFields(targets, false);
        },
        validateGroup: (groupId) => {
          const group = groups.find((item) => item.id === groupId);
          if (!group) {
            throw new Error(`Unknown validation group: ${groupId}`);
          }
          return validateFields(getFieldsForGroups([group]), false);
        },
        reset: resetForm,
      },
    );
    return () => control.disconnect();
  });

  const formProps: Record<string, unknown> = {
    noValidate: true,
    "aria-busy": submitting,
    className: `form-builder-form form-builder-form--labels-${schema.layout?.labelPosition ?? "top"}`,
    [formPlugin.submitHandlerProp ?? "onSubmit"]: handleSubmit,
  };

  return {
    groups,
    fields,
    activeGroup,
    activeGroupId,
    fieldActions,
    values,
    errors,
    submittedValues,
    submitError,
    submitting,
    formBuilderRef,
    formComponent: formPlugin.class,
    formProps,
    getComponentByType,
    getFieldOptions,
    getActionComponent,
    handleAction,
    handleFieldChange,
    handleFieldBlur,
  };
}
