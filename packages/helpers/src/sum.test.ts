import { describe, expect, it } from "vitest";
import { add } from "./index";

describe("add", () => {
	it("adds two numbers", () => {
		expect(add(3, 5)).toBe(8);
	});
});
