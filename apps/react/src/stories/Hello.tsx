
export const HelloWorld = (data) => {
	const { name } = data;
	return <div className="pt-bleed">
	<h1 className="bold mb-2 color-blue">Card: {name}</h1>
	<div className="border-2  border-solid border-green p-4">Text of the card maybe goes here?</div>
</div>
}