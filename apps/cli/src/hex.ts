import { cli } from "cleye";
import { run } from "./utils/run";

run(async () => {
	const argv = cli({
		name: "hex",
		parameters: ["<name>"],
		flags: {
			verbose: { type: Boolean, alias: "v" },
		},
	});

	function log(...args: any[]) {
		if (!argv.flags.verbose) {
			return;
		}
		console.log(...args);
	}

	const name = argv._.name;
	log(`Looking for color with name "${name}"`);
});
