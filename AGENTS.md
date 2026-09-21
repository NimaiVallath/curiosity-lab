# Curiosity Lab Guidelines

## Mission

Build small, finished experiments that make curiosity visible. Optimize for
delight, immediacy, originality, and craft—not utility theater or commit count.

## The five-second rule

Someone should understand how to play with a project within five seconds. Prefer
one strong interaction over a dashboard of features. Instructions belong next to
the action, not in a manual.

## What every experiment needs

1. A one-sentence invitation that feels different from existing experiments.
2. A working local artifact with no accounts, secrets, paid services, or tracking.
3. A README explaining the curiosity, usage, interesting rule, and limitations.
4. A visible sample or preview.
5. Focused deterministic tests for the logic beneath the interaction.
6. Entries in `projects/catalog.json` and the root gallery.

Rotate among visual play, sound, language, simulation, tiny games, physical-feeling
interfaces, and odd utilities. Avoid tutorial clones, generic CRUD, engagement
mechanics, fake businesses, and projects built only to create commits.

## Small AI and agent experiments

Every even-numbered experiment should explore a small AI or agent idea. Keep it
local-first and legible: planning, search, tool choice, memory, evaluation, or a
tiny learned behavior should be visible in the artifact. Show the loop or trace
that produced an outcome, include deterministic scenarios or evals, and state
what the system cannot infer.

Do not label ordinary conditionals as AI, ship a chatbot skin, wrap an API without
an original interaction, or require a paid model or secret. A mock tool world,
compact planner, classical algorithm, or optional bring-your-own-model adapter is
better than pretending a remote model is the whole idea.

## Workflow

Work on a short-lived branch. Commit only coherent, verified milestones. Run
`node scripts/check.mjs`, inspect the complete diff for secrets and generated
clutter, and update the gallery only when the experiment is complete. Never use
empty or backdated commits, rewrite shared history, or force-push.

## Voice

Write with warmth and specificity. Explain what made the idea interesting without
inflating it into a startup pitch.
