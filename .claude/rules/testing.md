# Testing

- For new features and changes, write tests at the end, then go back and forth
  between the code and tests as needed.
- Never remove a test just to stop it failing. Only remove a test when the
  functionality it covers is no longer relevant.

## Structure

Write tests as a table of cases, then run them in a loop.

```ts
type TestCase<TInput, TExpect> = {
  given: string;
  when: string;
  then: string;
  input: TInput;
  expect: TExpect;
};

for (const testCase of testCases) {
  it(`GIVEN: ${testCase.given} WHEN: ${testCase.when} THEN: ${testCase.then}`, async () => {
    if (testCase.input.newUser) {
      await createUser();
    }
    // ...
  });
}
```
