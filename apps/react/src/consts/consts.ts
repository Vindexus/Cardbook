import type { PieceType } from "@vinforge/types";
// Eventually this would be something that is configurable, but we hardcode it for now
export const pieceType: PieceType = {
	widthPX: 850,
	heightPX: 1150,
	trims: [
		{
			key: "first",
			top: 30,
			right: 30,
			bottom: 30,
			left: 30,
		},
	], // TODO: Look to other project for how these can be defined as "90" or "90,100" or TRBL style
} as PieceType;
