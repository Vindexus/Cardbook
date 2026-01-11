import type React from "react";

export const Decorator: React.FC<React.PropsWithChildren> = ({ children }) => {
	return <>{children}</>;
};
