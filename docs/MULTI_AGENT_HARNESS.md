# Multi-Agent & Event Harness Guide (IChingNow + vInfiSSO)

Updated: 2026-10-27. Shared across `/Users/hoangvu96z/Documents/IChingNow` (Frontend Monorepo) and `/Users/hoangvu96z/Documents/vInfiSSO` (Backend SSO & Admin UI).

## 1. What is the Agent Harness?

An **Agent Harness** is the control, safety, and orchestration layer that wraps raw AI models (Gemini 4 Argon, Gemini 3.8 Flash) so multiple agents can work in parallel reliably:

1. **Always-On Policy Injection (`.agents/rules/harness.md`)**: Automatically loads `AGENTS.md` and this workflow into every agent turn (`trigger: always_on`), ensuring every spawned subagent follows CodeGraph discovery, security rules, and verification requirements.
2. **Parallel Subagent Orchestration**:
   - **Inside Antigravity Chat (`invoke_subagent`)**: The lead orchestrator splits a task into non-overlapping scopes and invokes multiple subagents in parallel in a single turn (`Model: "pro"`/`"inherit"` for Argon deep work, `Model: "flash"` for fast parallel implementation/QA).
   - **Via CLI Runner (`scripts/agy-runner.mjs`)**: Spawns one or more headless `agy` CLI processes (`--output-format stream-json`), streams normalized tool/test events in real time, redacts secrets, tracks per-repo Git worktree deltas (`diffSnapshots`), and writes audit logs to `.agy-runs/*.jsonl`.
3. **Independent Verification**: Neither subagent claims nor CLI exit codes alone certify correctness. The orchestrator inspects the Git diff and runs `npm run test:sso`, `npm run build:<app>`, or `npm test` (in `vInfiSSO`) before handoff.

---

## 2. Parallel Execution Mode A: Native Subagents (`invoke_subagent`)

When running inside Antigravity, use `define_subagent` (if not already defined in the conversation) and `invoke_subagent` to launch multiple agents simultaneously:

| Subagent Role | Recommended `Model` | Best Used For |
| --- | --- | --- |
| `argon-worker` | `"inherit"` or `"pro"` (Gemini 4 Argon) | Complex backend NestJS/TypeORM in `vInfiSSO`, `shared/` SSO contracts, Lục Hào / Tử Vi core algorithms, security-sensitive logic |
| `flash-worker` | `"flash"` (Gemini 3.8 Flash) | Parallel UI features in `iching/`, `tarotnow/`, `tuvinow/`, `notenow/`, `talkwithme/`, `spiritnow/`, `admin-ui/`, unit tests, docs |
| `qa-verifier` | `"flash"` (Gemini 3.8 Flash) | Running `npm run test:sso`, `npm run build:all`, Jest suites in `vInfiSSO`, and auditing diffs |

### Rules for Parallel Subagents
- **Disjoint File Ownership**: Give each parallel worker an explicit list of allowed directories/files (e.g., Worker 1 owns `iching/src/`, Worker 2 owns `tarotnow/src/`, Worker 3 owns `/Users/hoangvu96z/Documents/vInfiSSO/src/readings/`).
- **Workspace Isolation**: Use `Workspace: "inherit"` when workers touch separate directories, or `Workspace: "share"` / `"branch"` when isolating full worktrees.
- **No Polling**: Call `invoke_subagent` for all parallel workers in the same turn and stop calling tools; the system wakes the orchestrator automatically when workers report back.

---

## 3. Parallel Execution Mode B: CLI Harness (`scripts/agy-runner.mjs`)

### Single-Agent Run
```bash
mkdir -p .agy-runs/tasks
npm run agy -- \
  --task-file .agy-runs/tasks/my-task.md \
  --model gemini-3.8-flash-high \
  --effort high \
  --mode accept-edits
```

### Parallel Multi-Agent Run (Argon + Flash across repos)
Create a jobs manifest `.agy-runs/tasks/jobs.json`:
```json
[
  {
    "name": "vinfisso-api",
    "cwd": "/Users/hoangvu96z/Documents/vInfiSSO",
    "taskFile": ".agy-runs/tasks/backend-api.md",
    "model": "gemini-4-argon-high",
    "effort": "high",
    "mode": "accept-edits"
  },
  {
    "name": "iching-ui",
    "cwd": "/Users/hoangvu96z/Documents/IChingNow",
    "taskFile": ".agy-runs/tasks/iching-ui.md",
    "model": "gemini-3.8-flash-high",
    "effort": "high",
    "mode": "accept-edits"
  },
  {
    "name": "tuvi-ui",
    "cwd": "/Users/hoangvu96z/Documents/IChingNow",
    "taskFile": ".agy-runs/tasks/tuvi-ui.md",
    "model": "gemini-3.8-flash-high",
    "effort": "high",
    "mode": "accept-edits"
  }
]
```

Run all agents in parallel:
```bash
npm run agy:parallel -- --jobs .agy-runs/tasks/jobs.json --max-concurrency 3
```

### Required Handoff Evidence
```text
CodeGraph: explore "<symbols/area>"; node/callers "<target>" as needed.
Agents: <single or parallel subagents/CLI jobs + models used>.
Impact: <files/packages modified across IChingNow / vInfiSSO>.
Checks: <exact commands and pass/fail counts>; not run: <reason>.
```
