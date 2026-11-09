export type MarkupElement = {
	id: string;
	cssClasses: string[];
};

/**
 * Parses a selector like `#header.right.bold` or `.title` into an element.
 * @param selector - Must start with `#` (an ID, then optional classes) or `.` (classes only)
 */
export function parseElementSelector(selector: string): MarkupElement {
	const hasMisplacedId = !selector.startsWith("#") && selector.includes("#");
	if (hasMisplacedId) {
		throw new Error(
			`"${selector}": if you want an ID, the selector must start with #`,
		);
	}

	if (selector.startsWith("#")) {
		const [idPart = "", ...cssClasses] = selector.split(".");
		const id = idPart.slice(1);
		if (id === "" || id.includes("#")) {
			throw new Error(`"${selector}": the ID must be a single non-empty name`);
		}
		assertNoEmptyClasses(selector, cssClasses);
		return { id, cssClasses };
	}

	if (!selector.startsWith(".")) {
		throw new Error(`"${selector}": a selector must start with either # or .`);
	}

	const cssClasses = selector.slice(1).split(".");
	assertNoEmptyClasses(selector, cssClasses);
	return { id: "", cssClasses };
}

/**
 * Builds the opening `<div>` tag for an element, with its ID and classes escaped.
 * @param element - The element to open
 */
export function elementToOpenHTML(element: MarkupElement): string {
	const idAttribute = element.id ? ` id="${escapeAttribute(element.id)}"` : "";
	const hasClasses = element.cssClasses.length > 0;
	const classAttribute = hasClasses
		? ` class="${escapeAttribute(element.cssClasses.join(" "))}"`
		: "";
	return `<div${idAttribute}${classAttribute}>`;
}

function assertNoEmptyClasses(selector: string, cssClasses: string[]) {
	if (cssClasses.includes("")) {
		throw new Error(`"${selector}": class names can't be empty`);
	}
}

// Selectors come from template authors and can contain any non-space
// character (Tailwind uses "/", ":", "[" and "]"), so escape instead of
// restricting them
function escapeAttribute(value: string): string {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll('"', "&quot;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;");
}
