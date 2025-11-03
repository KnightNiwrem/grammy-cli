# Task List · grammY Template CLI

## Legend

- **Status:** `[ ]` pending | `[~]` in progress | `[x]` completed
- **Priority:** (H)igh, (M)edium, (L)ow
- **Effort:** Time estimate in hours (h) or days (d)
- **Dependencies:** Prerequisite tasks (referenced by task ID)

---

## Phase 0 – Foundations ✅ **COMPLETE**

**Phase Goal:** Establish project foundation with repo structure, tooling, and utilities.
**Timeline:** 1-2 days | **Status:** Complete

### P0.1 - [x] (H) Establish repo scaffolding

- **Effort:** 2-3h
- **Dependencies:** None
- **Acceptance Criteria:**
  - Directory structure: `src/`, `templates/`, `scripts/` created
  - `deno.json` configured with basic tasks
  - `.gitignore` with appropriate exclusions
- **Completed:** ✓

### P0.2 - [x] (H) Configure lint/format/test tasks

- **Effort:** 1-2h
- **Dependencies:** P0.1
- **Acceptance Criteria:**
  - `deno.lock` generated and committed
  - `deno task ok` executes fmt check, lint, and test
  - All checks pass on clean repo
- **Completed:** ✓

### P0.3 - [x] (M) Draft minimal CI workflow

- **Effort:** 2h
- **Dependencies:** P0.2
- **Acceptance Criteria:**
  - GitHub Actions workflow in `.github/workflows/ci.yml`
  - Runs on push and pull request events
  - Executes `deno fmt --check`, `deno lint`, `deno test`
  - Reports failures appropriately
- **Completed:** ✓

### P0.4 - [x] (H) Implement shared utilities

- **Effort:** 4-6h
- **Dependencies:** P0.1
- **Acceptance Criteria:**
  - Logger with verbosity levels (info, warn, error, debug)
  - File system helpers (copy, exists, mkdir, readDir)
  - Runtime detection (detectDeno, detectNode, detectBun)
  - Unit tests with ≥80% coverage
  - All utilities exported from `src/utils/index.ts`
- **Completed:** ✓

**Phase Retrospective:** Foundation completed successfully. Utilities well-tested and CI
operational.

---

## Phase 1 – CLI Core 🚧 **IN PROGRESS**

**Phase Goal:** Build functional CLI with core commands (list, doctor) and options parsing.
**Timeline:** 3-4 days | **Status:** In Progress

**Current Gaps Before Phase 2:**

- Wire CLI version flag to `deno.json` and add option parsing coverage (P1.1).
- Improve `list` output formatting and add regression tests (P1.2).
- Add JSR/npm compatibility validation and tighten failure handling in `doctor` (P1.3).
- Implement interactive prompt layer with graceful Ctrl+C handling (P1.4).

### P1.1 - [~] (H) Implement Commander-based entry point

- **Effort:** 4-6h
- **Dependencies:** P0.4
- **Owner:** TBD
- **Acceptance Criteria:**
  - `src/cli.ts` exports Commander program
  - Global options: `--verbose`, `--runtime [deno|node|bun]`, `--no-interactive`
  - Help text renders correctly (handle terminal width with `Deno.consoleSize`)
  - Version flag displays current version from `deno.json`
  - Entry point callable via `deno run src/cli.ts`
  - Unit tests for option parsing
- **Status Notes:** Commander entry point exists with global flags, but version flag is still
  hard-coded and option parsing lacks tests.
- **Testing:** Run `deno run src/cli.ts --help` and verify output

### P1.2 - [~] (H) Build `list` command

- **Effort:** 3-4h
- **Dependencies:** P1.1
- **Owner:** TBD
- **Acceptance Criteria:**
  - Command: `grammy-cli list [options]`
  - Reads template manifest from `templates/index.ts` (stub acceptable for now)
  - Displays template name, description, plugins, runtime compatibility
  - Formats output in readable columns
  - `--json` flag outputs machine-readable JSON
  - Graceful error handling if manifest missing/invalid
- **Status Notes:** Command loads stub manifest and supports JSON output, but table formatting
  remains basic and there are no regression tests yet.
- **Testing:** Create stub manifest, run `list`, verify output format

### P1.3 - [~] (H) Build `doctor` command

