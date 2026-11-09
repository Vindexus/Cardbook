import { elementToOpenHTML, type MarkupElement } from "../elements";
import { type NumberedLine, parseMarkupLines } from "../parseMarkupLine";

/**
 * Converts the PUG-style markup that game designers write into a Handlebars
 * template string. Throws with the line number when the markup is invalid.
 * @param template - The full template markup
 */
export function convertMarkupToHandlebarsTemplate(template: string): string {
	const openElements: MarkupElement[] = [];
	const output: string[] = [];

	const closeElementsDownTo = (depth: number) => {
		while (openElements.length > depth) {
			openElements.pop();
			output.push(`${"\t".repeat(openElements.length)}</div>`);
		}
	};

	for (const line of parseMarkupLines(template)) {
		// Only "open" lines push onto the stack, so this also rejects lines
		// indented under a line that can't have children
		if (line.indents > openElements.length) {
			throw new Error(tooManyIndentsMessage(line, openElements.length));
		}

		closeElementsDownTo(line.indents);
		const indentation = "\t".repeat(line.indents);

		if (line.type === "open") {
			output.push(indentation + elementToOpenHTML(line.element));
			openElements.push(line.element);
			continue;
		}

		if (line.type === "element") {
			output.push(
				`${indentation}${elementToOpenHTML(line.element)}${line.content}</div>`,
			);
			continue;
		}

		if (line.type === "directVar") {
			output.push(
				`${indentation}${elementToOpenHTML(line.element)}{{${line.variable}}}</div>`,
			);
			continue;
		}

		if (line.type === "content") {
			output.push(indentation + line.content);
		}
	}

	closeElementsDownTo(0);
	return output.join("\n");
}

function tooManyIndentsMessage(
	line: NumberedLine,
	allowedIndents: number,
): string {
	return `Line ${line.lineNumber}: Too many indents. This line has ${line.indents}, but at most ${allowedIndents} are allowed here. Only a line with just an element (like ".header") can have indented lines under it: ${line.raw.trim()}`;
}
