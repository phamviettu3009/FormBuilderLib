import type { ElementType } from "react";
import type { ComponentBinding } from "../types";
import type { FormAction } from "./schema";

interface FormActionLayout {
  direction?: "horizontal" | "vertical";
  columns?: number;
  gutter?: number;
}

interface FormActionsProps {
  actions: FormAction[];
  layout?: FormActionLayout;
  column?: number;
  span?: number;
  submitting: boolean;
  getActionComponent: (name: string) => {
    component: ElementType;
    binding?: ComponentBinding;
  };
  onAction: (action: FormAction) => void;
}

export function FormActions({
  actions,
  layout,
  column,
  span,
  submitting,
  getActionComponent,
  onAction,
}: FormActionsProps) {
  if (actions.length === 0) {
    return null;
  }

  const columns =
    layout?.direction === "vertical" ? 1 : (layout?.columns ?? actions.length);

  return (
    <div
      className="form-builder-actions"
      style={{
        gap: layout?.gutter ?? 12,
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        gridColumn: column
          ? `${column} / span ${span ?? 1}`
          : span
            ? `span ${span}`
            : undefined,
      }}
    >
      {actions.map((action) => {
        const { component: ActionComponent, binding } = getActionComponent(
          action.useComponent,
        );
        const typeProp = binding?.actionTypeProp ?? "type";
        return (
          <ActionComponent
            key={action.id}
            {...(action.props ?? {})}
            {...{
              [typeProp]: action.type === "submit" ? "submit" : "button",
            }}
            className={`form-builder-action form-builder-action--${action.placement ?? "secondary"} ${typeof action.props?.className === "string" ? action.props.className : ""}`.trim()}
            disabled={
              (typeof action.props?.disabled === "boolean" &&
                action.props.disabled) ||
              (submitting && action.loadingWhileSubmitting === true)
            }
            aria-busy={
              submitting && action.loadingWhileSubmitting ? true : undefined
            }
            onClick={() => onAction(action)}
          >
            {action.props?.children ?? action.label ?? action.id}
          </ActionComponent>
        );
      })}
    </div>
  );
}
