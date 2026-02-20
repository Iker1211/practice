import type { Meta, StoryObj } from "@storybook/react";
import { Input } from "../src/input";

const meta: Meta<typeof Input> = {
  title: "Components/Input",
  component: Input,
  tags: ["autodocs"],
  argTypes: {
    type: {
      control: { type: "text" },
    },
    placeholder: {
      control: { type: "text" },
    },
  },
};

export default meta;

type Story = StoryObj<typeof Input>;

export const Default: Story = {
  args: {
    placeholder: "Type something...",
  },
};

export const WithLabel: Story = {
  render: (args) => (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <label htmlFor="email">Email</label>
      <Input type="email" id="email" placeholder="Email" {...args} />
    </div>
  ),
};