- **Effort:** 4-5h
- **Dependencies:** P1.1, P0.4
- **Owner:** TBD
- **Acceptance Criteria:**
  - Command: `grammy-cli doctor [options]`
  - Detects Deno version and validates ≥1.46
  - Detects Node version (if installed) and validates ≥18
  - Detects Bun version (if installed) and validates ≥1.1
  - Checks for `deno.json` or `package.json` in current directory
  - Validates JSR/npm import compatibility
  - Color-coded output (✓ green for pass, ✗ red for fail, - yellow for warnings)
  - Exit code 0 if all checks pass, 1 if critical failures
- **Status Notes:** Version checks and colorized output implemented, but JSR/npm compatibility
  validation is missing and Node/Bun failures only warn, so critical failure paths need tightening.
- **Testing:** Run in various environments, verify detection accuracy

### P1.4 - [ ] (M) Wire interactive prompt layer

- **Effort:** 3-4h
- **Dependencies:** P1.1
- **Owner:** TBD
- **Acceptance Criteria:**
  - Integrate `npm:prompts` for interactive inputs
  - Fallback to flag-based inputs when `--no-interactive` set
  - Prompt utilities: text input, select, multiselect, confirm
  - Handles Ctrl+C gracefully (cleanup, exit code 130)
  - Works in TTY and non-TTY environments
  - Unit tests with mocked prompts
- **Status Notes:** Not started; required to complete Phase 1 before moving into template
  integration.
- **Testing:** Test both interactive and non-interactive modes

**Phase Exit Criteria:** All P1.x tasks complete, `list` and `doctor` commands functional, help text
comprehensive.

---

## Phase 2 – Template Engine Integration

**Phase Goal:** Integrate Eta, create template system, generate minimal TS/JS projects.
**Timeline:** 4-5 days | **Status:** Pending

### P2.1 - [ ] (H) Integrate Eta renderer and file emission

- **Effort:** 5-6h
- **Dependencies:** P1.1
- **Owner:** TBD
- **Acceptance Criteria:**
  - Install `npm:eta` dependency
  - Create rendering pipeline: `src/template/renderer.ts`
  - Support `.eta` file rendering with variable substitution
  - Handle partials for reusable template fragments
  - Cross-platform path resolution (Windows/Unix)
  - Emit files preserving directory structure
  - Error handling for invalid templates or I/O failures
  - Unit tests for renderer with sample templates
- **Testing:** Render sample template, verify output matches expected

### P2.2 - [ ] (H) Define template manifest schema and loader

- **Effort:** 3-4h
- **Dependencies:** P2.1
- **Owner:** TBD
- **Acceptance Criteria:**
  - Schema: `TemplateManifest` interface with name, description, plugins, files[], runtime
  - Manifest file: `templates/index.ts` exporting array of manifests
  - Loader utility: `src/template/loader.ts`
  - Validation: required fields, valid plugin names, file paths exist
  - TypeScript types exported for reuse
  - Unit tests for loader and validation
- **Testing:** Load manifest, validate against schema, handle malformed manifests

### P2.3 - [ ] (H) Author minimal TypeScript template

- **Effort:** 6-8h
- **Dependencies:** P2.2
- **Owner:** TBD
- **Acceptance Criteria:**
  - Template location: `templates/minimal-ts/`
  - Files: `bot.ts`, `.env.example`, `deno.json`, `README.md`, `.gitignore`
  - Features: env config, basic bot setup, lint/fmt/test tasks
  - Uses official grammY package from jsr: `@grammyjs/grammy`
  - Includes deployment notes for Deno Deploy
  - All files pass `deno fmt` and `deno lint` after generation
  - Generated bot runs without errors (with mock token)
  - Manifest entry added to `templates/index.ts`
- **Testing:** Generate project, run `deno task ok`, start bot with test token

### P2.4 - [ ] (M) Author minimal JavaScript template

- **Effort:** 4-5h
- **Dependencies:** P2.3
- **Owner:** TBD
- **Acceptance Criteria:**
  - Template location: `templates/minimal-js/`
  - Mirror of TS template but using `.js` files
  - Includes JSDoc type hints where beneficial
  - ESLint configuration for JavaScript (or equivalent Deno checks)
  - Same feature parity as TS template
  - Manifest entry added
- **Testing:** Generate, lint, run with test token

### P2.5 - [ ] (M) Add automated smoke tests for generated projects

