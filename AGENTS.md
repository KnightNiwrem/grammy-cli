# AGENTS · grammY Template CLI

> This file guides autonomous and human collaborators. Consult `PLAN.md` for strategic roadmap and
> `TASKS.md` for granular execution items.

## Repository Overview

- Build a JSR-published scaffolding CLI that generates grammY bot starters for Deno, Node, and Bun
  runtimes.
- Source layout is expected to evolve into: `src/` (CLI + utilities), `templates/` (Eta-based
  blueprints), `scripts/` (release & QA helpers).

## Tooling & Setup

### Prerequisites
- **Deno:** Latest stable (≥1.46) - [Install Guide](https://deno.land/manual/getting_started/installation)
- **Node.js:** LTS (≥18) for cross-runtime compatibility tests - [Download](https://nodejs.org/)
- **Bun:** ≥1.1 for bunx validation path (optional) - [Install Guide](https://bun.sh/)
- **Git:** For version control and collaboration

### Installation & Setup
Currently in development phase. To work with the project:

```bash
# Clone the repository
git clone <repo-url>
cd grammy-cli

# Cache dependencies (ensures lock file is current)
deno cache src/cli.ts

# Verify setup
deno task ok  # Runs fmt check, lint, and tests
```

### Dependencies
- **Import Strategy:** Prefer `jsr:` and `npm:` specifiers over raw HTTPS imports to satisfy JSR
  publish rules.
- **Current Dependencies:**
  - `npm:commander@14.0.1` - CLI framework
  - `npm:eta` (planned Phase 2) - Template engine
  - `npm:prompts` (planned Phase 1) - Interactive prompts
- **Dependency Updates:** Review quarterly; test thoroughly before upgrading major versions.

## Build, Lint, Test

### Standard Commands
All commands configured in `deno.json`:

```bash
# Format code (auto-fix)
deno fmt

# Check formatting without changes
deno fmt --check

# Lint code
deno lint

# Run unit tests
deno test

# Run all checks (pre-commit validation)
deno task ok
# Equivalent to: deno fmt --check && deno lint && deno test
```

### Quality Assurance Workflow
1. **During Development:** Run `deno fmt` frequently to maintain consistent style
2. **Before Committing:** Always run `deno task ok` to ensure all checks pass
3. **Before Pushing:** Verify CI will pass by running the full test suite
4. **Phase 2+:** Smoke tests for generated projects run via `deno task test:templates`
5. **Before Releases:** Run `deno publish --dry-run` to catch JSR validation errors

### Testing Generated Projects
Once templates exist (Phase 2+):
- **Smoke Tests:** `deno task test:templates` - Validates generated projects scaffold correctly
- **Runtime Tests:** CI matrix tests generated projects on Deno/Node/Bun
- **Snapshot Tests:** Catch unintended template changes

## Coding Conventions

- Use ES modules with TypeScript (`.ts`) for source files; JavaScript templates must pass
  ESLint-equivalent checks shipped with scaffold.
- Match Deno fmt defaults (2-space indentation, trailing commas where valid, double quotes by
  default).
- Keep CLI options consistent with Commander best practices (kebab-case flags, descriptive help
  strings).

## CLI Implementation Notes

- Import Commander via `import { Command } from "npm:commander@14.0.1";` and call
  `await program.parseAsync(Deno.args);`.
- Capture terminal width using `Deno.consoleSize` when available; otherwise fall back to 80 columns
  to avoid wrapping issues noted in Commander x Deno discussions.
- Provide both interactive prompts (likely via `npm:prompts` or similar) and non-interactive flags
  for CI consumption.

## Template Authoring Guidelines

- Use [Eta](https://eta.js.org/) templates (`.eta`) for dynamic file sections; leverage partials for
  shared snippets (env files, README fragments).
- Store template manifests describing name, description, required plugins, runtime notes, and
  post-scaffold instructions.
- Ensure generated projects include `.env.example`, lint/test scripts, and deployment notes for Deno
  Deploy, Node, and Bun where applicable.
- Pin official grammY plugins (`@grammyjs/*`) for sessions, menus, rate limiting, and localization
  based on template preset.

## Release & Distribution

- Maintain semantic versioning; each release path should run fmt/lint/test + generated template
  smoke tests.
- Publish via `deno publish`; confirm CLI executes through `deno run jsr:@scope/grammy-cli`,
  `npx jsr:@scope/grammy-cli`, and `bunx jsr:@scope/grammy-cli`.
- Keep changelog/release notes minimal but clear; surface upgrade tips via CLI help instead of repo
  docs unless requested.

## Security & Compliance

- Do not commit secrets. Generated templates must read environment variables through `.env` loaders
  and document required keys.
- Avoid telemetry by default; if added, require explicit opt-in flags and document data collected.

## Coordination

- Strategic changes belong in `PLAN.md`; update when altering scope, timelines, or major
  architecture choices.
- Use `TASKS.md` to track execution progress; keep statuses current when work completes.
- Log major decisions and rationales in commit messages referencing relevant sections of this file
  or plan/tasks documents.

## Contributing

### Before Starting Work
1. Check [TASKS.md](./TASKS.md) for available tasks and their priorities
2. Comment on relevant GitHub issues or create one if needed
3. Ensure your environment meets prerequisites listed above
4. Review recent commits to understand current patterns

### Development Workflow
1. **Create a Feature Branch:** `git checkout -b feature/your-feature-name` or `fix/bug-description`
2. **Make Changes:** Follow coding conventions, write tests for new functionality
3. **Test Thoroughly:** Run `deno task ok` and relevant smoke tests
4. **Commit with Clear Messages:** Use conventional commit format (see PLAN.md Section 11)
5. **Push and Create PR:** Reference related tasks/issues in PR description
6. **Address Review Feedback:** Respond to comments, make requested changes

### Pull Request Guidelines
- **Title:** Clear, descriptive summary (e.g., "feat(cli): add doctor command for environment
  validation")
- **Description:** Reference PLAN.md sections, explain rationale, list testing performed
- **Checks:** Ensure CI passes (fmt, lint, tests) before requesting review
- **Size:** Keep PRs focused; split large changes into logical chunks

### Code Review Standards
- **Response Time:** Aim to review PRs within 48 hours
- **Feedback Style:** Constructive, specific, reference documentation when applicable
- **Approval:** At least one maintainer approval required before merge

### Open Questions & Decisions
For strategic questions and pending decisions, see **[PLAN.md Section 10](./PLAN.md#10-open-questions--decisions)**.
Major decisions are documented there with rationale and action items.
