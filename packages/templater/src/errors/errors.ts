export type TemplateErrorKind =
	// No template is registered under the requested name
	| "unknownTemplate"
	// The markup or its Handlebars syntax can't be compiled
	| "invalidTemplate"
	// The template compiled, but rendering it with this data failed. Eg a missing variable
	| "renderFailed";

export type TemplateError = {
	kind: TemplateErrorKind;
	templateName: string;
	message: string;
};

export function errorMessage(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}
