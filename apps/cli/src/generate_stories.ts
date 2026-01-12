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

	const cardStoriesFiles = path.join(storiesDir, "Card.stories.tsx");
	const listStoriesFile = path.join(storiesDir, "Lists.stories.tsx");
	const cardComponentFile = path.join(storiesDir, "Card.tsx");
	const listComponentFile = path.join(storiesDir, "CardList.tsx");

	const { getData } = await import(dataFile);
	const { getJSX } = await import(templateFile);

	const data = (await getData()) as any[];
	const rawJSX = getJSX();
	const jsx = rawJSX.split('class="').join('className="');

	const keys = Object.keys(data[0]);

	fs.writeFileSync(
		cardComponentFile,
		`
export const Card = (data) => {
	const { ${keys.join(",")} } = data;
	return ${jsx}
}`,
	);

	fs.writeFileSync(
		listComponentFile,
		`
import { Card } from './Card';

type Props = {
		items: {id: string}[]
}

export const CardList = (data: Props) => {
	return <div>
		{data.items.map((item) => {
			return <Card key={item.id} {...item} />
		})}
	</div>
}`,
	);

	fs.writeFileSync(
		cardStoriesFiles,
		`import type { Meta, StoryObj } from '@storybook/react-vite';
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

	const items = data.reduce((acc, itemDef, i) => {
		const num = itemDef.qty ?? 1;
		const idPrefix = itemDef.name ?? `item${i}`;
		console.log("qty", num);
		for (let i = 1; i <= num; i++) {
			acc.push({
				id: `${idPrefix}-${i}`,
				...itemDef,
			});
		}
		return acc;
	}, []);

	console.log(items);

	fs.writeFileSync(
		listStoriesFile,
		`import type { Meta, StoryObj } from '@storybook/react-vite';
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
			items: ${JSON.stringify(items)}
		}
}
`,
	);
});
