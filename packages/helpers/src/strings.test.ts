import { describe, expect, it } from "vitest";
import { countAndRemoveIndentation, splitBySpaces } from "./string-helpers.ts";

describe("splitBySpaces", () => {
	it("should split basic space-separated words", () => {
		expect(splitBySpaces("hello world")).toEqual(["hello", "world"]);
	});

	it("should treat escaped spaces as part of the same word", () => {
		expect(splitBySpaces("hello\\ world")).toEqual(["hello world"]);
	});

	it("should handle quoted sections", () => {
		expect(
			splitBySpaces('div.whatever(title="Hello World") Greetings'),
		).toEqual(['div.whatever(title="Hello World")', "Greetings"]);
	});

	it("should handle multiple spaces between words", () => {
		expect(splitBySpaces("hello   world")).toEqual(["hello", "world"]);
	});

	it("should handle multiple escaped spaces", () => {
		expect(splitBySpaces("hello\\ world\\ again")).toEqual([
			"hello world again",
		]);
	});

	it("should handle complex cases with quotes and escaped spaces", () => {
		expect(
			splitBySpaces('div class="test example" text="hello\\ world"'),
		).toEqual(["div", 'class="test example"', 'text="hello world"']);
	});
});

describe("countAndRemoveIndentation", () => {
	it("should handle tabs", () => {
		const result = countAndRemoveIndentation("\tdiv");
		expect(result.count).toBe(1);
		expect(result.result).toBe("div");
	});

	it("should handle tabs", () => {
		const result = countAndRemoveIndentation("\t\tdiv");
		expect(result.count).toBe(2);
		expect(result.result).toBe("div");
	});

	it("should two spaces", () => {
		const result = countAndRemoveIndentation("  div");
		expect(result.count).toBe(1);
		expect(result.result).toBe("div");
	});
});
