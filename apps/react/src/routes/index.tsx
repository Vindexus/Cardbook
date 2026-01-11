import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
	component: Home,
});

function Home() {
	return (
		<div>
			<h1 className="text-3xl font-bold text-blue-500">Hello Vinmono</h1>
			<Link to="/colors" className="text-blue-500 underline">
				Colors Page
			</Link>
		</div>
	);
}
