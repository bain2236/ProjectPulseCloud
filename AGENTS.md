# AGENTS.md — PulseCloud agent instructions
**Purpose:** guide agents to develop, test, and contribute to the PulseCloud AnimatedWordCloud component.

## Quick setup
1. Install deps: `npm ci`
2. Run dev: `npm run dev`
3. Run tests: `npm test`

## TDD loop
- Agent must run tests locally before creating a commit.
- Write a failing test first, implement code, run tests, then commit.

## LLM prompt
See `prompts/llm_prompt.md` for the recommended prompt to extract JSON from testimonials.

## Rules
- Do not commit secrets.
- Run `npm test` before pushing.
- Follow contributor checklist in `CONTRIBUTING.md`.
