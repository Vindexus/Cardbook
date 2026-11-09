import type { TestCase } from "@vinforge/types";
import { describe, expect, it } from "vitest";
import type { Piece } from "../schemas";
import { parseProjectData } from "./normalize";

type ParseExpect = {
	success: boolean;
	// Matched in order against the returned pieces, so the lengths must match too
	pieces?: Partial<Piece>[];
	errorPaths: string[];
};

const componentTypes = [{ key: "poker", widthPX: 850, heightPX: 1150 }];
const templates = [{ key: "basic", contents: "<div>{{name}}</div>" }];

function makeProject(
	pieces: unknown[],
	overrides: Record<string, unknown> = {},
) {
	return { componentTypes, templates, pieces, ...overrides };
}

function makePiece(fields: Record<string, unknown>) {
	return { componentType: "poker", template: "basic", ...fields };
}

const testCases: TestCase<unknown, ParseExpect>[] = [
	{
		given: "a minimal project with one piece",
		when: "parsed",
		then: "the piece gets a key from its name and a qty of 1",
		input: makeProject([makePiece({ name: "Health Potion" })]),
		expect: {
			success: true,
			pieces: [{ key: "health_potion", qty: 1, componentType: "poker" }],
			errorPaths: [],
		},
	},
	{
		given: "the project/data.ts sample written in the new format",
		when: "parsed",
		then: "both pieces are valid and keep their qty",
		input: makeProject([
			makePiece({ name: "Item" }),
			makePiece({ name: "Colin's Card", qty: 3 }),
		]),
		expect: {
			success: true,
			pieces: [
				{ key: "item", qty: 1 },
				{ key: "colins_card", qty: 3 },
			],
			errorPaths: [],
		},
	},
	{
		given: "three pieces with the same name",
		when: "parsed",
		then: "copies after the first get zero-padded number suffixes",
		input: makeProject([
			makePiece({ name: "Health Potion" }),
			makePiece({ name: "Health Potion" }),
			makePiece({ name: "Health Potion" }),
		]),
		expect: {
			success: true,
			pieces: [
				{ key: "health_potion" },
				{ key: "health_potion_002" },
				{ key: "health_potion_003" },
			],
			errorPaths: [],
		},
	},
	{
		given: "a name-based piece listed before an explicit key that matches it",
		when: "parsed",
		then: "the explicit key wins and the name-based piece gets a suffix",
		input: makeProject([
			makePiece({ name: "Health Potion" }),
			makePiece({ key: "health_potion" }),
		]),
		expect: {
			success: true,
			pieces: [{ key: "health_potion_002" }, { key: "health_potion" }],
			errorPaths: [],
		},
	},
	{
		given: "an explicit key that looks like a generated suffix",
		when: "two pieces share a name with it",
		then: "the generated keys skip the suffix that's already taken",
		input: makeProject([
			makePiece({ key: "health_potion_002" }),
			makePiece({ name: "Health Potion" }),
			makePiece({ name: "Health Potion" }),
		]),
		expect: {
			success: true,
			pieces: [
				{ key: "health_potion_002" },
				{ key: "health_potion" },
				{ key: "health_potion_003" },
			],
			errorPaths: [],
		},
	},
	{
		given: "two pieces with the same explicit key",
		when: "parsed",
		then: "the second is skipped with an error on its key",
		input: makeProject([
			makePiece({ key: "sword", name: "Sword" }),
			makePiece({ key: "sword", name: "Other Sword" }),
		]),
		expect: {
			success: true,
			pieces: [{ key: "sword", name: "Sword" }],
			errorPaths: ["pieces.1.key"],
		},
	},
	{
		given: "a project with a defaultComponentType",
		when: "a piece omits componentType",
		then: "the default is applied",
		input: makeProject([{ name: "Card", template: "basic" }], {
			defaultComponentType: "poker",
		}),
		expect: {
			success: true,
			pieces: [{ componentType: "poker" }],
			errorPaths: [],
		},
	},
	{
		given: "a project with a defaultComponentType",
		when: "a piece sets its own componentType",
		then: "the piece's own value is kept",
		input: makeProject([makePiece({ name: "Card", componentType: "euro" })], {
			defaultComponentType: "poker",
		}),
		expect: {
			success: true,
			pieces: [{ componentType: "euro" }],
			errorPaths: [],
		},
	},
	{
		given: "no defaultComponentType",
		when: "a piece omits componentType",
		then: "the piece is skipped with an error on componentType",
		input: makeProject([{ name: "Card", template: "basic" }]),
		expect: {
			success: true,
			pieces: [],
			errorPaths: ["pieces.0.componentType"],
		},
	},
	{
		given: "an invalid defaultComponentType",
		when: "parsed",
		then: "the project fails with the error on defaultComponentType",
		input: makeProject([{ name: "Card", template: "basic" }], {
			defaultComponentType: "!!bad",
		}),
		expect: { success: false, errorPaths: ["defaultComponentType"] },
	},
	{
		given: "one valid piece and one with a negative qty",
		when: "parsed",
		then: "the valid piece is returned and the invalid one is reported",
		input: makeProject([
			makePiece({ name: "Good" }),
			makePiece({ name: "Bad", qty: -1 }),
		]),
		expect: {
			success: true,
			pieces: [{ key: "good" }],
			errorPaths: ["pieces.1.qty"],
		},
	},
	{
		given: "a piece with neither a key nor a name",
		when: "parsed",
		then: "the piece is skipped with an error on its key",
		input: makeProject([makePiece({})]),
		expect: { success: true, pieces: [], errorPaths: ["pieces.0.key"] },
	},
	{
		given: "a piece that is null",
		when: "parsed",
		then: "it's reported as an error instead of throwing",
		input: makeProject([null, makePiece({ name: "Card" })]),
		expect: {
			success: true,
			pieces: [{ key: "card" }],
			errorPaths: ["pieces.0"],
		},
	},
	{
		given: "two component types with the same key",
		when: "parsed",
		then: "the project fails with an error on the second one",
		input: makeProject([], {
			componentTypes: [componentTypes[0], componentTypes[0]],
		}),
		expect: { success: false, errorPaths: ["componentTypes.1.key"] },
	},
	{
		given: "two templates with the same key",
		when: "parsed",
		then: "the project fails with an error on the second one",
		input: makeProject([], { templates: [templates[0], templates[0]] }),
		expect: { success: false, errorPaths: ["templates.1.key"] },
	},
	{
		given: "input that isn't an object",
		when: "parsed",
		then: "the project fails with an error at the root",
		input: "not an object",
		expect: { success: false, errorPaths: [""] },
	},
];

describe("parseProjectData", () => {
	for (const testCase of testCases) {
		it(`GIVEN: ${testCase.given} WHEN: ${testCase.when} THEN: ${testCase.then}`, () => {
			const result = parseProjectData(testCase.input);

			expect(result.success).toBe(testCase.expect.success);
			expect(result.errors.map((error) => error.path)).toEqual(
				testCase.expect.errorPaths,
			);

			if (result.success && testCase.expect.pieces) {
				expect(result.data.pieces).toMatchObject(testCase.expect.pieces);
			}
		});
	}
});
