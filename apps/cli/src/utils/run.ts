export function run(fn: () => Promise<void>) {
	fn()
		.then(() => {
			process.exit(0);
		})
		.catch((ex) => {
			console.error(ex);
			process.exit(1);
		});
}
