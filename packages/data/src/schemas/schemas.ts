import { slugify } from "@vinforge/helpers";
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
	widthPX: z.number().int().positive(),
	heightPX: z.number().int().positive(),
	trims: z.array(trblSchema).default([]),
});

// Pieces aren't scoped resources, so no "@" or "/", but they can start with a
// number because keys generated from names like "10 Gold" do
export const pieceKeySchema = z.string().regex(/^[A-Za-z0-9][A-Za-z0-9_-]*$/, {
	message:
		"must start with a letter or number, then use only letters, numbers, underscores, or dashes",
});

// Templates read global data from `_`, so a piece's own `_` would be hidden
const reservedDataKey = "_";

export const pieceDataSchema = z
	.record(z.string(), z.any())
	.refine((data) => !Object.hasOwn(data, reservedDataKey), {
		message: `"${reservedDataKey}" is reserved for global data`,
		path: [reservedDataKey],
	});

export const pieceSchema = z
	.object({
		componentType: keyStringSchema,
		template: keyStringSchema,
		qty: z.number().int().positive().default(1),
		key: pieceKeySchema.optional(),
		name: z.string().optional(),
		data: pieceDataSchema.default({}),
	})
	.transform((piece, ctx) => {
		if (piece.key !== undefined) {
			return { ...piece, key: piece.key };
		}

		if (piece.name === undefined) {
			ctx.addIssue({
				code: "custom",
				path: ["key"],
				message: "Either key or name must be provided",
			});
			return z.NEVER;
		}

		const generatedKey = slugify(piece.name);
		if (!pieceKeySchema.safeParse(generatedKey).success) {
			ctx.addIssue({
				code: "custom",
				path: ["name"],
				message: `Can't make a key from the name "${piece.name}". Add a key, or use letters or numbers in the name`,
			});
			return z.NEVER;
		}

		return { ...piece, key: generatedKey };
	});

// Input/output types
export type TRBLInput = z.input<typeof trblSchema>;
export type TopRightBottomLeft = z.output<typeof trblSchema>;

export type ComponentTypeInput = z.input<typeof componentTypeSchema>;
export type ComponentType = z.output<typeof componentTypeSchema>;

export type PieceInput = z.input<typeof pieceSchema>;
export type Piece = z.output<typeof pieceSchema>;

export type TemplateDefInput = z.input<typeof templateDefSchema>;
export type TemplateDef = z.output<typeof templateDefSchema>;
