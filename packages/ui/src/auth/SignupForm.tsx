import * as React from "react";
import { FormField } from "./FormField";
import {
  PasswordStrengthIndicator,
  analyzePasswordStrength,
} from "./PasswordStrengthIndicator";
import { Button } from "../button";
import { cn } from "../lib/utils";

export interface SignupFormProps {
  onSubmit?: (email: string, password: string) => Promise<void>;
  onLoginClick?: () => void;
  loading?: boolean;
  error?: string;
  enableDataSync?: boolean;
  onDataSyncChange?: (enabled: boolean) => void;
}

export function SignupForm({
  onSubmit,
  onLoginClick,
  loading,
  error,
  enableDataSync,
  onDataSyncChange,
}: SignupFormProps) {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [dataSync, setDataSync] = React.useState(enableDataSync ?? false);
  const [fieldErrors, setFieldErrors] = React.useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const passwordStrength = analyzePasswordStrength(password);

  const validateForm = () => {
    const errors: typeof fieldErrors = {};

    if (!email) {
      errors.email = "Email is required";
    } else if (!email.includes("@")) {
      errors.email = "Please enter a valid email";
    }

    if (!password) {
      errors.password = "Password is required";
    } else if (password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    }

    if (!confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      if (dataSync !== enableDataSync) {
        onDataSyncChange?.(dataSync);
      }
      await onSubmit?.(email, password);
    } catch (err) {
      console.error("Signup error:", err);
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

      <div className="flex flex-col gap-2">
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
          hint="Must be at least 8 characters"
        />
        {password && (
          <PasswordStrengthIndicator
            strength={passwordStrength}
            password={password}
          />
        )}
      </div>

      <FormField
        label="Confirm Password"
        type="password"
        placeholder="••••••••"
        value={confirmPassword}
        onChange={(e) => {
          setConfirmPassword(e.target.value);
          if (fieldErrors.confirmPassword) {
            setFieldErrors((prev) => ({
              ...prev,
              confirmPassword: undefined,
            }));
          }
        }}
        error={fieldErrors.confirmPassword}
        required
        disabled={isSubmitting}
      />

      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={dataSync}
          onChange={(e) => setDataSync(e.target.checked)}
          disabled={isSubmitting}
          className="w-4 h-4 rounded border-input border"
        />
        <span className="text-sm text-muted-foreground">
          Enable automatic data synchronization across devices
        </span>
      </label>

      <Button
        type="submit"
        className="w-full"
        size="lg"
        disabled={isSubmitting || loading}
      >
        {isSubmitting || loading ? "Creating account..." : "Create Account"}
      </Button>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <div className="flex-1 h-px bg-border" />
        <span>Already have an account?</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        size="lg"
        onClick={onLoginClick}
        disabled={isSubmitting || loading}
      >
        Sign In
      </Button>
    </form>
  );
}
