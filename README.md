![cursor-to-claude](./banner.svg)

# cursor-to-claude

**The great migration. One command.**

```bash
npx cursor-to-claude
```

---

## We were Cursor users.

Good ones, too. We had `.cursorrules` tuned to our exact preferences. Copilot instructions committed to every repo. Windsurf configs shared across the team. Cline docs keeping our AI grounded.

Then we spent a week with Claude Code.

It wasn't just better autocomplete. It was a different paradigm — an AI that reads your entire codebase, reasons about it, executes real workflows, and gets out of the way. Not a co-pilot. A second engineer.

We switched. And then we built this tool so you don't have to do the migration by hand.

---

## What this does

Detects which AI tool configs are in your project and converts them to Claude Code format — preserving your intent, not just copying text.

| Source | Destination |
|--------|-------------|
| `.cursorrules` | `CLAUDE.md` + `.claude/rules/cursor-migrated.md` |
| `.cursorignore` | `.claude/settings.json` `ignorePaths` |
| `.cursor/rules/` | `.claude/rules/cursor-*.md` |
| `.github/copilot-instructions.md` | `CLAUDE.md` + `.claude/rules/copilot-migrated.md` |
| `.windsurfrules` | `CLAUDE.md` + `.claude/rules/windsurf-migrated.md` |
| `.clinerules` | `CLAUDE.md` |
| `cline_docs/` | `.claude/rules/cline-context.md` |

It's not a dumb copy. The mapper applies concept-level translations — "always use TypeScript" becomes a proper CLAUDE.md instruction. Generic AI filler ("you are a helpful assistant") gets stripped. Your `.cursorignore` becomes `ignorePaths` in settings.

---

## Install

No install required:

```bash
npx cursor-to-claude
```

Or install globally:

```bash
npm install -g cursor-to-claude
cursor-to-claude
```

---

## Usage

```bash
# Migrate the current directory
npx cursor-to-claude

# Migrate a specific project
npx cursor-to-claude /path/to/project

# Preview without writing (dry run)
npx cursor-to-claude --dry-run

# Preview with generated content shown
npx cursor-to-claude --diff

# Skip confirmation prompt
npx cursor-to-claude --yes
```

---

## What gets created

After running, you'll have:

```
your-project/
├── CLAUDE.md                        # Main instructions for Claude Code
└── .claude/
    ├── settings.json                # Ignore paths, permissions, etc.
    └── rules/
        ├── cursor-migrated.md       # Detailed rules from .cursorrules
        ├── copilot-migrated.md      # Copilot instructions
        ├── windsurf-migrated.md     # Windsurf rules
        └── cline-context.md         # Cline project context docs
```

`CLAUDE.md` is the primary file — Claude Code reads it at the start of every session. The `rules/` files are loaded by Claude Code automatically and give you granular control.

---

## After migrating

Three steps:

1. **Review `CLAUDE.md`** — the migration preserves your intent but you know your project best. Clean up anything that doesn't translate well.

2. **Open Claude Code** in the project:
   ```bash
   claude
   ```

3. **That's it.** Your instructions are live.

---

## Why Claude Code

If you're coming from Cursor, here's what changes:

| Cursor / Copilot | Claude Code |
|------------------|-------------|
| Tab completion with context | Reads the entire codebase, reasons about it |
| Sidebar chat | Agentic — runs commands, edits files, tests code |
| Per-file context | Project-wide context with memory |
| Rules file applied passively | CLAUDE.md actively guides every session |
| Autocomplete-first | Reasoning-first |

The mental model shift: you're not correcting autocomplete anymore. You're working with an engineer who has read all your code.

---

## Claude Code config in 60 seconds

**CLAUDE.md** — your main instruction file. Lives in project root. Gets read every session.

```markdown
# CLAUDE.md

## Code Style
- TypeScript everywhere, no `any`
- Functional React components only
- Zod for input validation at all boundaries

## Testing
- Write tests for all new code
- Jest + Testing Library

## Commits
- Conventional Commits format
```

**.claude/settings.json** — permissions and ignore paths:

```json
{
  "ignorePaths": ["node_modules", ".env", "dist"],
  "permissions": {
    "allow": ["Bash", "Read", "Write", "Edit"]
  }
}
```

**.claude/rules/*.md** — modular rule sets loaded automatically. Good for separating concerns: `coding-style.md`, `testing.md`, `security.md`.

---

## Requirements

- Node.js 18+
- A project with at least one of: `.cursorrules`, `.cursorignore`, `.github/copilot-instructions.md`, `.windsurfrules`, `.clinerules`, `cline_docs/`

No API key. No Anthropic account. Pure file parsing.

---

## Contributing

Bug reports, feature requests, and PRs welcome. Open an issue.

Common requests we're tracking:
- Support for `.aiderignore` / Aider config
- Support for Continue.dev config
- Watch mode (re-migrate on config changes)

---

## License

MIT — [NickCirv](https://github.com/NickCirv)

---

*Built by someone who made the switch and never looked back.*
