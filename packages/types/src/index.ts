export * from "./test-case";

export type PieceDef = {
	name: string;
	// for later: layout, maybe data, component type, etc etc
};

export type PieceInstance = PieceDef & {
	id: string;
};

export type Trim = {
	key: string;
	top: number;
	left: number;
	bottom: number;
	right: number;
};

export type PieceType = {
	widthPX: number;
	heightPX: number;
	trims: Trim[]; // TODO: Get the TopRightBottomleft schema from the other project and its types
};
