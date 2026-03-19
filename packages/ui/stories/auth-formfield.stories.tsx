import type { Meta, StoryObj } from "@storybook/react";
import { FormField } from "../src/auth/FormField";

const meta: Meta<typeof FormField> = {
  title: "Components/Auth/FormField",
  component: FormField,
  tags: ["autodocs"],
  argTypes: {
    label: {
      control: { type: "text" },
    },
    error: {
      control: { type: "text" },
    },
    hint: {
      control: { type: "text" },
    },
    required: {
      control: { type: "boolean" },
    },
    disabled: {
      control: { type: "boolean" },
    },
  },
};

export default meta;

type Story = StoryObj<typeof FormField>;

export const Email: Story = {
  args: {
    label: "Email",
    type: "email",
    placeholder: "you@example.com",
    required: true,
  },
};

export const WithHint: Story = {
  args: {
    label: "Password",
    type: "password",
    placeholder: "••••••••",
    hint: "Must be at least 8 characters",
    required: true,
  },
};

export const WithError: Story = {
  args: {
    label: "Email",
    type: "email",
    placeholder: "you@example.com",
    error: "Please enter a valid email address",
    required: true,
  },
};

export const Disabled: Story = {
  args: {
    label: "Email",
    type: "email",
    placeholder: "you@example.com",
    disabled: true,
  },
};
