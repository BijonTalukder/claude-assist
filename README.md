# Claude Assist

**The pre-flight check for your Claude Code sessions.**

Claude Assist is a small, local CLI that looks at your project **before** you launch [Claude Code](https://claude.com/product/claude-code). It tells you what kind of project you have, how big it is, which Claude model fits the job, and what to keep out of Claude's context — then launches `claude` for you with that context pre-seeded.

Claude Code performs best when it is given the right amount of context and the right model for the task. Claude Assist gives you a two-second gut-check before every session: a concise summary, a model recommendation, focus detection, and context optimizations. It exists because launching a session cold — with the whole repository dumped into context — wastes tokens and muddies the model's attention.

Everything runs locally. No network calls, no AI APIs, no data leaves your machine. Every recommendation is a deterministic, rule-based heuristic over static analysis of your own repository.

## Features

- **Project analysis** — detects framework, language, and package manager; counts files, source lines of code, and the largest folders
- **Git analysis** — current branch, changed / untracked / staged files, and the list of changed file paths
- **Context estimation** — a project-size bucket (`small` / `medium` / `large` / `very-large`) and an approximate context-token count derived from source LOC
- **Model recommendation** — picks Haiku, Sonnet, or Opus from project size, framework complexity, and change volume
- **Focus area detection** — determines where Claude's attention should go (user-selected scope, current working directory, git-changed directories, or monorepo workspace) and never guesses module names
- **Context optimizations** — suggests ignoring `node_modules` and build output, generating a `.claudeignore`, scoping a monorepo session to one package, and seeding only git-changed files
- **`.claudeignore` generation** — language-aware ignore templates; never overwrites an existing file
- **Prompt context generation** — renders a "Project Focus" block (working directory, git changes, recommended scope) and seeds it into the Claude session via `--append-system-prompt`
- **Claude Code launcher** — spawns `claude` directly, forwards extra arguments, and applies the detected focus
- **Usage analytics & dashboard** — a local web dashboard for tokens, cost, models, projects, and sessions, computed entirely from `~/.claude`, with a per-model pricing table

## Installation

### Requirements

| Requirement | Notes |
| --- | --- |
| Node.js | **22 or later** (`engines.node >= 22`) |
| pnpm | Required only for development from source |
| Claude Code | Required only for the `launch` / `optimized-launch` commands. If it is missing, these commands show an install link instead of failing. Get it at [claude.com/download/claude-code](https://claude.com/download/claude-code) |

### From npm

```bash
npm install -g claude-assist
```

Then just run:

```bash
claude-assist
```

### From source

```bash
git clone <your-repo-url>
cd claude-assist
pnpm install
pnpm build
node apps/cli/dist/index.js scan
```

## Usage

Running `claude-assist` with no arguments opens the interactive menu:

```
? What do you want to do?
❯ 🚀 Launch with recommended optimizations
  🤖 Launch Claude Code
  📊 Usage Analytics
  🔍 Project Scan
  🚪 Exit
```

Every flow can also be reached directly as a subcommand:

| Command | Description |
| --- | --- |
| `claude-assist` | Interactive menu (above) |
| `claude-assist launch` | Analyze → summary → launcher menu → launch `claude` |
| `claude-assist optimized-launch` | Analyze → optimization plan → confirm → apply → launch |
| `claude-assist scan` | Analyze and show the summary only — never launches Claude |
| `claude-assist analytics` | Start the local usage dashboard and open it in your browser |

### `claude-assist launch`

Analyzes the project, prints the summary, then asks how you want to launch:

```
? Before launching Claude, what would you like to do?
❯ 🚀 Launch with recommended optimizations (Recommended)
  👀 Review optimization details
  ⚡ Launch without optimization
  ❌ Cancel
```

Any arguments after the flags are forwarded straight to `claude`:

```bash
claude-assist launch --model opus
```

### `claude-assist optimized-launch`

Analyzes the project and proposes context optimizations (an estimated token reduction is shown). You can confirm, review the full details, or decline:

```
? Apply these optimizations?
❯ Yes
  Review details
  No
```

If you confirm, it writes a `.claudeignore` (only when none exists), seeds the changed files and the "Project Focus" prompt, and launches Claude.

### `claude-assist scan`

Shows the same analysis as `launch`, but never launches Claude. Useful in scripts and CI:

```bash
claude-assist scan --cwd ./path/to/project
```

### `claude-assist analytics`

Starts the local dashboard server and opens it in your browser. It reads only `~/.claude` on this machine — no cloud, no API key. Press `Ctrl+C` to stop it.

```
Dashboard running at http://localhost:4500
Press Ctrl+C to stop the dashboard.
```

### Flags

| Flag | Applies to | Description |
| --- | --- | --- |
| `--cwd <path>` | All commands | Directory to analyze (defaults to the current directory) |
| `--focus <scope>` | `launch`, `optimized-launch`, `scan` | Explicitly focus Claude on a scope (highest priority in focus detection) |
| `--port <number>` | `analytics` | Port for the dashboard (default `4500`) |

## Example output

```
🚀 Claude Assist

Project
-------
Name: my-api
Framework: NestJS
Language: TypeScript

Git
---
Branch: feature/auth
Changed Files: 12
Untracked Files: 2

Stats
-----
Files: 382
LOC: 71K

Project Focus
-------------

Working Directory

/home/you/code/my-api

Git

Changed Files: 12

Primary Modified Paths

- src/auth
- src/common

Recommended Scope

Focus primarily on the modified directories unless the user's request requires broader changes.

AI Recommendation
-----------------
Model: Sonnet

Reason:
Best balance between cost and reasoning for a moderately complex project.

Suggestions
-----------
✓ Review changed files
✓ Ignore node_modules
✓ Ignore dist/build output
✓ Generate .claudeignore
```

## How it works

```
Project detection
        |
        v
Project analysis (framework, language, package manager, stats)
        |
        v
Git analysis (branch, changed / untracked / staged files)
        |
        v
Context estimation (project size, approximate tokens)
        |
        v
Focus detection (user → cwd → git changes → workspace → none)
        |
        v
Model recommendation (haiku / sonnet / opus)
        |
        v
Optimization suggestions (analyzers + providers)
        |
        v
Claude Code launch (focus prompt + changed files + .claudeignore)
```

The whole pipeline is deterministic and runs locally:

1. **Scanner** walks the project with `fast-glob` (ignoring `node_modules`, `dist`, `.git`, and other generated folders), detects the framework from dependencies (or `pubspec.yaml` for Flutter), the language from marker files or file extensions, and the package manager from lockfiles. It counts files, source LOC, and the largest folders.
2. **Git provider** (`simple-git`) reports the current branch and splits `git status` into tracked changed files, staged files, and untracked files.
3. **Context estimator** converts source LOC into a project-size bucket and an approximate token count (a coarse characters-per-line heuristic, not a real tokenizer).
4. **Focus detector** picks the launch scope in priority order — explicit user scope, current working directory (when it is a monorepo package), directories touched by uncommitted git changes, the enclosing workspace, or "no clear focus". It only ever uses factual project metadata.
5. **Model recommender** chooses Haiku, Sonnet, or Opus from simple rules: large context → Opus; complex framework or many changed files → Sonnet; small simple project → Haiku; otherwise Sonnet.
6. **Suggestion engine** runs two pluggable stages inside `@claude-assist/models`: **analyzers** inspect the project and return structured facts (has `node_modules`, has a `.claudeignore`, is a monorepo, which generated folders exist), and **providers** turn those facts into suggestions. The built-in providers cover review-changed-files, ignoring dependencies/build output per language and framework, and generating a `.claudeignore` for large projects.
7. **Launcher** spawns `claude` with the chosen working directory, the seeded focus prompt (`--append-system-prompt`), and the git-changed files when that optimization is active.

## Architecture

This is a pnpm + Turborepo monorepo. Each package has exactly one job:

```
apps/
  cli/        The `claude-assist` command — menu, subcommands, output rendering, launches `claude`
  dashboard/  Local usage analytics dashboard (React + Express)

packages/
  types/      Shared types and the extension-point interfaces every other package implements against
  scanner/    Detects framework, language, package manager; counts files and LOC
  git/        Reads branch, changed / untracked / staged files (simple-git)
  models/     Context estimation, model recommendation, focus detection, and the analyzer + provider suggestion engine
  core/       Orchestrates scanner + git + models into one `AnalysisResult`; launches `claude`
  usage/      Parses Claude Code's local session history and computes usage / cost analytics
```

- **`@claude-assist/types`** has zero runtime dependencies and defines the contracts everything else implements (`Scanner`, `ModelRecommender`, `SuggestionProvider`, `FocusArea`, and the shared `AnalysisResult`).
- **`@claude-assist/scanner`**, **`@claude-assist/git`**, and **`@claude-assist/models`** are independent and know nothing about each other. Each is easy to test or replace on its own.
- **`@claude-assist/core`** is the only package that wires the others together (`ClaudeAssistAnalyzer`) and the only thing that knows how to spawn `claude` (`ClaudeLauncher`). Collaborators are constructor-injected with sensible defaults.
- **`@claude-assist/usage`** is consumed by `apps/dashboard`, which the CLI's `analytics` command spawns as a child process (the CLI never imports the dashboard's React/Express dependencies directly).

Dependency direction is one-way: `cli → core → {scanner, git, models} → types`, with `usage → types` and `dashboard → usage`.

## Supported technologies

Detected from marker files, lockfiles, and source extensions:

| Area | Supported |
| --- | --- |
| Languages | TypeScript, JavaScript, Dart, Python, Java, C#, Go, Ruby, PHP, Rust |
| Frameworks | Next.js, NestJS, Express, React, Flutter |
| Package managers | pnpm, Yarn, npm, Bun |

Detection rules: marker files are authoritative (for example `tsconfig.json` for TypeScript, `go.mod` for Go, `pyproject.toml`/`requirements.txt` for Python), otherwise the language with the most source files wins. Frameworks come from `package.json` dependencies; Flutter from `pubspec.yaml`. Package managers come from lockfiles (`pnpm-lock.yaml`, `yarn.lock`, `package-lock.json`, `bun.lockb`).

## Development

Requires Node.js 22+ and [pnpm](https://pnpm.io).

```bash
pnpm install     # install dependencies
pnpm build       # build all packages and apps (via Turbo)
pnpm dev         # watch mode across all packages
pnpm typecheck   # typecheck every package
pnpm clean       # remove build output
```

Run the CLI from the repo without publishing:

```bash
node apps/cli/dist/index.js         # interactive menu (needs a real terminal)
node apps/cli/dist/index.js scan    # or a subcommand directly — works with piped output
```

## Publishing

The npm package is published from `apps/cli`. From that directory:

```bash
npm pack --dry-run          # inspect the exact files that would be published
npm publish --access public # publish to npm
```

The `prepack` script builds the CLI (and its workspace dependencies) automatically, and the `files` field limits the published artifact to `dist` and `assets`.

## Contributing

Contributions are welcome. To get started:

1. **Fork** the repository and create a feature branch.
2. **Set up** the repo: `pnpm install && pnpm build`.
3. **Make your change** — add or update code, and keep the architecture one-way (`cli → core → {scanner, git, models} → types`). No new package may depend on the CLI or the dashboard.
4. **Check** your work: `pnpm typecheck` and `pnpm build` must pass.
5. **Open a pull request** with a clear description of the change and how you verified it.

Guidelines:

- Do not introduce a new dependency without explaining why it is necessary.
- Keep analysis and presentation separate: inspection code returns facts; suggestion code turns facts into recommendations. Never mix the two in one module.
- Add a test or a documented manual verification for any behavior you change.
- Match the existing code style in the file you are editing (this repository uses semicolons; quote style varies by file, so follow the surrounding code).

## License

[MIT](LICENSE) © 2026 Claude Assist Contributors

# claude-assist
