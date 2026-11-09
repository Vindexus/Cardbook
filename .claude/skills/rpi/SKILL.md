---
name: rpi
description: Work through a larger change in research, plan, and implement stages, leaving a file behind from each stage.
argument-hint: <task>
disable-model-invocation: true
---

Work on $ARGUMENTS in three stages. Each stage's file lives in
`plans/<task-name>/`, with a short kebab-case task name, and is committed.

If `plans/<task-name>/` already exists, read its files and resume from where
`progress.md` says the work stopped.

If the task will only touch one or two files, it's too small for this. Say so
and ask me before skipping the stages.

Stop after each stage and wait for my approval before starting the next.

## 1. Research

Gather what the plan needs in `research.md`: the relevant code, constraints,
and open questions.

## 2. Plan

List the steps in `plan.md`, based on the research.

## 3. Implement

Work through the plan, keeping `progress.md` up to date with where we are.

If the plan turns out not to be possible, stop. Update `research.md` and
`progress.md` with what you found, then go back to the plan stage.
