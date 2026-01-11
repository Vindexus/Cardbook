import type { Meta, StoryObj } from "@storybook/react-vite";
import { Decorator } from "../components/Decorator";
import { HelloWorld } from "./Hello";

const meta = {
	title: "Cardbook/HelloWorld",
	component: HelloWorld,
	decorators: [
		(Story) => (
			<Decorator>
				<Story />
			</Decorator>
		),
	],
} satisfies Meta<typeof HelloWorld>;

export default meta;
type Story = StoryObj<typeof meta>;

export const World: Story = {};
export const Colin: Story = {
	args: { name: "Colin" },
};
