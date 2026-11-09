export type TestCase<TInput, TExpect> = {
	given: string;
	when: string;
	then: string;
	input: TInput;
	expect: TExpect;
};
