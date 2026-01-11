import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { run } from "./utils/run";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
run(async () => {
	const storiesDir = path.resolve(
		path.join(__dirname, "../../react/src/stories"),
	);

	console.log("The stories are in", storiesDir);

	const helloWorldStoriesFiles = path.join(storiesDir, "Hello.stories.tsx");
	const helloWorldComponentFile = path.join(storiesDir, "Hello.tsx");

	fs.writeFileSync(
		helloWorldComponentFile,
		`
export const HelloWorld = ({name = 'world'}) => {
	return <div><span className="bold">Hello,</span> {name}</div>
}`,
	);

	fs.writeFileSync(
		helloWorldStoriesFiles,
		`import type { Meta, StoryObj } from '@storybook/react-vite';
import { HelloWorld } from "./Hello";
import { Decorator } from "../components/Decorator";

const meta = {
	title: 'Cardbook/HelloWorld',
	component: HelloWorld,
  decorators: [
    (Story) => <Decorator><Story /></Decorator>
  ]
} satisfies Meta<typeof HelloWorld>;

export default meta;
type Story = StoryObj<typeof meta>

export const World : Story = {}
export const Colin : Story = {
		args: {name: "Colin"}
}
`,
	);
});
