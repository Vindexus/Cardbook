import { countAndRemoveIndentation, splitBySpaces } from "@vinforge/helpers";
import { type MarkupElement, parseElementSelector } from "../elements";

type LineOpen = {
	// An element with nothing after it, which can have indented children. Eg ".header"
	type: "open";
	element: MarkupElement;
};

type LineElement = {
	// An element with inline content. Eg ".qty x{{qty}}"
	type: "element";
	element: MarkupElement;
	content: string;
};

type LineContent = {
	// Plain text or Handlebars. Eg "This is a {{faction}} card"
	type: "content";
	content: string;
};

type LineDirectVar = {
	// Shorthand for an element containing one variable. Eg ".header= name"
	type: "directVar";
	element: MarkupElement;
	variable: string;
};

type LineBlank = {
	type: "blank";
};

export type ParsedLine = {
	indents: number;
	raw: string;
	warnings: string[];
} & (LineOpen | LineElement | LineContent | LineDirectVar | LineBlank);

export type NumberedLine = ParsedLine & {
	// 1-based line number in the original template
	lineNumber: number;
};

const unnamedElements = ["div", "span", "section"];

/**
 * Parses one line of template markup into its type, indentation, and parts.
 * @param indentedLine - A single line, including its leading tabs or double spaces
 */
export function parseMarkupLine(indentedLine: string): ParsedLine {
	if (indentedLine.trim() === "") {
		return { type: "blank", indents: 0, raw: indentedLine, warnings: [] };
	}

	const warnings: string[] = [];
	const { result: line, count: indents } =
		countAndRemoveIndentation(indentedLine);
	const [firstPiece = "", ...restPieces] = splitBySpaces(line);
	const startsWithSelector =
		firstPiece.startsWith(".") || firstPiece.startsWith("#");

	if (!startsWithSelector) {
		if (unnamedElements.includes(line.trim())) {
			warnings.push("Avoid using elements with no ids or classes");
		}
		return {
			type: "content",
			indents,
			raw: indentedLine,
			warnings,
			content: line,
		};
	}

	if (firstPiece.endsWith("=")) {
		const [variable] = restPieces;
		if (variable === undefined || restPieces.length > 1) {
			throw new Error(
				`"${line}": a direct variable needs exactly one variable name after the =`,
			);
		}
		return {
			type: "directVar",
			indents,
			raw: indentedLine,
			warnings,
			element: parseElementSelector(firstPiece.slice(0, -1)),
			variable,
		};
	}

	const element = parseElementSelector(firstPiece);
	if (restPieces.length === 0) {
		return { type: "open", indents, raw: indentedLine, warnings, element };
	}

	return {
		type: "element",
		indents,
		raw: indentedLine,
		warnings,
		element,
		content: restPieces.join(" "),
	};
}

/**
 * Parses every line of a template, skipping blank lines and `//` comment lines.
 * @param template - The full template markup
 */
export function parseMarkupLines(template: string): NumberedLine[] {
	const numberedLines: NumberedLine[] = [];

	template.split("\n").forEach((rawLine, index) => {
		const lineNumber = index + 1;
		const trimmed = rawLine.trim();
		// TODO: Skipping blank lines may break content where people want empty lines for paragraphs
		if (trimmed === "" || trimmed.startsWith("//")) {
			return;
		}

		try {
			numberedLines.push({ ...parseMarkupLine(rawLine), lineNumber });
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			throw new Error(`Line ${lineNumber}: ${message}`, { cause: error });
		}
	});

	return numberedLines;
}
