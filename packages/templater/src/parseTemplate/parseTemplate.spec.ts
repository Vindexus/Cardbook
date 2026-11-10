import type { TestCase } from "@vinforge/types";
import { describe, expect, it } from "vitest";
import { type ParsedTemplate, parseTemplate } from "./parseTemplate";

describe("parseTemplate", () => {
	const testCases: TestCase<
		string,
		{ parsed: ParsedTemplate } | { error: RegExp }
	>[] = [
		{
			given: "markup with no directives",
			when: "parsed",
			then: "it's compiled with no classes or styles",
			input: ".title= name",
			expect: {
				parsed: {
					handlebars: '<div class="title">{{name}}</div>',
					classes: "",
					styles: "",
				},
			},
		},
		{
			given: "a _classes line",
			when: "parsed",
			then: "its classes are pulled out and it's left out of the markup",
			input: "_classes suit-{{suit}} big\n.title= name",
			expect: {
				parsed: {
					handlebars: '<div class="title">{{name}}</div>',
					classes: "suit-{{suit}} big",
					styles: "",
				},
			},
		},
		{
			given: "a _classes line with a dotted variable",
			when: "parsed",
			then: "the dot stays part of the variable",
			input: "_classes suit-{{card.suit}}\n.title= name",
			expect: {
				parsed: {
					handlebars: '<div class="title">{{name}}</div>',
					classes: "suit-{{card.suit}}",
					styles: "",
				},
			},
		},
		{
			given: "a style line followed by CSS",
			when: "parsed",
			then: "everything after it is styles, not markup",
			input: ".title= name\nstyle\n.title {\n\tcolor: red;\n}\n",
			expect: {
				parsed: {
					handlebars: '<div class="title">{{name}}</div>',
					classes: "",
					styles: ".title {\n\tcolor: red;\n}",
				},
			},
		},
		{
			given: "a class name containing the word style",
			when: "parsed",
			then: "it stays in the markup",
			input: ".style-box\n\t.stylish= name",
			expect: {
				parsed: {
					handlebars:
						'<div class="style-box">\n\t<div class="stylish">{{name}}</div>\n</div>',
					classes: "",
					styles: "",
				},
			},
		},
		{
			given: "the old poker template with Windows line endings",
			when: "parsed",
			then: "the carriage returns don't leak into the output",
			input:
				"_classes suit-{{suit}}\r\n.corner\r\n\t.value= value\r\n\t.suit= suit\r\n",
			expect: {
				parsed: {
					handlebars:
						'<div class="corner">\n\t<div class="value">{{value}}</div>\n\t<div class="suit">{{suit}}</div>\n</div>',
					classes: "suit-{{suit}}",
					styles: "",
				},
			},
		},
		{
			given: "invalid markup below a _classes line",
			when: "parsed",
			then: "the error has the original line number",
			input: "_classes big\n.a\n\t\t.b",
			expect: { error: /^Line 3: Too many indents/ },
		},
		{
			given: "two _classes lines",
			when: "parsed",
			then: "it throws, naming both lines",
			input: "_classes a\n.title\n_classes b",
			expect: { error: /^Line 3: only one _classes line .* line 1$/ },
		},
	];

	for (const testCase of testCases) {
		it(`GIVEN: ${testCase.given} WHEN: ${testCase.when} THEN: ${testCase.then}`, () => {
			if ("error" in testCase.expect) {
				expect(() => parseTemplate(testCase.input)).toThrow(
					testCase.expect.error,
				);
				return;
			}
			expect(parseTemplate(testCase.input)).toEqual(testCase.expect.parsed);
		});
	}
});
