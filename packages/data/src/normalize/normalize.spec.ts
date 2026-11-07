import { describe, expect, it } from "vitest";
import { parseProjectData } from "./normalize";

describe("parseProjectData", () => {
	it("should parse a valid minimal project", () => {
		const result = parseProjectData({
			componentTypes: [
				{ key: "poker", widthPX: 850, heightPX: 1150 },
			],
			templates: [{ key: "basic", contents: "<div>{{name}}</div>" }],
			pieces: [
				{
					name: "Health Potion",
					componentType: "poker",
					template: "basic",
				},
			],
		});
		expect(result.success).toBe(true);
		if (!result.success) {
			return;
		}
		expect(result.data.pieces).toHaveLength(1);
		expect(result.data.pieces[0]?.key).toBe("health_potion");
		expect(result.data.pieces[0]?.qty).toBe(1);
		expect(result.data.componentTypes).toHaveLength(1);
		expect(result.data.templates).toHaveLength(1);
	});

	it("should default qty to 1", () => {
		const result = parseProjectData({
			componentTypes: [
				{ key: "poker", widthPX: 850, heightPX: 1150 },
			],
			templates: [{ key: "basic", contents: "" }],
			pieces: [
				{
					name: "Card",
					componentType: "poker",
					template: "basic",
				},
			],
		});
		expect(result.success).toBe(true);
		if (!result.success) {
			return;
		}
		expect(result.data.pieces[0]?.qty).toBe(1);
	});

	it("should auto-generate key from name", () => {
		const result = parseProjectData({
			componentTypes: [
				{ key: "poker", widthPX: 850, heightPX: 1150 },
			],
			templates: [{ key: "basic", contents: "" }],
			pieces: [
				{
					name: "My 1st Sword!",
					componentType: "poker",
					template: "basic",
				},
			],
		});
		expect(result.success).toBe(true);
		if (!result.success) {
			return;
		}
		expect(result.data.pieces[0]?.key).toBe("my_1st_sword");
	});

	it("should generate unique keys for duplicate names", () => {
		const result = parseProjectData({
			componentTypes: [
				{ key: "poker", widthPX: 850, heightPX: 1150 },
			],
			templates: [{ key: "basic", contents: "" }],
			pieces: [
				{
					name: "Health Potion",
					componentType: "poker",
					template: "basic",
				},
				{
					name: "Health Potion",
					componentType: "poker",
					template: "basic",
				},
				{
					name: "Health Potion",
					componentType: "poker",
					template: "basic",
				},
			],
		});
		expect(result.success).toBe(true);
		if (!result.success) {
			return;
		}
		const keys = result.data.pieces.map((p) => p.key);
		expect(keys).toEqual([
			"health_potion",
			"health_potion_1",
			"health_potion_2",
		]);
	});

	it("should apply defaultComponentType when piece omits componentType", () => {
		const result = parseProjectData({
			defaultComponentType: "poker",
			componentTypes: [
				{ key: "poker", widthPX: 850, heightPX: 1150 },
			],
			templates: [{ key: "basic", contents: "" }],
			pieces: [
				{
					name: "Card",
					template: "basic",
				},
			],
		});
		expect(result.success).toBe(true);
		if (!result.success) {
			return;
		}
		expect(result.data.pieces[0]?.componentType).toBe("poker");
	});

	it("should return errors for invalid data", () => {
		const result = parseProjectData({
			componentTypes: [],
			templates: [],
			pieces: [
				{
					// missing name and key
					template: "basic",
				},
			],
		});
		expect(result.success).toBe(false);
		if (result.success) {
			return;
		}
		expect(result.errors.length).toBeGreaterThan(0);
	});

	it("should return errors for completely invalid input", () => {
		const result = parseProjectData("not an object");
		expect(result.success).toBe(false);
		if (result.success) {
			return;
		}
		expect(result.errors.length).toBeGreaterThan(0);
	});
});
