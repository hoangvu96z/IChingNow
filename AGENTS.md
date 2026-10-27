# IChingNow (SpiritNow Monorepo) — Rules for Coding Agents

Rule ID: `SPIRITNOW_MULTI_AGENT_HARNESS_V1`

Read and follow [MULTI_AGENT_HARNESS.md](docs/MULTI_AGENT_HARNESS.md) before any coding task. Applies across all packages in `/Users/hoangvu96z/Documents/IChingNow` (`iching`, `tarotnow`, `tuvinow`, `spiritnow`, `notenow`, `talkwithme`, `shared`) and cross-repo tasks with `/Users/hoangvu96z/Documents/vInfiSSO`.

## 1. Mandatory CodeGraph Workflow

- When `.codegraph/` exists, call `codegraph explore` (or MCP `codegraph_explore`) before locating or reading source files for reviews, debugging, features, or refactoring.
- Read indexed symbols/files with `codegraph node` (or `codegraph_node`) and check callers (`codegraph callers`) before changing `shared/` contracts.
- If the index is stale, run `codegraph status` and `codegraph sync`, then query again. Never delete or recreate `.codegraph/` yourself.
- Every coding handoff must include: CodeGraph queries run, affected files/packages, checks executed, and unverified items.

## 2. Multi-Agent & Parallel Execution Policy (Argon + Flash)

When executing multi-part or cross-package tasks, partition work into disjoint file/package scopes so multiple agents run in parallel without write conflicts:

- **Model Selection**:
  - **Argon (`gemini-4-argon-high` / `gemini-4-argon-medium` or Subagent `Model: "pro"` / `"inherit"`)**: Use for complex architecture, cross-app `shared/` SSO contracts, tricky domain engines (Lục Hào, Tử Vi v11, Hợp Hôn), or backend integration with `vInfiSSO`.
  - **Flash (`gemini-3.8-flash-high` or Subagent `Model: "flash"`)**: Use for parallel UI components, styling, isolated app features (`iching/`, `tarotnow/`, `tuvinow/`, `notenow/`, `talkwithme/`, `spiritnow/`), unit tests, and QA verification.
- **Execution Modes**:
  1. **Native Antigravity Subagents**: Define/invoke specialized subagents (`argon-worker`, `flash-worker`, `qa-verifier`) via `invoke_subagent` with explicit file boundaries (or `Workspace: "share"` / `"branch"` when isolating git trees). Launch independent workers in the same turn so they execute concurrently.
  2. **CLI Event Harness (`npm run agy` / `npm run agy:parallel`)**: Delegate single tasks with `npm run agy -- --task-file <path> --model <model>` or parallel multi-agent batches with `npm run agy:parallel -- --jobs <manifest.json>`. Never pass `--dangerously-skip-permissions`.

## 3. Ecosystem & Security Invariants

- `shared/` holds cross-app SSO auth, API proxies, streak logic, and shared UI modals. Any change to `shared/` must pass `npm run test:sso` and `npm run build:all`.
- Backend SSO API lives in `/Users/hoangvu96z/Documents/vInfiSSO`. Keep token handling, redirect preservation (query + hash), and 401/403 vs 5xx retry behavior aligned with `LOCAL_SSO.md`.
- Never read, log, or commit `.env`, `.env.local`, tokens, or `/iching/backend/database.json`.
- Do not commit, push, or deploy unless explicitly requested by the user.

## 4. Mandatory GitHub Actions Build & Deploy Gate

- Repositories: `hoangvu96z/IChingNow` and `hoangvu96z/vInfiSSO`.
- After any authorized `git push`, you **MUST** verify that the GitHub Actions CI & Deploy workflows for the exact pushed commit SHA (`HEAD`) complete with `conclusion: success` **before moving to the next task on the list**.
- Use the connected `github-actions` MCP (`github_actions_wait` / `github_actions_status`), GitHub MCP (`.codex/config.toml`), or run `npm run ci:wait` from the repository root.
- Do not treat a `queued`, `in_progress`, `cancelled`, or missing run as a pass. If any workflow or deploy job fails, inspect the failed step logs (`github-actions-mcp.mjs` automatically prints the failed log tail), fix the root cause, push a new commit, and re-verify `npm run ci:wait` until green.