- **Effort:** 4-5h
- **Dependencies:** P2.3, P2.4
- **Owner:** TBD
- **Acceptance Criteria:**
  - Test script: `scripts/test-templates.ts`
  - Task: `deno task test:templates`
  - For each template: generate to temp dir, run lint/fmt, attempt bot instantiation
  - Captures and reports failures with clear error messages
  - Runs in CI after template changes
  - Cleanup temp directories after tests
- **Testing:** Run smoke tests, verify all templates pass

### P2.6 - [ ] (H) Implement `new` command with basic scaffolding

- **Effort:** 5-6h
- **Dependencies:** P2.1, P2.2
- **Owner:** TBD
- **Acceptance Criteria:**
  - Command: `grammy-cli new <project-name> [options]`
  - Options: `--template <name>`, `--runtime <deno|node|bun>`, `--no-git`, `--no-install`
  - Interactive mode prompts for template selection if not specified
  - Validates project name (no spaces, valid dir name)
  - Creates project directory, renders template, emits files
  - Initializes git repo unless `--no-git` specified
  - Installs dependencies unless `--no-install` specified
  - Displays post-scaffold instructions (how to run, next steps)
  - Error handling: project exists, invalid template, I/O failures
- **Testing:** Generate projects with various options, verify structure and functionality

**Phase Exit Criteria:** Templates generate successfully, pass all checks, `new` command functional,
smoke tests passing.

---

## Phase 3 – Advanced Templates & Plugins

**Phase Goal:** Add advanced template with plugins, implement plugin selection, document deployment.
**Timeline:** 5-6 days | **Status:** Pending

### P3.1 - [ ] (H) Implement plugin selection flags and prompts

- **Effort:** 4-5h
- **Dependencies:** P2.6
- **Owner:** TBD
- **Acceptance Criteria:**
  - Flags: `--plugins <comma-separated>` for non-interactive mode
  - Interactive prompt: multiselect for plugin options
  - Plugin options: conversations, menu, rate-limiter, i18n, auto-retry, parse-mode
  - Validation: compatible plugin combinations, runtime requirements
  - Updates template variables for conditional file generation
  - Unit tests for plugin selection logic
- **Testing:** Select various plugin combinations, verify template rendering

### P3.2 - [ ] (H) Create advanced template with conversations preset

- **Effort:** 8-10h
- **Dependencies:** P3.1
- **Owner:** TBD
- **Acceptance Criteria:**
  - Template location: `templates/advanced/`
  - Base features: TS, env config, lint/fmt/test
  - Plugins: `@grammyjs/conversations`, `@grammyjs/menu`, `@grammyjs/ratelimiter`
  - Example conversation flow demonstrating plugin usage
  - Session storage configuration (in-memory for demo)
  - Rate limiter with sensible defaults
  - Interactive menu example
  - Structured bot architecture (handlers/, middleware/, utils/)
  - Comprehensive README with plugin documentation
  - Manifest entry with plugin metadata
- **Testing:** Generate, verify plugins work, test conversation flow

### P3.3 - [ ] (M) Integrate i18n preset

- **Effort:** 4-5h
- **Dependencies:** P3.2
- **Owner:** TBD
- **Acceptance Criteria:**
  - Add `@grammyjs/i18n` to advanced template (conditionally)
  - Locale files: `locales/en.json`, `locales/de.json` (examples)
  - i18n middleware integration
  - Template variables for locale selection
  - Documentation on adding new locales
  - Example usage in bot commands
- **Testing:** Generate with i18n, switch locales, verify translations

### P3.4 - [ ] (M) Document deployment recipes

- **Effort:** 4-5h
- **Dependencies:** P3.2
- **Owner:** TBD
- **Acceptance Criteria:**
  - Deployment docs in generated `DEPLOYMENT.md`
  - **Deno Deploy:** Step-by-step guide with env var setup
  - **Node.js:** Dockerfile, npm scripts, process manager (PM2) example
  - **Bun:** Bun-specific deployment notes
  - Environment variable checklists for each platform
  - Links to platform-specific documentation
  - Webhook vs polling considerations
  - Production best practices (error handling, logging, monitoring)
- **Testing:** Follow deployment guides, verify accuracy

**Phase Exit Criteria:** Advanced template functional with plugins, deployment recipes complete, all
presets tested.

---

## Phase 4 – QA, Release & Distribution

**Phase Goal:** Comprehensive testing, CI matrix, release workflow, validate publishing.
**Timeline:** 3-4 days | **Status:** Pending

### P4.1 - [ ] (H) Expand test suite to ≥80% coverage

