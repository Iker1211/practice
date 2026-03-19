import * as React from "react";
import { ANIMATIONS } from "../design";
import { cn } from "../lib/utils";

export type PasswordStrength = "weak" | "medium" | "strong";

export interface PasswordStrengthIndicatorProps {
  strength: PasswordStrength;
  password?: string;
}

const strengthConfig = {
  weak: {
    label: "Weak password",
    color: "bg-destructive",
    filled: 1,
  },
  medium: {
    label: "Medium strength",
    color: "bg-yellow-500",
    filled: 2,
  },
  strong: {
    label: "Strong password",
    color: "bg-green-500",
    filled: 3,
  },
};

export function PasswordStrengthIndicator({
  strength,
  password,
}: PasswordStrengthIndicatorProps) {
  const config = strengthConfig[strength];

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-1 h-1.5">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className={cn(
              "flex-1 rounded-full transition-all duration-300",
              i < config.filled ? config.color : "bg-muted"
            )}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        {config.label}
      </p>
    </div>
  );
}

/**
 * Analyze password strength
 * Basic implementation - adjust thresholds as needed
 */
export function analyzePasswordStrength(
  password: string
): PasswordStrength {
  if (!password) return "weak";

  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(
    password
  );
  const isLongEnough = password.length >= 8;

  const strengthScore = [
    hasUppercase,
    hasLowercase,
    hasNumbers,
    hasSpecialChars,
    isLongEnough,
  ].filter(Boolean).length;

  if (strengthScore >= 4) return "strong";
  if (strengthScore >= 2) return "medium";
  return "weak";
}
