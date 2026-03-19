import type { Meta, StoryObj } from "@storybook/react";
import { AuthCard } from "../src/auth/AuthCard";

const meta: Meta<typeof AuthCard> = {
  title: "Components/Auth/AuthCard",
  component: AuthCard,
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof AuthCard>;

export const Default: Story = {
  args: {
    title: "Sign In",
    description: "Enter your credentials to access your account",
    children: (
      <div className="space-y-4">
        <div className="h-10 bg-muted rounded animate-pulse" />
        <div className="h-10 bg-muted rounded animate-pulse" />
        <div className="h-10 bg-muted rounded animate-pulse" />
      </div>
    ),
  },
};

export const NoDescription: Story = {
  args: {
    title: "Create Account",
    children: (
      <div className="space-y-4">
        <div className="h-10 bg-muted rounded animate-pulse" />
        <div className="h-10 bg-muted rounded animate-pulse" />
        <div className="h-10 bg-muted rounded animate-pulse" />
      </div>
    ),
  },
};
