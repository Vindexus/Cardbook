import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { slugify } from "@vinmono/helpers";
import { run } from "./utils/run";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectDir = path.resolve(path.join(__dirname, "../../../project"));
const dataFile = path.join(projectDir, "data.ts");
const templateFile = path.join(projectDir, "template.ts");

run(async () => {
	const storiesDir = path.resolve(
		path.join(__dirname, "../../react/src/stories"),
	);

	console.log("The stories will be saved in", storiesDir);
	console.log("The project is being loaded from", projectDir);

	const helloWorldStoriesFiles = path.join(storiesDir, "Hello.stories.tsx");
	const helloWorldComponentFile = path.join(storiesDir, "Hello.tsx");

	const { getData } = await import(dataFile);
	const { getJSX } = await import(templateFile);

	const data = (await getData()) as any[];
	const rawJSX = getJSX();
	const jsx = rawJSX.split('class="').join('className="');

	const keys = Object.keys(data[0]);

	fs.writeFileSync(
		helloWorldComponentFile,
		`
export const HelloWorld = (data) => {
	const { ${keys.join(",")} } = data;
	return ${jsx}
}`,
	);

	fs.writeFileSync(
		helloWorldStoriesFiles,
		`import type { Meta, StoryObj } from '@storybook/react-vite';
import { Piece } from "../components/Piece";
import { Decorator } from "../components/Decorator";
import { HelloWorld } from "./Hello";

const meta = {
	title: 'Cardbook/HelloWorld',
	component: HelloWorld,
  decorators: [
    (Story) => <Decorator><Piece><Story /></Piece></Decorator>
  ]
} satisfies Meta<typeof HelloWorld>;

export default meta;
type Story = StoryObj<typeof meta>

${data
	.map((item, idx) => {
		const id =
			slugify(item.name ?? "name") + `${idx}`.padStart(3, "0").slice(0, 3);
		return `
export const ${id} : Story = {
		args: ${JSON.stringify(item, null, 2)}
}`;
	})
	.join("\n\n")}
`,
	);
});
