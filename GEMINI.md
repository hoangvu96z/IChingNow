# IChingNow — Antigravity Workspace Entry Point

Mandatory workspace policy: `.agents/rules/harness.md` (`trigger: always_on`, Rule ID: `SPIRITNOW_MULTI_AGENT_HARNESS_V1`). It inlines `AGENTS.md` and `docs/MULTI_AGENT_HARNESS.md` on every turn.

- Use CodeGraph (`codegraph status`, `codegraph explore`, `codegraph node`) before reading or editing source files.
- For multi-part tasks, dispatch parallel subagents (`invoke_subagent` with `Model: "pro"`/`"inherit"` for Argon or `Model: "flash"` for Flash) or use the CLI harness (`npm run agy` / `npm run agy:parallel`).
- Read `LOCAL_SSO.md` and `ROADMAP.md` before changing cross-app or SSO behavior.
