import type { Meta, StoryObj } from '@storybook/react-vite';
import { Decorator } from "../components/Decorator";
import { PieceList } from "../components/PieceList";

const meta = {
	title: 'Cardbook/lists',
	component: PieceList,
  decorators: [
    (Story) => <Decorator><Story /></Decorator>
  ]
} satisfies Meta<typeof PieceList>;

export default meta;
type Story = StoryObj<typeof meta>

export const All : Story = {
		args: {
			items: [{"id":"Item-1","name":"Item"},{"id":"Colin's Card-1","name":"Colin's Card","qty":3},{"id":"Colin's Card-2","name":"Colin's Card","qty":3},{"id":"Colin's Card-3","name":"Colin's Card","qty":3}]
		}
}
