import type { TestCase } from "@vinforge/types";
import Handlebars from "handlebars";
import { describe, expect, it } from "vitest";
import {
	createTemplater,
	type RenderResult,
	type Templater,
	type TemplaterConfig,
} from "./templater";

type TemplaterInput = {
	config: TemplaterConfig;
	render: (templater: Templater) => RenderResult;
};

type ExpectedError = { kind: string; message: RegExp };

describe("createTemplater", () => {
	const testCases: TestCase<
		TemplaterInput,
		| { html: string; classes?: string; styles?: string }
		| { error: ExpectedError }
	>[] = [
		{
			given: "a template with a direct variable",
			when: "rendered with data",
			then: "the variable is filled in",
			input: {
				config: { templates: { item: ".title= name" } },
				render: (templater) => templater.getHTML("item", { name: "Sword" }),
			},
			expect: { html: '<div class="title">Sword</div>' },
		},
		{
			given: "data containing HTML",
			when: "rendered",
			then: "the HTML is escaped",
			input: {
				config: { templates: { item: ".title= name" } },
				render: (templater) =>
					templater.getHTML("item", { name: "<script>x</script>" }),
			},
			expect: {
				html: '<div class="title">&lt;script&gt;x&lt;/script&gt;</div>',
			},
		},
		{
			given: "a template using global data",
			when: "rendered",
			then: "{{_.name}} reads from the global data",
			input: {
				config: {
					templates: { potion: ".text Restore {{_.healBig}} health" },
					globalData: { healBig: 50 },
				},
				render: (templater) => templater.getHTML("potion", {}),
			},
			expect: { html: '<div class="text">Restore 50 health</div>' },
		},
		{
			given: "new global data",
			when: "rendered again",
			then: "the new values are used",
			input: {
				config: {
					templates: { potion: ".heal= _.healBig" },
					globalData: { healBig: 50 },
				},
				render: (templater) => {
					templater.getHTML("potion", {});
					templater.setGlobalData({ healBig: 75 });
					return templater.getHTML("potion", {});
				},
			},
			expect: { html: '<div class="heal">75</div>' },
		},
		{
			given: "a template using a partial written in markup",
			when: "rendered",
			then: "the partial is compiled and inlined",
			input: {
				config: {
					templates: { item: ".card\n\t{{> flavor}}" },
					partials: { flavor: ".flavor= flavor" },
				},
				render: (templater) =>
					templater.getHTML("item", { flavor: "Smells nice" }),
			},
			expect: {
				html: '<div class="card">\n\t<div class="flavor">Smells nice</div></div>',
			},
		},
		{
			given: "a partial replaced with addPartial",
			when: "rendered again",
			then: "the new partial is used",
			input: {
				config: {
					templates: { item: ".card {{> flavor}}" },
					partials: { flavor: ".old Old" },
				},
				render: (templater) => {
					templater.getHTML("item", {});
					templater.addPartial("flavor", ".new New");
					return templater.getHTML("item", {});
				},
			},
			expect: { html: '<div class="card"><div class="new">New</div></div>' },
		},
		{
			given: "a template using a registered helper",
			when: "rendered",
			then: "the helper's output is used",
			input: {
				config: {
					templates: { item: ".title {{shout name}}" },
					helpers: { shout: (text: string) => text.toUpperCase() },
				},
				render: (templater) => templater.getHTML("item", { name: "sword" }),
			},
			expect: { html: '<div class="title">SWORD</div>' },
		},
		{
			given: "the Longest Road example from the overview",
			when: "rendered with a project icon helper",
			then: "the helper's HTML is inserted unescaped and the rest is filled in",
			input: {
				config: {
					templates: {
						longestRoad:
							".title= name\n.points\n  {{icon _.victory}}\n  .num= points",
					},
					globalData: { victory: "/icons/victory.png" },
					helpers: {
						icon: (src: string) =>
							new Handlebars.SafeString(
								`<img src="${Handlebars.escapeExpression(src)}" class="icon" />`,
							),
					},
				},
				render: (templater) =>
					templater.getHTML("longestRoad", { name: "Longest Road", points: 5 }),
			},
			expect: {
				html: [
					'<div class="title">Longest Road</div>',
					'<div class="points">',
					'\t<img src="/icons/victory.png" class="icon" />',
					'\t<div class="num">5</div>',
					"</div>",
				].join("\n"),
			},
		},
		{
			given: "a template with _classes and a style section",
			when: "rendered",
			then: "the classes are filled in and the styles are returned as written",
			input: {
				config: {
					templates: {
						card: "_classes suit-{{suit}}\n.value= value\nstyle\n.value { color: red; }",
					},
				},
				render: (templater) =>
					templater.getHTML("card", { suit: "hearts", value: "A" }),
			},
			expect: {
				html: '<div class="value">A</div>',
				classes: "suit-hearts",
				styles: ".value { color: red; }",
			},
		},
		{
			given: "an optional field that's missing",
			when: "used in an #if block",
			then: "the block is skipped without an error",
			input: {
				config: {
					templates: { item: ".title= name\n{{#if flavor}}.flavor{{/if}}" },
				},
				render: (templater) => templater.getHTML("item", { name: "Sword" }),
			},
			expect: { html: '<div class="title">Sword</div>\n' },
		},
		{
			given: "an unknown template name",
			when: "rendered",
			then: "it returns an unknownTemplate error",
			input: {
				config: { templates: {} },
				render: (templater) => templater.getHTML("missing", {}),
			},
			expect: {
				error: {
					kind: "unknownTemplate",
					message: /No template named "missing"/,
				},
			},
		},
		{
			given: "invalid markup",
			when: "rendered",
			then: "it returns an invalidTemplate error with the line number",
			input: {
				config: { templates: { item: ".a\n\t\t.b" } },
				render: (templater) => templater.getHTML("item", {}),
			},
			expect: {
				error: {
					kind: "invalidTemplate",
					message: /^Line 2: Too many indents/,
				},
			},
		},
		{
			given: "invalid Handlebars syntax",
			when: "rendered",
			then: "it returns an invalidTemplate error instead of throwing",
			input: {
				config: { templates: { item: ".a {{#if}}" } },
				render: (templater) => templater.getHTML("item", {}),
			},
			expect: { error: { kind: "invalidTemplate", message: /Parse error/ } },
		},
		{
			given: "data missing a variable the template uses",
			when: "rendered",
			then: "it returns a renderFailed error naming the variable",
			input: {
				config: { templates: { item: ".title= name" } },
				render: (templater) => templater.getHTML("item", {}),
			},
			expect: {
				error: { kind: "renderFailed", message: /^"name" not defined - / },
			},
		},
		{
			given: "a missing variable in the _classes line",
			when: "rendered",
			then: "it returns a renderFailed error",
			input: {
				config: { templates: { card: "_classes suit-{{suit}}\n.a Hi" } },
				render: (templater) => templater.getHTML("card", {}),
			},
			expect: {
				error: { kind: "renderFailed", message: /"suit" not defined/ },
			},
		},
		{
			given: "a template using an unknown helper",
			when: "rendered",
			then: "it returns a renderFailed error",
			input: {
				config: { templates: { item: ".a {{markdown name}}" } },
				render: (templater) => templater.getHTML("item", { name: "x" }),
			},
			expect: {
				error: { kind: "renderFailed", message: /"markdown" not defined/ },
			},
		},
		{
			given: "a template using a partial with invalid markup",
			when: "rendered",
			then: "it returns a renderFailed error naming the partial",
			input: {
				config: {
					templates: { item: ".card {{> broken}}" },
					partials: { broken: ".a#b" },
				},
				render: (templater) => templater.getHTML("item", {}),
			},
			expect: {
				error: {
					kind: "renderFailed",
					message: /^Partial "broken": Line 1: .*must start with #/,
				},
			},
		},
		{
			given: "a partial with invalid markup that a template doesn't use",
			when: "that template is rendered",
			then: "it renders normally",
			input: {
				config: {
					templates: { item: ".title= name" },
					partials: { broken: ".a#b" },
				},
				render: (templater) => templater.getHTML("item", { name: "Sword" }),
			},
			expect: { html: '<div class="title">Sword</div>' },
		},
	];

	for (const testCase of testCases) {
		it(`GIVEN: ${testCase.given} WHEN: ${testCase.when} THEN: ${testCase.then}`, () => {
			const result = testCase.input.render(
				createTemplater(testCase.input.config),
			);

			if ("error" in testCase.expect) {
				expect(result.success).toBe(false);
				expect(result).toMatchObject({
					error: {
						kind: testCase.expect.error.kind,
						message: expect.stringMatching(testCase.expect.error.message),
					},
				});
				return;
			}
			expect(result).toMatchObject({ success: true, data: testCase.expect });
		});
	}
});
