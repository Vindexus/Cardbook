import Handlebars, { type HelperDelegate } from "handlebars";
import { errorMessage, type TemplateError } from "../errors";
import { convertMarkupToHandlebarsTemplate } from "../parser";
import { parseTemplate } from "../parseTemplate";

export type TemplateData = Record<string, unknown>;

export type TemplaterConfig = {
	// Template markup by name
	templates: Record<string, string>;
	// Available in every template under `_`. Eg {{_.healBig}}
	globalData?: TemplateData;
	// Partial markup by name, used with {{> name}}
	partials?: Record<string, string>;
	helpers?: Record<string, HelperDelegate>;
};

export type RenderedTemplate = {
	html: string;
	// Classes for the element wrapping the piece
	classes: string;
	styles: string;
};

export type RenderResult =
	| { success: true; data: RenderedTemplate }
	| { success: false; error: TemplateError };

export type Templater = {
	getHTML: (templateName: string, data: TemplateData) => RenderResult;
	addPartial: (name: string, markup: string) => void;
	setGlobalData: (globalData: TemplateData) => void;
};

type CompiledTemplate = {
	render: Handlebars.TemplateDelegate;
	renderClasses: Handlebars.TemplateDelegate;
	styles: string;
};

// Strict mode makes a missing variable a render error instead of an empty
// string. Block helpers like #if and #each still allow missing fields.
const compileOptions: CompileOptions = { strict: true };

// Strict mode errors print the data object, which stringifies uselessly
const strictModeContextNoise = " in [object Object]";

/**
 * Creates a templater that renders template markup to HTML. Each templater has
 * its own Handlebars instance, so partials and helpers don't leak between them.
 * @param config - The templates, global data, partials, and helpers to start with
 */
export function createTemplater(config: TemplaterConfig): Templater {
	const handlebars = Handlebars.create();
	let globalData = config.globalData ?? {};
	const compiledTemplates = new Map<string, CompiledTemplate | TemplateError>();

	for (const [name, helper] of Object.entries(config.helpers ?? {})) {
		handlebars.registerHelper(name, helper);
	}

	const addPartial = (name: string, markup: string) => {
		try {
			handlebars.registerPartial(
				name,
				convertMarkupToHandlebarsTemplate(markup),
			);
		} catch (error) {
			// Only templates that use a broken partial should fail, so the error
			// waits until the partial is rendered
			const message = `Partial "${name}": ${errorMessage(error)}`;
			handlebars.registerPartial(name, () => {
				throw new Error(message);
			});
		}
	};

	for (const [name, markup] of Object.entries(config.partials ?? {})) {
		addPartial(name, markup);
	}

	const compileTemplate = (
		templateName: string,
	): CompiledTemplate | TemplateError => {
		const template = config.templates[templateName];
		if (template === undefined) {
			return {
				kind: "unknownTemplate",
				templateName,
				message: `No template named "${templateName}"`,
			};
		}

		try {
			const parsed = parseTemplate(template);
			// Handlebars compiles lazily, so parse now to report syntax errors as
			// invalid templates rather than render failures
			handlebars.parse(parsed.handlebars);
			handlebars.parse(parsed.classes);
			return {
				render: handlebars.compile(parsed.handlebars, compileOptions),
				renderClasses: handlebars.compile(parsed.classes, compileOptions),
				styles: parsed.styles,
			};
		} catch (error) {
			return {
				kind: "invalidTemplate",
				templateName,
				message: errorMessage(error),
			};
		}
	};

	const getCompiledTemplate = (templateName: string) => {
		const cached = compiledTemplates.get(templateName);
		if (cached !== undefined) {
			return cached;
		}
		const compiled = compileTemplate(templateName);
		compiledTemplates.set(templateName, compiled);
		return compiled;
	};

	const getHTML = (templateName: string, data: TemplateData): RenderResult => {
		const compiled = getCompiledTemplate(templateName);
		if ("kind" in compiled) {
			return { success: false, error: compiled };
		}

		const context = { ...data, _: globalData };
		try {
			return {
				success: true,
				data: {
					html: compiled.render(context),
					classes: compiled.renderClasses(context),
					styles: compiled.styles,
				},
			};
		} catch (error) {
			// TODO: Handlebars reports positions in the compiled output, which don't match markup line numbers
			return {
				success: false,
				error: {
					kind: "renderFailed",
					templateName,
					message: errorMessage(error).replace(strictModeContextNoise, ""),
				},
			};
		}
	};

	return {
		getHTML,
		addPartial,
		setGlobalData: (newGlobalData) => {
			globalData = newGlobalData;
		},
	};
}
