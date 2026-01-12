import type { Meta, StoryObj } from '@storybook/react-vite';
import { Piece } from "../components/Piece";
import { Decorator } from "../components/Decorator";
import { Card } from "./Card";

const meta = {
	title: 'Cardbook/card',
	component: card,
  decorators: [
    (Story) => <Decorator><Piece><Story /></Piece></Decorator>
  ]
} satisfies Meta<typeof card>;

export default meta;
type Story = StoryObj<typeof meta>


export const item000 : Story = {
		args: {
  "name": "Item"
}
}


export const colins_card001 : Story = {
		args: {
  "name": "Colin's Card",
  "qty": 3
}
}
