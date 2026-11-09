import type { TestCase } from "@vinforge/types";
import { describe, expect, it } from "vitest";
import { convertMarkupToHandlebarsTemplate } from "./parser";

describe("convertMarkupToHandlebarsTemplate", () => {
	const testCases: TestCase<string, { output: string } | { error: RegExp }>[] =
		[
			{
				given: "an empty template",
				when: "converted",
				then: "the output is empty",
				input: "",
				expect: { output: "" },
			},
			{
				given: "a header with a direct variable and inline content",
				when: "converted",
				then: "= name becomes plain {{name}} with no markdown helper",
				input: "\n.header\n\t.title= name\n\t.qty x{{qty}}\n",
				expect: {
					output: [
						'<div class="header">',
						'\t<div class="title">{{name}}</div>',
						'\t<div class="qty">x{{qty}}</div>',
						"</div>",
					].join("\n"),
				},
			},
			{
				given: "a direct variable",
				when: "converted",
				then: "it matches writing {{name}} nested under the element",
				input: ".title= name",
				expect: { output: '<div class="title">{{name}}</div>' },
			},
			{
				given: "deeply nested elements, content, and dotted variables",
				when: "converted",
				then: "every element closes at the right depth",
				input: [
					".card",
					"\t#description",
					"\t\tThe description:",
					"\t\t{{description}}",
					'\t\t#flavor-text.small.italic "{{flavor}}"',
					"\t\t.author",
					"\t\t\t.author-name= author.name",
					"\t\t\t.author-title= author.title",
					"\t#stats",
					"\t\t#attack= attack",
					"\t\t.explanation",
					"\t\t\t{{explanation}}",
					"\t#footer= footer",
				].join("\n"),
				expect: {
					output: [
						'<div class="card">',
						'\t<div id="description">',
						"\t\tThe description:",
						"\t\t{{description}}",
						'\t\t<div id="flavor-text" class="small italic">"{{flavor}}"</div>',
						'\t\t<div class="author">',
						'\t\t\t<div class="author-name">{{author.name}}</div>',
						'\t\t\t<div class="author-title">{{author.title}}</div>',
						"\t\t</div>",
						"\t</div>",
						'\t<div id="stats">',
						'\t\t<div id="attack">{{attack}}</div>',
						'\t\t<div class="explanation">',
						"\t\t\t{{explanation}}",
						"\t\t</div>",
						"\t</div>",
						'\t<div id="footer">{{footer}}</div>',
						"</div>",
					].join("\n"),
				},
			},
			{
				given: "two root elements",
				when: "converted",
				then: "both are closed",
				input:
					".section\n  .header= title\n  .cost.text-right 7\n.section\n  .description= description",
				expect: {
					output: [
						'<div class="section">',
						'\t<div class="header">{{title}}</div>',
						'\t<div class="cost text-right">7</div>',
						"</div>",
						'<div class="section">',
						'\t<div class="description">{{description}}</div>',
						"</div>",
					].join("\n"),
				},
			},
			{
				given: "indentation with double spaces",
				when: "converted",
				then: "each pair of spaces is one level",
				input:
					".container\n  .indented-with-two-spaces\n    .indented-with-four= title",
				expect: {
					output: [
						'<div class="container">',
						'\t<div class="indented-with-two-spaces">',
						'\t\t<div class="indented-with-four">{{title}}</div>',
						"\t</div>",
						"</div>",
					].join("\n"),
				},
			},
			{
				given:
					"the old poker card template with Tailwind classes and an #each block",
				when: "converted",
				then: "slashes in classes and Handlebars blocks pass through",
				input:
					".section.absolute-center.h-2/3.w-2/3\n\t{{#each icons}}{{../suitLetter}}{{/each}}",
				expect: {
					output: [
						'<div class="section absolute-center h-2/3 w-2/3">',
						"\t{{#each icons}}{{../suitLetter}}{{/each}}",
						"</div>",
					].join("\n"),
				},
			},
			{
				given: "a class name with a quote in it",
				when: "converted",
				then: "the quote is escaped so it can't add attributes",
				input: '.x"onclick="alert(1)',
				expect: {
					output: '<div class="x&quot;onclick=&quot;alert(1)">\n</div>',
				},
			},
			{
				given: "a child indented two levels deeper than its parent",
				when: "converted",
				then: "it throws with the line number",
				input: "\n.description\n\t\t.name= name",
				expect: { error: /^Line 3: Too many indents/ },
			},
			{
				given:
					"a line indented under an element that already has inline content",
				when: "converted",
				then: "it throws, because only open elements can have children",
				input: ".title Hello\n\tmore text",
				expect: { error: /^Line 2: Too many indents/ },
			},
			{
				given: "a template whose first line is indented",
				when: "converted",
				then: "it throws",
				input: "\t.foo\n.bar",
				expect: { error: /^Line 1: Too many indents/ },
			},
			{
				given: "comments and blank lines before an error",
				when: "converted",
				then: "the line number still points at the original line",
				input: "// comment\n\n.a\n\t\t.b",
				expect: { error: /^Line 4: Too many indents/ },
			},
		];

	for (const testCase of testCases) {
		it(`GIVEN: ${testCase.given} WHEN: ${testCase.when} THEN: ${testCase.then}`, () => {
			if ("error" in testCase.expect) {
				expect(() => convertMarkupToHandlebarsTemplate(testCase.input)).toThrow(
					testCase.expect.error,
				);
				return;
			}
			expect(convertMarkupToHandlebarsTemplate(testCase.input)).toBe(
				testCase.expect.output,
			);
		});
	}
});
