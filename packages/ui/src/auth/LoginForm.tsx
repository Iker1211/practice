import * as React from "react";
import { FormField } from "./FormField";
import { Button } from "../button";
import { cn } from "../lib/utils";

export interface LoginFormProps {
  onSubmit?: (email: string, password: string) => Promise<void>;
  onSignupClick?: () => void;
  loading?: boolean;
  error?: string;
}

export function LoginForm({
  onSubmit,
  onSignupClick,
  loading,
  error,
}: LoginFormProps) {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [fieldErrors, setFieldErrors] = React.useState<{
    email?: string;
    password?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const validateForm = () => {
    const errors: typeof fieldErrors = {};

    if (!email) {
      errors.email = "Email is required";
    } else if (!email.includes("@")) {
      errors.email = "Please enter a valid email";
    }

    if (!password) {
      errors.password = "Password is required";
    } else if (password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await onSubmit?.(email, password);
    } catch (err) {
      console.error("Login error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
          <p className="text-sm font-medium text-destructive">{error}</p>
        </div>
      )}

      <FormField
        label="Email"
        type="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          if (fieldErrors.email) {
            setFieldErrors((prev) => ({ ...prev, email: undefined }));
          }
        }}
        error={fieldErrors.email}
        required
        disabled={isSubmitting}
      />

      <FormField
        label="Password"
        type="password"
        placeholder="••••••••"
        value={password}
        onChange={(e) => {
          setPassword(e.target.value);
          if (fieldErrors.password) {
            setFieldErrors((prev) => ({ ...prev, password: undefined }));
          }
        }}
        error={fieldErrors.password}
        required
        disabled={isSubmitting}
      />

      <Button
        type="submit"
        className="w-full"
        size="lg"
        disabled={isSubmitting || loading}
      >
        {isSubmitting || loading ? "Signing in..." : "Sign In"}
      </Button>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <div className="flex-1 h-px bg-border" />
        <span>Don't have an account?</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        size="lg"
        onClick={onSignupClick}
        disabled={isSubmitting || loading}
      >
        Create Account
      </Button>
    </form>
  );
}
