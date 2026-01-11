import type { Preview } from "@storybook/react-vite";

const preview: Preview = {
	parameters: {
		controls: {
			disableSaveFromUI: true,
		},
		//layout: 'fullscreen',
	},
};

export default preview;
