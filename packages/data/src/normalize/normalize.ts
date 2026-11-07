import { z } from "zod";
import {
	type ComponentType,
	componentTypeSchema,
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

export type ParseResult =
	| { success: true; data: ProjectData }
	| { success: false; errors: DataError[] };

const projectSchema = z.object({
	defaultComponentType: z.string().optional(),
	componentTypes: z.array(componentTypeSchema),
	templates: z.array(templateDefSchema),
	pieces: z.array(z.any()),
});

export function parseProjectData(raw: unknown): ParseResult {
	const projectResult = projectSchema.safeParse(raw);
	if (!projectResult.success) {
		return {
			success: false,
			errors: projectResult.error.issues.map((issue) => ({
				path: issue.path.join("."),
				message: issue.message,
			})),
		};
	}

	const project = projectResult.data;
	const errors: DataError[] = [];
	const pieces: Piece[] = [];
	const keyCounts = new Map<string, number>();

	for (let i = 0; i < project.pieces.length; i++) {
		const rawPiece = project.pieces[i];

		// Apply defaultComponentType if piece doesn't have one
		const pieceInput =
			!rawPiece.componentType && project.defaultComponentType
				? { ...rawPiece, componentType: project.defaultComponentType }
				: rawPiece;

		const result = pieceSchema.safeParse(pieceInput);
		if (!result.success) {
			for (const issue of result.error.issues) {
				errors.push({
					path: `pieces.${i}.${issue.path.join(".")}`,
					message: issue.message,
				});
			}
			continue;
		}

		const piece = result.data as Piece;

		// Ensure unique keys
		const baseKey = piece.key;
		const count = keyCounts.get(baseKey) ?? 0;
		if (count > 0) {
			piece.key = `${baseKey}_${count}`;
		}
		keyCounts.set(baseKey, count + 1);

		pieces.push(piece);
	}

	if (errors.length > 0) {
		return { success: false, errors };
	}

	return {
		success: true,
		data: {
			componentTypes: project.componentTypes,
			templates: project.templates,
			pieces,
		},
	};
}
