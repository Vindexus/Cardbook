import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import type { Color } from "@vinmono/colors";
import { wait } from "@vinmono/helpers";

export const Route = createFileRoute("/colors")({
	component: Colors,
});

type ColorResponse = {
	colors: Color[];
};

function Colors() {
	const { data, isLoading, isError } = useQuery<ColorResponse>({
		queryKey: ["colors"],
		queryFn: async () => {
			const response = await fetch("/colors.json");
			await wait(222);
			return response.json() as Promise<ColorResponse>;
		},
	});

	if (isLoading) return <div>Loading...</div>;
	if (isError) return <div>Error loading colors</div>;

	return (
		<div>
			<h1 className="text-3xl font-bold text-blue-500">Colors</h1>
			<ul className="mt-4">
				{data?.colors.map((color) => (
					<li key={color.name}>
						{color.name}: <span style={{ color: color.hex }}>{color.hex}</span>
					</li>
				))}
			</ul>
			<Link to="/" className="text-blue-500 underline">
				Home
			</Link>
		</div>
	);
}
