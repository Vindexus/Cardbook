import { pieceType } from "../consts/consts";
export const Piece: React.FC<React.PropsWithChildren> = ({ children }) => {
	const { widthPX, heightPX } = pieceType;

	const baseWidthHeightStyles: Record<string, any> = {
		width: `${widthPX}px`,
		height: `${heightPX}px`,
	};

	let styles: Record<string, any> = {};

	const makeHelper = (p: string, padding: string, size: string) => {
		const topSize = `var(--${size}-top)`;
		const rightSize = `var(--${size}-right)`;
		const bottomSize = `var(--${size}-bottom)`;
		const leftSize = `var(--${size}-left)`;
		const trbl = [topSize, rightSize, bottomSize, leftSize];
		return `
.w-${size} {
  width: var(--${size}-width);
}

.h-${size} {
  height: var(--${size}-height);
}

.${p}-${size} {
  ${padding}: ${trbl.join(" ")};
}
.${p}x-${size} {
  ${padding}-left: ${leftSize};
  ${padding}-right: ${rightSize};
}
.${p}y-${size} {
  ${padding}-top: ${topSize};
  ${padding}-bottom: ${bottomSize};
}

.${p}t-${size} {
  ${padding}-top: ${topSize};
}

.${p}b-${size} {
  ${padding}-bottom: ${topSize};
}

.top-${size} {
  top: ${topSize}
}

.bottom-${size} {
  bottom: ${bottomSize}
}

.left-${size} {
  left: ${topSize}
}

.right-${size} {
  right: ${bottomSize}
}
`;
	};

	const cssHelpers: string[] = [];
	let trimNum = 0;
	for (const trim of pieceType.trims) {
		trimNum++;
		const names = [`trim-${trimNum}`];

		// TODO: I don't know if these are right names. Also maybe the trim can have names
		if (trimNum === 1) {
			names.push("bleed");
		} else if (trimNum === 2) {
			names.push("edge");
		}

		const { top, right, bottom, left } = trim;
		const horz = right + left;
		const vert = top + bottom;
		for (const name of names) {
			styles[`--${name}-width`] = `${widthPX - horz}px`;
			styles[`--${name}-left`] = `${left}px`;
			styles[`--${name}-right`] = `${right}px`;

			styles[`--${name}-height`] = `${heightPX - vert}px`;
			styles[`--${name}-top`] = `${top}px`;
			styles[`--${name}-bottom`] = `${bottom}px`;

			cssHelpers.push(makeHelper("p", "padding", name));
			cssHelpers.push(makeHelper("m", "margin", name));
		}
	}

	console.log("cssHelpers", cssHelpers);

	const trim = pieceType.trims[99]; // Just putting 99 to not have a trim. TODO: Use trim eventually
	if (trim) {
		console.log("trim", trim);
		const trimmedWidth = pieceType.widthPX - trim.left - trim.right;
		const trimmedHeight = pieceType.heightPX - trim.top - trim.bottom;
		styles.width = `${trimmedWidth}px`;
		styles.height = `${trimmedHeight}px`;
	} else {
		styles.width = `${pieceType.widthPX}px`;
		styles.height = `${pieceType.heightPX}px`;
	}

	const classes: string[] = [];
	return (
		<div style={styles} className={"piece"}>
			{pieceType.trims.map((trim, i: number) => (
				<div
					key={`trim-${trim.key}`}
					className={`absolute-center trim-${i + 1} opacity-50 border border-black`}
					style={{
						width: `${pieceType.widthPX}px`,
						height: `${pieceType.heightPX}px`,
						borderTopWidth: `var(--trim-${i + 1}-top)`,
						borderRightWidth: `var(--trim-${i + 1}-right)`,
						borderBottomWidth: `var(--trim-${i + 1}-bottom)`,
						borderLeftWidth: `var(--trim-${i + 1}-left)`,
					}}
				></div>
			))}
			<div
				className={`piece-inner absolute-center ${classes}`}
				style={baseWidthHeightStyles}
			>
				{children}
			</div>
			<style>{cssHelpers.join("\n")}</style>
		</div>
	);
};
