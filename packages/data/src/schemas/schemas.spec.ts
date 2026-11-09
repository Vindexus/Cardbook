import type { TestCase } from "@vinforge/types";
import { describe, expect, it } from "vitest";
import type { z } from "zod";
import {
	type ComponentType,
	componentTypeSchema,
	keyStringSchema,
	type Piece,
	pieceSchema,
	type TemplateDef,
	type TopRightBottomLeft,
	templateDefSchema,
	trblSchema,
} from "./schemas";

// errorPath is where the error should point, joined with dots ("" for the root)
type SchemaExpect<TOutput> =
	| { success: true; data: TOutput }
	| { success: false; errorPath: string };

function expectSchemaResult<TOutput>(
	result: z.SafeParseReturnType<unknown, TOutput>,
	expected: SchemaExpect<TOutput>,
) {
	if (!expected.success) {
		expect(result.success).toBe(false);
		const errorPaths = result.error?.issues.map((issue) =>
			issue.path.join("."),
		);
		expect(errorPaths).toContain(expected.errorPath);
		return;
	}

	if (!result.success) {
		expect.fail(`Failed with: ${result.error}`);
	}
	expect(result.data).toMatchObject(expected.data as object);
}

describe("trblSchema (TopRightBottomLeft)", () => {
	const testCases: TestCase<unknown, SchemaExpect<TopRightBottomLeft>>[] = [
		{
			given: "a single number",
			when: "parsed",
			then: "it applies to all four sides",
			input: 10,
			expect: {
				success: true,
				data: { top: 10, right: 10, bottom: 10, left: 10 },
			},
		},
		{
			given: "two comma-separated values",
			when: "parsed",
			then: "the first is top and bottom, the second is right and left",
			input: "10,20",
			expect: {
				success: true,
				data: { top: 10, right: 20, bottom: 10, left: 20 },
			},
		},
		{
			given: "three comma-separated values",
			when: "parsed",
			then: "left copies right, like CSS shorthand",
			input: "10,20,30",
			expect: {
				success: true,
				data: { top: 10, right: 20, bottom: 30, left: 20 },
			},
		},
		{
			given: "four comma-separated values",
			when: "parsed",
			then: "they map to top, right, bottom, left",
			input: "10,20,30,40",
			expect: {
				success: true,
				data: { top: 10, right: 20, bottom: 30, left: 40 },
			},
		},
		{
			given: "an empty string",
			when: "parsed",
			then: "it fails",
			input: "",
			expect: { success: false, errorPath: "" },
		},
		{
			given: "a non-numeric string",
			when: "parsed",
			then: "it fails",
			input: "abc",
			expect: { success: false, errorPath: "" },
		},
	];

	for (const testCase of testCases) {
		it(`GIVEN: ${testCase.given} WHEN: ${testCase.when} THEN: ${testCase.then}`, () => {
			expectSchemaResult(trblSchema.safeParse(testCase.input), testCase.expect);
		});
	}
});

describe("keyStringSchema", () => {
	const testCases: TestCase<unknown, { success: boolean }>[] = [
		{
			given: "a simple key",
			when: "parsed",
			then: "it passes",
			input: "poker",
			expect: { success: true },
		},
		{
			given: "a scoped key",
			when: "parsed",
			then: "it passes",
			input: "@core/poker",
			expect: { success: true },
		},
		{
			given: "an @ in the middle of the key",
			when: "parsed",
			then: "it fails",
			input: "@cc@card",
			expect: { success: false },
		},
		{
			given: "a key starting with a number",
			when: "parsed",
			then: "it fails",
			input: "1poker",
			expect: { success: false },
		},
		{
			given: "an empty string",
			when: "parsed",
			then: "it fails",
			input: "",
			expect: { success: false },
		},
	];

	for (const testCase of testCases) {
		it(`GIVEN: ${testCase.given} WHEN: ${testCase.when} THEN: ${testCase.then}`, () => {
			const result = keyStringSchema.safeParse(testCase.input);
			expect(result.success).toBe(testCase.expect.success);
		});
	}
});

describe("componentTypeSchema", () => {
	const testCases: TestCase<unknown, SchemaExpect<ComponentType>>[] = [
		{
			given: "a component type with no trims",
			when: "parsed",
			then: "trims default to an empty list",
			input: { key: "@cc/card", widthPX: 825, heightPX: 1125 },
			expect: {
				success: true,
				data: { key: "@cc/card", widthPX: 825, heightPX: 1125, trims: [] },
			},
		},
		{
			given: "a component type with trims",
			when: "parsed",
			then: "each trim is expanded to all four sides",
			input: {
				key: "poker",
				widthPX: 850,
				heightPX: 1150,
				trims: [35, "90,40"],
			},
			expect: {
				success: true,
				data: {
					key: "poker",
					widthPX: 850,
					heightPX: 1150,
					trims: [
						{ top: 35, right: 35, bottom: 35, left: 35 },
						{ top: 90, right: 40, bottom: 90, left: 40 },
					],
				},
			},
		},
		{
			given: "an invalid key",
			when: "parsed",
			then: "the error points at the key",
			input: { key: "@cc@card", widthPX: 825, heightPX: 1125 },
			expect: { success: false, errorPath: "key" },
		},
		{
			given: "a negative width",
			when: "parsed",
			then: "the error points at widthPX",
			input: { key: "poker", widthPX: -5, heightPX: 1150 },
			expect: { success: false, errorPath: "widthPX" },
		},
		{
			given: "a height of zero",
			when: "parsed",
			then: "the error points at heightPX",
			input: { key: "poker", widthPX: 850, heightPX: 0 },
			expect: { success: false, errorPath: "heightPX" },
		},
	];

	for (const testCase of testCases) {
		it(`GIVEN: ${testCase.given} WHEN: ${testCase.when} THEN: ${testCase.then}`, () => {
			expectSchemaResult(
				componentTypeSchema.safeParse(testCase.input),
				testCase.expect,
			);
		});
	}
});

