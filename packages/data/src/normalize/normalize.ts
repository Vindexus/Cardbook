import { z } from "zod";
import {
	type ComponentType,
	componentTypeSchema,
	keyStringSchema,
	type Piece,
	pieceSchema,
	type TemplateDef,
	templateDefSchema,
} from "../schemas";

export interface ProjectData {
	componentTypes: ComponentType[];
	templates: TemplateDef[];
	pieces: Piece[];
}

export interface DataError {
	path: string;
	message: string;
}

// Invalid pieces are skipped and reported in `errors` instead of failing the
// whole project, so one broken piece can't hide all the others
export type ParseResult =
	| { success: true; data: ProjectData; errors: DataError[] }
	| { success: false; errors: DataError[] };

type ParsedPiece = {
	index: number;
	piece: Piece;
	hasExplicitKey: boolean;
};

const projectSchema = z
	.object({
		defaultComponentType: keyStringSchema.optional(),
		componentTypes: z.array(componentTypeSchema),
		templates: z.array(templateDefSchema),
		pieces: z.array(z.unknown()),
	})
	.superRefine((project, ctx) => {
		addDuplicateKeyIssues(project.componentTypes, "componentTypes", ctx);
		addDuplicateKeyIssues(project.templates, "templates", ctx);
	});

/**
 * Validates raw project input, applies defaults, and gives every piece a unique key.
 * @param raw - Untrusted project input, such as parsed JSON
 */
export function parseProjectData(raw: unknown): ParseResult {
	const projectResult = projectSchema.safeParse(raw);
	if (!projectResult.success) {
		return {
			success: false,
			errors: toDataErrors(projectResult.error.issues, ""),
		};
	}

	const project = projectResult.data;
	const errors: DataError[] = [];
	const parsedPieces: ParsedPiece[] = [];

	project.pieces.forEach((rawPiece, index) => {
		const pieceInput = withDefaultComponentType(
			rawPiece,
			project.defaultComponentType,
		);
		const result = pieceSchema.safeParse(pieceInput);
		if (!result.success) {
			errors.push(...toDataErrors(result.error.issues, `pieces.${index}`));
			return;
		}

		const hasExplicitKey = isRecord(rawPiece) && rawPiece.key !== undefined;
		parsedPieces.push({ index, piece: result.data, hasExplicitKey });
	});

	const keyed = assignUniqueKeys(parsedPieces);
	errors.push(...keyed.errors);

	return {
		success: true,
		data: {
			componentTypes: project.componentTypes,
			templates: project.templates,
			pieces: keyed.pieces,
		},
		errors,
	};
}

function assignUniqueKeys(parsedPieces: ParsedPiece[]): {
	pieces: Piece[];
	errors: DataError[];
} {
	const usedKeys = new Set<string>();
	const rejected = new Set<ParsedPiece>();
	const errors: DataError[] = [];

	// Explicit keys are claimed first, so a generated key never takes one
	// that's written later in the list
	for (const parsed of parsedPieces) {
		if (!parsed.hasExplicitKey) {
			continue;
		}

		if (usedKeys.has(parsed.piece.key)) {
			rejected.add(parsed);
			errors.push({
				path: `pieces.${parsed.index}.key`,
				message: `Duplicate key "${parsed.piece.key}"`,
			});
			continue;
		}

		usedKeys.add(parsed.piece.key);
	}

	const pieces: Piece[] = [];
	for (const parsed of parsedPieces) {
		if (rejected.has(parsed)) {
			continue;
		}

		if (parsed.hasExplicitKey) {
			pieces.push(parsed.piece);
			continue;
		}

		const key = nextUnusedKey(parsed.piece.key, usedKeys);
		usedKeys.add(key);
		pieces.push({ ...parsed.piece, key });
	}

	return { pieces, errors };
}

function nextUnusedKey(baseKey: string, usedKeys: Set<string>): string {
	if (!usedKeys.has(baseKey)) {
		return baseKey;
	}

	let copyNumber = 2;
	while (usedKeys.has(withCopySuffix(baseKey, copyNumber))) {
		copyNumber++;
	}

	return withCopySuffix(baseKey, copyNumber);
}

function withCopySuffix(baseKey: string, copyNumber: number): string {
	return `${baseKey}_${String(copyNumber).padStart(3, "0")}`;
}

function withDefaultComponentType(
	rawPiece: unknown,
	defaultComponentType: string | undefined,
): unknown {
	const needsDefault =
		isRecord(rawPiece) && rawPiece.componentType === undefined;

	if (!needsDefault || defaultComponentType === undefined) {
		return rawPiece;
	}

	return { ...rawPiece, componentType: defaultComponentType };
}

function addDuplicateKeyIssues(
	items: { key: string }[],
	field: string,
	ctx: z.RefinementCtx,
) {
	const seenKeys = new Set<string>();
	items.forEach((item, index) => {
		if (seenKeys.has(item.key)) {
			ctx.addIssue({
				code: "custom",
				path: [field, index, "key"],
				message: `Duplicate key "${item.key}"`,
			});
		}
		seenKeys.add(item.key);
	});
}

function toDataErrors(issues: z.ZodIssue[], pathPrefix: string): DataError[] {
	return issues.map((issue) => ({
		path: [pathPrefix, ...issue.path].filter((part) => part !== "").join("."),
		message: issue.message,
	}));
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
