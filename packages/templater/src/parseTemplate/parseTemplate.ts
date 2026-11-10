import { convertMarkupToHandlebarsTemplate } from "../parser";

export type ParsedTemplate = {
	// The markup compiled to a Handlebars template string
	handlebars: string;
	// A Handlebars string for classes on the piece's wrapper element. Eg "suit-{{suit}}"
	classes: string;
	// Raw CSS from the style section
	styles: string;
};

const classesDirective = "_classes";
const styleDirective = "style";

/**
 * Splits a template into its markup, `_classes` line, and `style` section,
 * and compiles the markup to Handlebars. Throws with the line number when the
 * markup is invalid.
 * @param template - The full template text
 */
export function parseTemplate(template: string): ParsedTemplate {
	const lines = template.split(/\r?\n/);
	const styleLineIndex = lines.findIndex(
		(line) => line.trimEnd() === styleDirective,
	);
	const hasStyles = styleLineIndex !== -1;
	const markupLines = hasStyles ? lines.slice(0, styleLineIndex) : lines;
	const styleLines = hasStyles ? lines.slice(styleLineIndex + 1) : [];

	let classes = "";
	let classesLineNumber = 0;
	// Blank out the directive instead of removing it, so markup errors keep
	// their original line numbers
	const markupWithoutClasses = markupLines.map((line, index) => {
		if (!isClassesLine(line)) {
			return line;
		}
		if (classesLineNumber !== 0) {
			throw new Error(
				`Line ${index + 1}: only one ${classesDirective} line is allowed, but there's already one on line ${classesLineNumber}`,
			);
		}
		classesLineNumber = index + 1;
		classes = line.slice(classesDirective.length).trim();
		return "";
	});

	return {
		handlebars: convertMarkupToHandlebarsTemplate(
			markupWithoutClasses.join("\n"),
		),
		classes,
		styles: styleLines.join("\n").trim(),
	};
}

function isClassesLine(line: string): boolean {
	const trimmed = line.trimEnd();
	return (
		trimmed === classesDirective || trimmed.startsWith(`${classesDirective} `)
	);
}
