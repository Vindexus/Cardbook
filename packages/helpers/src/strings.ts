/**
 * Splits a string by spaces, but ignores spaces inside double quotes, and
 * spaces that have been escaped
 * @param input
 */
export function splitBySpaces(input: string): string[] {
	const regex = /(?:[^\s"\\]+|\\.|"(?:\\"|[^"])*")+/g;
	const matches = input.match(regex) || [];
	return matches.map((token) =>
		token.replace(/\\ /g, " ").replace(/\\"/g, '"'),
	);
}

export function countAndRemoveIndentation(line: string): {
	count: number;
	result: string;
} {
	if (line.startsWith("  ")) {
		return countAndRemoveDoubleSpaces(line);
	}

	return countAndRemoveTabs(line);
}

export function countAndRemoveTabs(line: string): {
	count: number;
	result: string;
} {
	const match = line.match(/^\t+/);
	const count = match ? match[0].length : 0;
	const result = line.replace(/^\t+/, "");
	return { count, result };
}

export function countAndRemoveDoubleSpaces(line: string): {
	count: number;
	result: string;
} {
	const match = line.match(/^(?: {2})+/);
	// Each "count" is per *pair* of spaces
	const count = match ? match[0].length / 2 : 0;
	const result = line.replace(/^(?: {2})+/, "");
	return { count, result };
}

export function slugify(str: string) {
	return str
		.toLowerCase()
		.trim()
		.replace(/\s+/g, "_")
		.replace(/[^a-z0-9_-]/g, "");
}