describe("pieceSchema", () => {
	const testCases: TestCase<unknown, SchemaExpect<Partial<Piece>>>[] = [
		{
			given: "a piece with a name and no key",
			when: "parsed",
			then: "the key is generated from the name",
			input: {
				name: "My 1st Sword, It Attacks!",
				componentType: "card",
				template: "attack_card",
			},
			expect: {
				success: true,
				data: { key: "my_1st_sword_it_attacks", qty: 1 },
			},
		},
		{
			given: "a name that starts with a number",
			when: "parsed",
			then: "the generated key can start with a number",
			input: { name: "10 Gold", componentType: "card", template: "basic" },
			expect: { success: true, data: { key: "10_gold" } },
		},
		{
			given: "a piece with both a key and a name",
			when: "parsed",
			then: "the explicit key is kept",
			input: {
				key: "sword",
				name: "Big Sword",
				componentType: "card",
				template: "basic",
			},
			expect: { success: true, data: { key: "sword", name: "Big Sword" } },
		},
		{
			given: "a piece with no qty",
			when: "parsed",
			then: "qty defaults to 1",
			input: { name: "test", componentType: "card", template: "basic" },
			expect: { success: true, data: { qty: 1 } },
		},
		{
			given: "a piece with custom data fields",
			when: "parsed",
			then: "the data passes through unchanged",
			input: {
				name: "My Sword",
				componentType: "card",
				template: "attack_card",
				data: {
					elements: ["fire", "cold"],
					description: "This attacks for 10, then 20.",
				},
			},
			expect: {
				success: true,
				data: {
					data: {
						elements: ["fire", "cold"],
						description: "This attacks for 10, then 20.",
					},
				},
			},
		},
		{
			given: "a piece with neither a key nor a name",
			when: "parsed",
			then: "the error points at the key",
			input: { componentType: "card", template: "attack_card" },
			expect: { success: false, errorPath: "key" },
		},
		{
			given: "a name with no letters or numbers",
			when: "parsed",
			then: "the error points at the name, since no key can be made from it",
			input: { name: "!!!", componentType: "card", template: "basic" },
			expect: { success: false, errorPath: "name" },
		},
		{
			given: "an explicit key with spaces and symbols",
			when: "parsed",
			then: "the error points at the key",
			input: { key: "Hello World!!", componentType: "card", template: "basic" },
			expect: { success: false, errorPath: "key" },
		},
		{
			given: "an invalid componentType",
			when: "parsed",
			then: "the error points at componentType",
			input: { name: "test", componentType: "!!invalid", template: "basic" },
			expect: { success: false, errorPath: "componentType" },
		},
		{
			given: "an invalid template",
			when: "parsed",
			then: "the error points at template",
			input: { name: "test", componentType: "card", template: "!!invalid" },
			expect: { success: false, errorPath: "template" },
		},
		{
			given: "a negative qty",
			when: "parsed",
			then: "the error points at qty",
			input: {
				name: "test",
				componentType: "card",
				template: "basic",
				qty: -1,
			},
			expect: { success: false, errorPath: "qty" },
		},
		{
			given: "a qty of zero",
			when: "parsed",
			then: "the error points at qty",
			input: { name: "test", componentType: "card", template: "basic", qty: 0 },
			expect: { success: false, errorPath: "qty" },
		},
		{
			given: "a non-integer qty",
			when: "parsed",
			then: "the error points at qty",
			input: {
				name: "test",
				componentType: "card",
				template: "basic",
				qty: 1.5,
			},
			expect: { success: false, errorPath: "qty" },
		},
	];

	for (const testCase of testCases) {
		it(`GIVEN: ${testCase.given} WHEN: ${testCase.when} THEN: ${testCase.then}`, () => {
			expectSchemaResult(
				pieceSchema.safeParse(testCase.input),
				testCase.expect,
			);
		});
	}
});

describe("templateDefSchema", () => {
	const testCases: TestCase<unknown, SchemaExpect<TemplateDef>>[] = [
		{
			given: "a valid template def",
			when: "parsed",
			then: "it passes unchanged",
			input: { key: "attack_card", contents: "<div>{{name}}</div>" },
			expect: {
				success: true,
				data: { key: "attack_card", contents: "<div>{{name}}</div>" },
			},
		},
		{
			given: "a template def with no contents",
			when: "parsed",
			then: "the error points at contents",
			input: { key: "attack_card" },
			expect: { success: false, errorPath: "contents" },
		},
	];

	for (const testCase of testCases) {
		it(`GIVEN: ${testCase.given} WHEN: ${testCase.when} THEN: ${testCase.then}`, () => {
			expectSchemaResult(
				templateDefSchema.safeParse(testCase.input),
				testCase.expect,
			);
		});
	}
});
