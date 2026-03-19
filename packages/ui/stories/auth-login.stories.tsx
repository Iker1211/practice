import type { Meta, StoryObj } from "@storybook/react";
import { LoginForm } from "../src/auth/LoginForm";
import { AuthLayout } from "../src/auth/AuthLayout";
import { AuthCard } from "../src/auth/AuthCard";

const meta: Meta<typeof LoginForm> = {
  title: "Components/Auth/LoginForm",
  component: LoginForm,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <AuthLayout>
        <AuthCard title="Sign In" description="Welcome back">
          <Story />
        </AuthCard>
      </AuthLayout>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof LoginForm>;

export const Default: Story = {
  args: {
    onSubmit: async (email, password) => {
      console.log("Sign in:", { email, password });
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
    onSignupClick: () => console.log("Clicked signup"),
  },
};

export const Loading: Story = {
  args: {
    loading: true,
  },
};

export const WithError: Story = {
  args: {
    error: "Invalid email or password. Please try again.",
    onSubmit: async (email, password) => {
      console.log("Sign in:", { email, password });
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
  },
};

export const Interactive: Story = {
  args: {
    onSubmit: async (email, password) => {
      console.log("Submitting login:", { email, password });
      return new Promise((resolve) => setTimeout(resolve, 1500));
    },
    onSignupClick: () => console.log("Navigate to signup"),
  },
  render: (args) => <LoginForm {...args} />,
};
