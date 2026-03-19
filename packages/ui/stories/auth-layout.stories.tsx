import type { Meta, StoryObj } from "@storybook/react";
import { AuthLayout } from "../src/auth/AuthLayout";
import { AuthCard } from "../src/auth/AuthCard";

const meta: Meta<typeof AuthLayout> = {
  title: "Components/Auth/AuthLayout",
  component: AuthLayout,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;

type Story = StoryObj<typeof AuthLayout>;

export const Default: Story = {
  args: {
    children: (
      <AuthCard
        title="Sign In"
        description="Enter your credentials to continue"
      >
        <div className="space-y-4">
          <div className="h-10 bg-white/10 rounded animate-pulse" />
          <div className="h-10 bg-white/10 rounded animate-pulse" />
          <div className="h-10 bg-primary rounded" />
        </div>
      </AuthCard>
    ),
  },
};

export const Minimal: Story = {
  args: {
    minimal: true,
    children: (
      <AuthCard title="Quick Sign In">
        <div className="space-y-4">
          <div className="h-10 bg-muted rounded animate-pulse" />
          <div className="h-10 bg-muted rounded animate-pulse" />
          <div className="h-10 bg-primary rounded" />
        </div>
      </AuthCard>
    ),
  },
};
