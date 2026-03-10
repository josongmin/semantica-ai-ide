import React, { useId } from "react";

import { cn } from "../variants";

export interface FormFieldProps {
  /** Label text shown above the control. */
  label: string;
  /** Additional description below the label. */
  description?: string;
  /** Error message — when set, field is styled in error state. */
  error?: string;
  /** ID assigned to the form control. Auto-generated if omitted. */
  controlId?: string;
  /** Mark as required (adds visual indicator). */
  required?: boolean;
  className?: string;
  /**
   * Render-prop children receive auto-wired a11y attributes.
   * **Recommended** over plain ReactNode to ensure proper id/aria wiring.
   *
   * @example
   * <FormField label="Name" error={errors.name}>
   *   {(props) => <Input {...props} />}
   * </FormField>
   */
  children:
    | React.ReactNode
    | ((props: {
        id: string;
        "aria-describedby"?: string;
        "aria-invalid"?: boolean;
      }) => React.ReactNode);
}

/**
 * FormField wraps a label, description, error message, and a form control.
 *
 * **Use render-prop children** for automatic `id` and `aria-describedby` wiring.
 * Plain ReactNode children still render but won't receive a11y attributes.
 */
export const FormField = React.memo(function FormField({
  label,
  description,
  error,
  controlId,
  required = false,
  className,
  children,
}: FormFieldProps) {
  const autoId = useId();
  const id = controlId ?? autoId;
  const descId = `${id}-desc`;
  const errorId = `${id}-error`;
  const hasError = !!error;

  const describedBy =
    [description ? descId : null, hasError ? errorId : null].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label
        htmlFor={id}
        className={cn(
          "text-xs font-medium text-vsc-text-primary select-none",
          hasError && "text-vsc-error",
        )}
      >
        {label}
        {required && (
          <span className="ml-0.5 text-vsc-error" aria-hidden="true">
            *
          </span>
        )}
      </label>

      {description && (
        <p id={descId} className="text-2xs text-vsc-text-tertiary -mt-0.5">
          {description}
        </p>
      )}

      {typeof children === "function"
        ? children({
            id,
            "aria-describedby": describedBy,
            "aria-invalid": hasError || undefined,
          })
        : children}

      {hasError && (
        <p id={errorId} role="alert" className="text-2xs text-vsc-error">
          {error}
        </p>
      )}
    </div>
  );
});
