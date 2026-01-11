import type { Preview } from "@storybook/react-vite";
import "../src/styles/index.css";

const preview: Preview = {
	parameters: {
		controls: {
			disableSaveFromUI: true,
		},
		//layout: 'fullscreen',
	},
};

export default preview;
