import type { Meta, StoryObj } from "@storybook/react";
import {
  PasswordStrengthIndicator,
  analyzePasswordStrength,
} from "../src/auth/PasswordStrengthIndicator";

const meta: Meta<typeof PasswordStrengthIndicator> = {
  title: "Components/Auth/PasswordStrengthIndicator",
  component: PasswordStrengthIndicator,
  tags: ["autodocs"],
  argTypes: {
    strength: {
      control: { type: "select" },
      options: ["weak", "medium", "strong"],
    },
  },
};

export default meta;

type Story = StoryObj<typeof PasswordStrengthIndicator>;

export const Weak: Story = {
  args: {
    strength: "weak",
    password: "pass",
  },
};

export const Medium: Story = {
  args: {
    strength: "medium",
    password: "Password1",
  },
};

export const Strong: Story = {
  args: {
    strength: "strong",
    password: "MySecure@Password123",
  },
};
