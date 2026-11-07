# Coding standards

The project's linter, formatter, and conventions take priority over these rules.

## Naming

- Use kebab-case for file and folder names, unless the language or project has
  its own convention.
- Follow the project's conventions for everything else.
- Prefer full, descriptive names over abbreviations.

## Structure

- Always use braces and a new line for `if` statements. No one-liners.
- Handle error and edge cases first and return early, rather than nesting.
- Match the patterns already in the file before introducing a new one.
- Don't add abstractions, options, or config for needs that don't exist yet.
  Three similar lines are better than a premature helper.
- Add behavior with a wrapper function, not an options object. For example,
  add `updateUserAndNotify`, which calls `updateUser` and then notifies, rather
  than `updateUser(data, { sendNotification: true })`.
- Use short-lived, named variables instead of long boolean expressions or
  ternaries.

Bad:

```ts
if (data && data.settings?.enabled && config && (config.featureEnabled === true || config.featureEnabled === undefined)) {
```

Good:

```ts
const hasSettingData = data && data.settings?.enabled;
const featureEnabled = config && (config.featureEnabled === true || config.featureEnabled === undefined);

if (hasSettingData && featureEnabled) {
```

## Business rules

Keep business rules in pure domain functions wherever possible. Code that talks
to APIs and databases imports those functions, rather than containing the rules
itself.

```ts
const user = await fetchUserFromDb(db); // Talks to the db, so not a domain function

if (isValidUser(user)) { // Pure domain function
}
```

## Errors

Only catch an error if you can handle it or add useful context. Never leave a
catch block empty.

## Dead code

Remove code your change leaves unused, rather than commenting it out. Use
`@deprecated` instead if it might be reintroduced later, or if deleting it
would cause too much churn.

## Comments

Only write a comment when it explains why the code does something that isn't
obvious from reading it. Keep it short.

- Don't repeat what the code already says.
- Describe the code as it is, not the state of the work. No references to plan
  steps, tickets in progress, or fixes coming later.
- Don't mention specific code elsewhere, because the comment goes stale when
  that code changes. State the general reason instead.
- Doc comments are exempt when a language or project convention requires them.
- Leave existing comments alone unless your change makes them wrong. When you
  update one, also bring it in line with these rules.

Bad:

```ts
// Fetches the user
const user = fetchUser(db, userId);
```

Good:

```ts
// The db can't return its auto-generated IDs, and we need this one later
const id = uuid();
```

Bad:

```ts
// Optional because createUser sometimes passes in null
```

Good:

```ts
// Optional so callers can pass in null
```