- **Effort:** 6-8h
- **Dependencies:** All prior phases
- **Owner:** TBD
- **Acceptance Criteria:**
  - Unit tests for all utilities, commands, template logic
  - Integration tests for end-to-end CLI workflows
  - Snapshot tests for template outputs
  - Coverage report via `deno coverage`
  - All tests pass on Deno, Node, Bun
  - Code coverage badge in README
- **Testing:** Run `deno coverage`, verify ≥80% threshold

### P4.2 - [ ] (H) Configure CI matrix across runtimes

- **Effort:** 4-5h
- **Dependencies:** P4.1
- **Owner:** TBD
- **Acceptance Criteria:**
  - GitHub Actions matrix: Deno (latest), Node (18, 20, 22), Bun (latest)
  - Each matrix job runs fmt/lint/test + template smoke tests
  - OS matrix: ubuntu-latest, macos-latest, windows-latest (optional)
  - Caching for dependencies to speed up CI
  - Status badge in README
  - Failing tests block merges
- **Testing:** Trigger CI on test PR, verify all matrix jobs pass

### P4.3 - [ ] (H) Implement release workflow

- **Effort:** 5-6h
- **Dependencies:** P4.2
- **Owner:** TBD
- **Acceptance Criteria:**
  - Script: `scripts/release.ts`
  - Task: `deno task release`
  - Steps: version bump prompt, changelog generation stub, run tests, build artifacts
  - Dry-run publish: `deno publish --dry-run`
  - Pre-release checklist (tests pass, docs updated, changelog written)
  - Git tag creation with semantic versioning
  - Automated GitHub release creation
- **Testing:** Run release script in dry-run mode, verify steps complete

### P4.4 - [ ] (M) Validate npx/bunx execution paths

- **Effort:** 3-4h
- **Dependencies:** P4.3
- **Owner:** TBD
- **Acceptance Criteria:**
  - Test execution via `npx jsr:@scope/grammy-cli` (after JSR publish)
  - Test execution via `bunx jsr:@scope/grammy-cli`
  - Verify all commands work through npm/bunx wrappers
  - Document execution patterns in README
  - Troubleshooting guide for common issues
- **Testing:** Run via npx/bunx in fresh environments, verify functionality

### P4.5 - [ ] (L) Draft release notes and upgrade guidance

- **Effort:** 2-3h
- **Dependencies:** P4.3
- **Owner:** TBD
- **Acceptance Criteria:**
  - Release notes template in `scripts/release-notes-template.md`
  - Upgrade guidance surfaced via `grammy-cli upgrade --help`
  - Changelog format follows Keep a Changelog conventions
  - Breaking changes clearly highlighted
  - Migration guides for major version bumps
- **Testing:** Review release notes for clarity and completeness

**Phase Exit Criteria:** ≥80% test coverage, CI passing on all runtimes, successful dry-run publish,
documentation complete.

---

## Backlog & Exploratory

**Phase Goal:** Future enhancements, post-v1.0 features.

### B1 - [ ] (M) Plugin marketplace/discovery feature

- **Effort:** 2-3d
- **Dependencies:** Phase 4 complete
- **Owner:** TBD
- **Notes:** Command to list/search available grammY plugins, install to existing projects
- **Status:** Backlogged to v1.1+

### B2 - [ ] (L) Telemetry hooks (opt-in)

- **Effort:** 2-3d
- **Dependencies:** Phase 4 complete
- **Owner:** TBD
- **Notes:** Privacy-first usage analytics with explicit user consent
- **Status:** Pending user feedback and privacy policy

### B3 - [ ] (L) Additional deployment targets

- **Effort:** 3-4d
- **Dependencies:** Phase 3 complete
- **Owner:** TBD
- **Notes:** Fly.io, AWS Lambda, Cloudflare Workers deployment recipes
- **Status:** Evaluate based on community requests

### B4 - [ ] (M) Template customization wizard

- **Effort:** 4-5d
- **Dependencies:** Phase 3 complete
- **Owner:** TBD
- **Notes:** Interactive wizard for granular template customization beyond presets
- **Status:** Future enhancement

---

## Quick Reference

### Current Sprint Focus

**Phase 1 - CLI Core:** Building foundation with Commander, list, and doctor commands.

### Next Up

- P1.1: Commander entry point
- P1.2: `list` command
- P1.3: `doctor` command

### Blocked Tasks

None currently.

### Task Assignment

All Phase 1 tasks currently unassigned. Check with team lead for task pickup.
