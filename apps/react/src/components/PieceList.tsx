import type { ReactNode } from "react";
import { pieceType } from "../consts/consts";
import { Card } from "../stories/Card";
import { Piece } from "./Piece";

export const PieceList = ({ items }: { items: Record<string, any>[] }) => {
	const widthPX = pieceType.widthPX * 3;
	const heightPX = pieceType.heightPX * 3;
	return (
		<div
			className="piece-list"
			style={{
				width: widthPX,
				height: heightPX,
			}}
		>
			{items.map((item, i) => {
				return (
					<Piece key={item.id}>
						<Card key={item.id} {...item} />
					</Piece>
				);
			})}
		</div>
	);
};
