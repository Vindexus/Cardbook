import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { cli } from "cleye";
import rootPackageJson from "../package.json";

const monoRepoName = rootPackageJson.name;

const argv = cli({
	name: "add-package",
	parameters: ["<name>"],
});

const packageName = argv._.name;

const packageDir = join("packages", packageName);
const srcDir = join(packageDir, "src");

const packageFullName = `@${monoRepoName}/${packageName}`;

const packageJson = {
	name: packageFullName,
	version: "0.0.0",
	type: "module",
	exports: {
		".": "./src/index.ts",
	},
};

const tsconfig = {
	extends: "../../tsconfig.base.json",
	include: ["src"],
};

const indexTs = `export * from './types'\nexport {};\n`;

async function main() {
	await mkdir(srcDir, { recursive: true });

	await writeFile(
		join(packageDir, "package.json"),
		JSON.stringify(packageJson, null, 2) + "\n",
	);

	await writeFile(
		join(packageDir, "tsconfig.json"),
		JSON.stringify(tsconfig, null, 2) + "\n",
	);

	await writeFile(join(srcDir, "index.ts"), indexTs);
	await writeFile(join(srcDir, "types.ts"), indexTs);

	console.log(`Created package: ${packageFullName}`);
	console.log(`\nNext steps:`);
	console.log(`  cd packages/${packageName}`);
	console.log(`  pnpm install`);
	console.log(
		`Add to package.json dependencies where needed:
	"${packageFullName}": "workspace:*"
Then go back to root and run pnpm install and import like so
import * from "${packageFullName}"`,
	);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
