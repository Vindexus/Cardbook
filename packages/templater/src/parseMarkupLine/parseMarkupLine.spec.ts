import type { TestCase } from "@vinforge/types";
import { describe, expect, it } from "vitest";
import {
	type NumberedLine,
	type ParsedLine,
	parseMarkupLine,
	parseMarkupLines,
} from "./parseMarkupLine";

describe("parseMarkupLine", () => {
	const testCases: TestCase<
		string,
		{ line: Partial<ParsedLine> } | { error: RegExp }
	>[] = [
		{
			given: "a bare element name",
			when: "parsed",
			then: "it's content, with a warning to use an ID or class",
			input: "div",
			expect: {
				line: {
					type: "content",
					content: "div",
					warnings: ["Avoid using elements with no ids or classes"],
				},
			},
		},
		{
			given: "plain text with no indentation",
			when: "parsed",
			then: "it's content with 0 indents",
			input: "Hello, world!",
			expect: {
				line: { type: "content", content: "Hello, world!", indents: 0 },
			},
		},
		{
			given: "plain text indented with one tab",
			when: "parsed",
			then: "it's content with 1 indent",
			input: "\tHello, world!",
			expect: {
				line: { type: "content", content: "Hello, world!", indents: 1 },
			},
		},
		{
			given: "plain text indented with two tabs",
			when: "parsed",
			then: "it's content with 2 indents",
			input: "\t\tHello, world!",
			expect: {
				line: { type: "content", content: "Hello, world!", indents: 2 },
			},
		},
		{
			given: "plain text indented with four spaces",
			when: "parsed",
			then: "each pair of spaces counts as one indent",
			input: "    Hello",
			expect: { line: { type: "content", content: "Hello", indents: 2 } },
		},
		{
			given: "text whose first word ends with =",
			when: "parsed",
			then: "it's content, not a direct variable",
			input: "Total= 5",
			expect: { line: { type: "content", content: "Total= 5" } },
		},
		{
			given: "a blank line",
			when: "parsed",
			then: "it's a blank line",
			input: "\t  ",
			expect: { line: { type: "blank", indents: 0 } },
		},
		{
			given: "an ID on its own",
			when: "parsed",
			then: "it opens an element",
			input: "#header",
			expect: {
				line: { type: "open", element: { id: "header", cssClasses: [] } },
			},
		},
		{
			given: "a class followed by =",
			when: "parsed",
			then: "it's a direct variable",
			input: ".header= name",
			expect: {
				line: {
					type: "directVar",
					element: { id: "", cssClasses: ["header"] },
					variable: "name",
				},
			},
		},
		{
			given: "an ID followed by =",
			when: "parsed",
			then: "it's a direct variable",
			input: "#header= name",
			expect: {
				line: {
					type: "directVar",
					element: { id: "header", cssClasses: [] },
					variable: "name",
				},
			},
		},
		{
			given: "an ID and classes followed by =",
			when: "parsed",
			then: "every field is filled in",
			input: "#header.right.bold= name",
			expect: {
				line: {
					type: "directVar",
					raw: "#header.right.bold= name",
					element: { id: "header", cssClasses: ["right", "bold"] },
					warnings: [],
					variable: "name",
					indents: 0,
				},
			},
		},
		{
			given: "an element followed by text",
			when: "parsed",
			then: "it's an element with inline content",
			input: "#header.right.bold My name is {{name}}",
			expect: {
				line: {
					type: "element",
					element: { id: "header", cssClasses: ["right", "bold"] },
					content: "My name is {{name}}",
				},
			},
		},
		{
			given: "an indented element with extra tabs before its text",
			when: "parsed",
			then: "the extra whitespace is collapsed",
			input: "\t#header.right.bold \t\t\t\t\t\tMy name is {{name}}",
			expect: {
				line: {
					type: "element",
					indents: 1,
					content: "My name is {{name}}",
				},
			},
		},
		{
			given: "an ID after a class",
			when: "parsed",
			then: "it throws",
			input: ".header#header",
			expect: { error: /must start with #/ },
		},
		{
			given: "a direct variable with no variable name",
			when: "parsed",
			then: "it throws",
			input: ".title=",
			expect: { error: /exactly one variable name/ },
		},
		{
			given: "a direct variable with two words after the =",
			when: "parsed",
			then: "it throws",
			input: ".title= first second",
			expect: { error: /exactly one variable name/ },
		},
	];

	for (const testCase of testCases) {
		it(`GIVEN: ${testCase.given} WHEN: ${testCase.when} THEN: ${testCase.then}`, () => {
			if ("error" in testCase.expect) {
				expect(() => parseMarkupLine(testCase.input)).toThrow(
					testCase.expect.error,
				);
				return;
			}
			expect(parseMarkupLine(testCase.input)).toMatchObject(
				testCase.expect.line,
			);
		});
	}
});

describe("parseMarkupLines", () => {
	const testCases: TestCase<
		string,
		{ lines: Partial<NumberedLine>[] } | { error: RegExp }
	>[] = [
		{
			given: "two sections with tab-indented children",
			when: "parsed",
			then: "each line has the right indent count",
			input:
				".section\n\t.header= title\n\t.cost.text-right 7\n.section\n\t.description= description",
			expect: {
				lines: [
					{ indents: 0 },
					{ indents: 1 },
					{ indents: 1 },
					{ indents: 0 },
					{ indents: 1 },
				],
			},
		},
		{
			given: "blank lines and // comments",
			when: "parsed",
			then: "they're skipped and the remaining lines keep their original line numbers",
			input: "// header comment\n.card\n\n\t// note\n\t.title= name",
			expect: {
				lines: [
					{ type: "open", lineNumber: 2 },
					{ type: "directVar", lineNumber: 5 },
				],
			},
		},
		{
			given: "Windows line endings",
			when: "parsed",
			then: "the carriage returns aren't part of the variable or content",
			input: ".card\r\n\t.title= name\r\n\tHello\r\n",
			expect: {
				lines: [
					{ type: "open" },
					{ type: "directVar", variable: "name" },
					{ type: "content", content: "Hello" },
				],
			},
		},
		{
			given: "an invalid line after a comment",
			when: "parsed",
			then: "the error includes the original line number",
			input: "// comment\n.card\n\t.title#bad",
			expect: { error: /^Line 3: .*must start with #/ },
		},
	];

	for (const testCase of testCases) {
		it(`GIVEN: ${testCase.given} WHEN: ${testCase.when} THEN: ${testCase.then}`, () => {
			if ("error" in testCase.expect) {
				expect(() => parseMarkupLines(testCase.input)).toThrow(
					testCase.expect.error,
				);
				return;
			}
			expect(parseMarkupLines(testCase.input)).toMatchObject(
				testCase.expect.lines,
			);
		});
	}
});
