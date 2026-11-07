import { slugify } from "@vinmono/helpers";
import { z } from "zod";

export const keyStringSchema = z
	.string()
	.min(1)
	.regex(/^[@A-Za-z][/A-Za-z0-9_-]*$/, {
		message:
			"must be a valid key string (letters, numbers, underscores, or dashes only)",
	});

export const templateDefSchema = z.object({
	key: keyStringSchema,
	contents: z.string(),
});

// Top, Right, Bottom, Left
// Used for trim values that will crop from those directions
export const trblSchema = z
	.union([z.string(), z.number()])
	.transform((val, ctx) => {
		const text = String(val).trim();
		if (text.length === 0) {
			ctx.addIssue({
				code: "custom",
				message: "TRBL value cannot be empty",
			});
			return z.NEVER;
		}

		const parts = text
			.split(",")
			.map((p) => p.trim())
			.filter(Boolean);
		const nums = parts.map((p) => Number(p));

		if (nums.some((n) => Number.isNaN(n))) {
			ctx.addIssue({
				code: "custom",
				message: "All trim values must be valid numbers",
			});
			return z.NEVER;
		}

		const [top = 0, right = top, bottom = top, left = right] = nums;
		return { top, right, bottom, left };
	});

export const componentTypeSchema = z.object({
	key: keyStringSchema,
	widthPX: z.number().int(),
	heightPX: z.number().int(),
	trims: z.array(trblSchema).default([]),
});

export const pieceSchema = z
	.object({
		componentType: keyStringSchema,
		template: keyStringSchema,
		qty: z.number().int().positive().default(1),
		key: z.string().optional(),
		name: z.string().optional(),
		data: z.record(z.string(), z.any()).default({}),
	})
	.superRefine((obj, ctx) => {
		if (!obj.key && !obj.name) {
			ctx.addIssue({
				code: "custom",
				message: "Either key or name must be provided",
			});
		} else if (!obj.key && obj.name) {
			obj.key = slugify(obj.name);
		}
	});

// Input/output types
export type TRBLInput = z.input<typeof trblSchema>;
export type TopRightBottomLeft = z.output<typeof trblSchema>;

export type ComponentTypeInput = z.input<typeof componentTypeSchema>;
export type ComponentType = z.output<typeof componentTypeSchema>;

export type PieceInput = z.input<typeof pieceSchema>;
export type Piece = Omit<z.output<typeof pieceSchema>, "key"> & {
	key: string;
};

export type TemplateDefInput = z.input<typeof templateDefSchema>;
export type TemplateDef = z.output<typeof templateDefSchema>;
