import { describe, expect, it } from "vitest";
import {
	componentTypeSchema,
	pieceSchema,
	type TopRightBottomLeft,
	templateDefSchema,
	trblSchema,
} from "./schemas";

describe("trblSchema (TopRightBottomLeft)", () => {
	const successes: [unknown, TopRightBottomLeft][] = [
		[10, { top: 10, right: 10, bottom: 10, left: 10 }],
		[
			"10,20",
			{
				top: 10,
				right: 20,
				bottom: 10,
				left: 20,
			},
		],
		[
			"10,20,30,40",
			{
				top: 10,
				right: 20,
				bottom: 30,
				left: 40,
			},
		],
	];

	for (const [input, expected] of successes) {
		it(`should parse ${JSON.stringify(input)}`, () => {
			const result = trblSchema.safeParse(input);
			if (!result.success) {
				expect.fail(`Failed with: ${result.error}`);
			}
			expect(result.data).toMatchObject(expected);
		});
	}

	it("should reject empty string", () => {
		const result = trblSchema.safeParse("");
		expect(result.success).toBe(false);
	});

	it("should reject non-numeric values", () => {
		const result = trblSchema.safeParse("abc");
		expect(result.success).toBe(false);
	});
});

describe("keyStringSchema", () => {
	it("should accept simple keys", () => {
		const result = pieceSchema.safeParse({
			componentType: "poker",
			template: "basic",
			name: "test",
		});
		expect(result.success).toBe(true);
	});

	it("should accept @ prefixed keys", () => {
		const result = componentTypeSchema.safeParse({
			key: "@core/poker",
			widthPX: 850,
			heightPX: 1150,
		});
		expect(result.success).toBe(true);
	});

	it("should reject @ in wrong position", () => {
		const result = componentTypeSchema.safeParse({
			key: "@cc@card",
			widthPX: 825,
			heightPX: 1125,
		});
		expect(result.success).toBe(false);
		expect(`${result.error}`).toMatch(/regex/);
	});

	it("should reject empty string", () => {
		const result = componentTypeSchema.safeParse({
			key: "",
			widthPX: 825,
			heightPX: 1125,
		});
		expect(result.success).toBe(false);
	});
});

describe("componentTypeSchema", () => {
	it("should accept valid component type with no trims", () => {
		const result = componentTypeSchema.safeParse({
			key: "@cc/card",
			widthPX: 825,
			heightPX: 1125,
		});
		if (!result.success) {
			expect.fail(`Failed with: ${result.error}`);
		}
		expect(result.data).toMatchObject({
			key: "@cc/card",
			trims: [],
			widthPX: 825,
			heightPX: 1125,
		});
	});
});

describe("pieceSchema", () => {
	it("should auto-generate key from name", () => {
		const result = pieceSchema.safeParse({
			name: "My 1st Sword, It Attacks!",
			componentType: "card",
			template: "attack_card",
		});
		if (!result.success) {
			expect.fail(`Failed with: ${result.error}`);
		}
		expect(result.data).toMatchObject({
			key: "my_1st_sword_it_attacks",
			qty: 1,
		});
	});

	it("should default qty to 1", () => {
		const result = pieceSchema.safeParse({
			name: "test",
			componentType: "card",
			template: "basic",
		});
		if (!result.success) {
			expect.fail(`Failed with: ${result.error}`);
		}
		expect(result.data.qty).toBe(1);
	});

	it("should pass through data fields", () => {
		const result = pieceSchema.safeParse({
			name: "My Sword",
			componentType: "card",
			template: "attack_card",
			data: {
				elements: ["fire", "cold"],
				description: "This attacks for 10, then 20.",
			},
		});
		if (!result.success) {
			expect.fail(`Failed with: ${result.error}`);
		}
		expect(result.data.data).toMatchObject({
			elements: ["fire", "cold"],
			description: "This attacks for 10, then 20.",
		});
	});

	it("should require either key or name", () => {
		const result = pieceSchema.safeParse({
			componentType: "card",
			template: "attack_card",
		});
		expect(result.success).toBe(false);
	});

	it("should require componentType to match key regex", () => {
		const result = pieceSchema.safeParse({
			name: "test",
			componentType: "!!invalid",
			template: "basic",
		});
		expect(result.success).toBe(false);
	});

	it("should require template to match key regex", () => {
		const result = pieceSchema.safeParse({
			name: "test",
			componentType: "card",
			template: "!!invalid",
		});
		expect(result.success).toBe(false);
	});

	it("should reject negative qty", () => {
		const result = pieceSchema.safeParse({
			name: "test",
			componentType: "card",
			template: "basic",
			qty: -1,
		});
		expect(result.success).toBe(false);
	});
});

describe("templateDefSchema", () => {
	it("should accept valid template def", () => {
		const result = templateDefSchema.safeParse({
			key: "attack_card",
			contents: "<div>{{name}}</div>",
		});
		if (!result.success) {
			expect.fail(`Failed with: ${result.error}`);
		}
		expect(result.data).toMatchObject({
			key: "attack_card",
			contents: "<div>{{name}}</div>",
		});
	});
});
