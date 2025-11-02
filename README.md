# grammY CLI

A Deno-first scaffolding CLI for bootstrapping production-grade [grammY](https://grammy.dev)
Telegram bot projects with optional plugin presets and deployment recipes.

## Overview

grammY CLI simplifies the process of creating new Telegram bots powered by the grammY framework. It
provides:

- **Multiple Template Variants**: Minimal TypeScript/JavaScript starters and advanced presets with
  conversations, menus, rate limiting, and i18n
- **Multi-Runtime Support**: Generate projects compatible with Deno, Node.js (≥18), and Bun (≥1.1)
- **Plugin Integration**: Pre-configured templates with official grammY plugins
- **Deployment Ready**: Includes deployment recipes for Deno Deploy, Node, and Bun environments

## Installation

> **Note**: Project is currently in development (Phase 0 complete, Phase 1 in progress)

Once published to JSR, you'll be able to run it with:

```bash
# Deno
deno run jsr:@scope/grammy-cli new my-bot

# Node.js
npx jsr:@scope/grammy-cli new my-bot

# Bun
bunx jsr:@scope/grammy-cli new my-bot
```

## Quick Start

```bash
# Create a new bot project
grammy-cli new my-awesome-bot

# List available templates
grammy-cli list

# Check your environment
grammy-cli doctor

# Upgrade CLI to latest version
grammy-cli upgrade
```

## Available Commands

- `new <project-name>` - Create a new grammY bot project
- `list` - Display available template variants
- `doctor` - Validate environment and runtime compatibility
- `upgrade` - Update CLI to the latest version

## Template Variants

1. **Minimal TypeScript** - Lightweight starter with environment config, lint, and test tasks
2. **Minimal JavaScript** - JavaScript equivalent of the TypeScript template
3. **Advanced Preset** - Full-featured template including:
   - `@grammyjs/conversations` for conversation handling
   - `@grammyjs/menu` for interactive menus
   - `@grammyjs/ratelimiter` for rate limiting
   - `@grammyjs/i18n` for internationalization

## Development

See [AGENTS.md](./AGENTS.md) for detailed development guidelines.

```bash
# Format code
deno fmt

# Lint code
deno lint

# Run tests
deno test

# Run all checks before committing
deno task ok
```

## Documentation

- **[PLAN.md](./PLAN.md)** - Project vision, architecture, and implementation roadmap
- **[AGENTS.md](./AGENTS.md)** - Development guidelines and conventions for contributors
- **[TASKS.md](./TASKS.md)** - Detailed task list organized by implementation phases

## Project Status

- ✅ Phase 0: Foundations - **Complete**
- 🚧 Phase 1: CLI Core - **In Progress**
- ⏳ Phase 2: Template Engine Integration - **Planned**
- ⏳ Phase 3: Advanced Templates & Plugins - **Planned**
- ⏳ Phase 4: QA & Distribution - **Planned**

## Contributing

Contributions are welcome! Please:

1. Check [TASKS.md](./TASKS.md) for open tasks
2. Follow conventions outlined in [AGENTS.md](./AGENTS.md)
3. Run `deno task ok` before submitting changes
4. Reference relevant plan sections in commit messages

## License

TBD - To be determined before first public release

## Resources

- [grammY Documentation](https://grammy.dev)
- [grammY Plugins](https://grammy.dev/plugins/)
- [Deno Documentation](https://deno.land/manual)
- [JSR Registry](https://jsr.io)
