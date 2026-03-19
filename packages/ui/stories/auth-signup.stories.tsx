import type { Meta, StoryObj } from "@storybook/react";
import { SignupForm } from "../src/auth/SignupForm";
import { AuthLayout } from "../src/auth/AuthLayout";
import { AuthCard } from "../src/auth/AuthCard";

const meta: Meta<typeof SignupForm> = {
  title: "Components/Auth/SignupForm",
  component: SignupForm,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <AuthLayout>
        <AuthCard title="Create Account" description="Join us today">
          <Story />
        </AuthCard>
      </AuthLayout>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof SignupForm>;

export const Default: Story = {
  args: {
    onSubmit: async (email, password) => {
      console.log("Sign up:", { email, password });
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
    onLoginClick: () => console.log("Clicked sign in"),
    enableDataSync: false,
    onDataSyncChange: (enabled) =>
      console.log("Data sync enabled:", enabled),
  },
};

export const Loading: Story = {
  args: {
    loading: true,
  },
};

export const WithError: Story = {
  args: {
    error: "This email is already registered. Please sign in instead.",
    onSubmit: async (email, password) => {
      console.log("Sign up:", { email, password });
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
  },
};

export const DataSyncEnabled: Story = {
  args: {
    enableDataSync: true,
    onDataSyncChange: (enabled) =>
      console.log("Data sync enabled:", enabled),
    onSubmit: async (email, password) => {
      console.log("Submitting signup with sync:", { email, password });
      return new Promise((resolve) => setTimeout(resolve, 1500));
    },
    onLoginClick: () => console.log("Navigate to login"),
  },
};

export const Interactive: Story = {
  args: {
    onSubmit: async (email, password) => {
      console.log("Submitting signup:", { email, password });
      return new Promise((resolve) => setTimeout(resolve, 1500));
    },
    onLoginClick: () => console.log("Navigate to login"),
    enableDataSync: false,
    onDataSyncChange: (enabled) =>
      console.log("Data sync enabled:", enabled),
  },
  render: (args) => <SignupForm {...args} />,
};
