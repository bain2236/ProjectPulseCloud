# AGENTS.md — PulseCloud agent instructions
**Purpose:** guide agents to develop, test, and contribute to the PulseCloud AnimatedWordCloud component.

## Quick setup
1. Install root deps: `npm ci` (from root)
2. Install project deps: `cd project && npm ci --legacy-peer-deps && cd ..`
3. Run dev: `cd project && npm run dev` (starts on http://localhost:3000)
4. Run tests: `npm test` (from root)
5. Run pipeline: `npm run pipeline:run` (from root, requires OPENAI_API_KEY or LLM_DRY_RUN=true)

## TDD loop
- Agent must run tests locally before creating a commit.
- Write a failing test first, implement code, run tests, then commit.

## LLM prompt
See `prompts/llm_prompt.md` for the recommended prompt to extract JSON from testimonials.

## Rules
- Do not commit secrets.
- Run `npm test` before pushing.
- Follow contributor checklist in `CONTRIBUTING.md`.
