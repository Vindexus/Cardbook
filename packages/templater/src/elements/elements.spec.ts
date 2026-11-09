import type { TestCase } from "@vinforge/types";
import { describe, expect, it } from "vitest";
import {
	elementToOpenHTML,
	type MarkupElement,
	parseElementSelector,
} from "./elements";

describe("parseElementSelector", () => {
	const testCases: TestCase<
		string,
		{ element: MarkupElement } | { error: RegExp }
	>[] = [
		{
			given: "a class selector",
			when: "parsed",
			then: "it has the class and no ID",
			input: ".title",
			expect: { element: { id: "", cssClasses: ["title"] } },
		},
		{
			given: "several classes",
			when: "parsed",
			then: "all classes are kept in order",
			input: ".right.bold",
			expect: { element: { id: "", cssClasses: ["right", "bold"] } },
		},
		{
			given: "an ID selector",
			when: "parsed",
			then: "it has the ID and no classes",
			input: "#header",
			expect: { element: { id: "header", cssClasses: [] } },
		},
		{
			given: "an ID followed by classes",
			when: "parsed",
			then: "it has both",
			input: "#header.right.bold",
			expect: { element: { id: "header", cssClasses: ["right", "bold"] } },
		},
		{
			given: "Tailwind classes containing a slash",
			when: "parsed",
			then: "the slash is kept as part of the class",
			input: ".h-2/3.w-2/3",
			expect: { element: { id: "", cssClasses: ["h-2/3", "w-2/3"] } },
		},
		{
			given: "an ID after a class",
			when: "parsed",
			then: "it throws, because the ID must come first",
			input: ".header#header",
			expect: { error: /must start with #/ },
		},
		{
			given: "a selector without # or .",
			when: "parsed",
			then: "it throws",
			input: "header",
			expect: { error: /must start with either # or \./ },
		},
		{
			given: "an empty ID",
			when: "parsed",
			then: "it throws",
			input: "#.title",
			expect: { error: /ID must be a single non-empty name/ },
		},
		{
			given: "two IDs",
			when: "parsed",
			then: "it throws",
			input: "#one#two",
			expect: { error: /ID must be a single non-empty name/ },
		},
		{
			given: "an empty class between two dots",
			when: "parsed",
			then: "it throws",
			input: ".foo..bar",
			expect: { error: /class names can't be empty/ },
		},
		{
			given: "a lone dot",
			when: "parsed",
			then: "it throws",
			input: ".",
			expect: { error: /class names can't be empty/ },
		},
	];

	for (const testCase of testCases) {
		it(`GIVEN: ${testCase.given} WHEN: ${testCase.when} THEN: ${testCase.then}`, () => {
			if ("error" in testCase.expect) {
				expect(() => parseElementSelector(testCase.input)).toThrow(
					testCase.expect.error,
				);
				return;
			}
			expect(parseElementSelector(testCase.input)).toEqual(
				testCase.expect.element,
			);
		});
	}
});

describe("elementToOpenHTML", () => {
	const testCases: TestCase<MarkupElement, string>[] = [
		{
			given: "an element with only an ID",
			when: "opened",
			then: "it has an id attribute",
			input: { id: "header", cssClasses: [] },
			expect: '<div id="header">',
		},
		{
			given: "an element with an ID and classes",
			when: "opened",
			then: "it has both attributes",
			input: { id: "header", cssClasses: ["right", "bold"] },
			expect: '<div id="header" class="right bold">',
		},
		{
			given: "an element with only classes",
			when: "opened",
			then: "it has a class attribute",
			input: { id: "", cssClasses: ["right", "bold"] },
			expect: '<div class="right bold">',
		},
		{
			given: "a class containing quotes and angle brackets",
			when: "opened",
			then: "they're escaped so they can't break out of the attribute",
			input: { id: "", cssClasses: ['x"onclick="alert(1)<b>'] },
			expect: '<div class="x&quot;onclick=&quot;alert(1)&lt;b&gt;">',
		},
		{
			given: "an ID containing an ampersand",
			when: "opened",
			then: "the ampersand is escaped",
			input: { id: "a&b", cssClasses: [] },
			expect: '<div id="a&amp;b">',
		},
	];

	for (const testCase of testCases) {
		it(`GIVEN: ${testCase.given} WHEN: ${testCase.when} THEN: ${testCase.then}`, () => {
			expect(elementToOpenHTML(testCase.input)).toBe(testCase.expect);
		});
	}
});
