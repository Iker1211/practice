import * as React from "react";
import { Input, type InputProps } from "../input";
import { SPACING, TYPOGRAPHY } from "../design";
import { cn } from "../lib/utils";

export interface FormFieldProps extends Omit<InputProps, "id"> {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
}

const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, error, hint, required, className, ...props }, ref) => {
    const id = React.useId();

    return (
      <div className="flex flex-col gap-1 w-full">
        <label
          htmlFor={id}
          className={cn(
            "text-sm font-medium text-foreground",
            "transition-colors",
            error && "text-destructive"
          )}
        >
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>

        <Input
          id={id}
          ref={ref}
          className={cn(
            "transition-colors",
            error && "border-destructive focus-visible:ring-destructive"
          )}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          {...props}
        />

        {error && (
          <p
            id={`${id}-error`}
            className="text-sm text-destructive font-medium animate-in fade-in duration-200"
          >
            {error}
          </p>
        )}

        {hint && !error && (
          <p
            id={`${id}-hint`}
            className="text-sm text-muted-foreground"
          >
            {hint}
          </p>
        )}
      </div>
    );
  }
);

FormField.displayName = "FormField";

export { FormField };
