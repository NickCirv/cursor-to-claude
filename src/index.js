import { program } from 'commander'
import chalk from 'chalk'
import path from 'path'
import { detect, hasClaudeConfig } from './detector.js'
import { parseCursorRules, parseCursorIgnore, parseCursorRulesDir } from './parsers/cursor.js'
import { parseCopilotInstructions } from './parsers/copilot.js'
import { parseWindsurfRules } from './parsers/windsurf.js'
import { parseClineRules, parseClineDocs } from './parsers/cline.js'
import { map } from './mapper.js'
import { write } from './writer.js'

const VERSION = '1.0.0'

export async function run() {
  program
    .name('cursor-to-claude')
    .description('Migrate your AI coding config to Claude Code. One command.')
    .version(VERSION)
    .argument('[dir]', 'Project directory to migrate', '.')
    .option('--dry-run', 'Show what would be created without writing any files')
    .option('--diff', 'Show a side-by-side diff of old vs new (implies --dry-run)')
    .option('--yes', 'Skip confirmation prompt and migrate immediately')
    .parse()

  const opts = program.opts()
  const [targetDir] = program.args
  const projectDir = path.resolve(targetDir || '.')
  const dryRun = opts.dryRun || opts.diff

  printBanner()

  // 1. Detect tools
  const tools = detect(projectDir)
  const existingClaude = hasClaudeConfig(projectDir)

  if (tools.length === 0) {
    console.log(chalk.yellow('  No AI tool configs found in this directory.\n'))
    console.log(chalk.dim('  Checked for: .cursorrules, .cursorignore, .cursor/rules,'))
    console.log(chalk.dim('               .github/copilot-instructions.md, .windsurfrules,'))
    console.log(chalk.dim('               .clinerules, cline_docs/\n'))
    process.exit(0)
  }

  // 2. Show detected tools
  console.log(chalk.bold('  Detected:\n'))
  for (const tool of tools) {
    console.log(chalk.green(`    + ${tool.name}`))
    for (const f of tool.files) {
      console.log(chalk.dim(`      ${path.relative(projectDir, f)}`))
    }
  }
  console.log()

  if (existingClaude) {
    console.log(chalk.yellow('  Warning: Claude Code config already exists in this project.'))
    console.log(chalk.dim('  Existing CLAUDE.md and .claude/settings.json will be updated, not replaced.\n'))
  }

  if (dryRun) {
    console.log(chalk.cyan('  Mode: dry-run — no files will be written.\n'))
  }

  // 3. Parse all detected tools
  const parsed = await parseAll(tools, projectDir)

  // 4. Map to Claude Code format
  const mapped = map(parsed)

  // 5. Plan operations
  const ops = write(mapped, projectDir, { dryRun: true }) // always plan first

  // 6. Show plan
  showPlan(ops, projectDir, opts.diff ? parsed : null, mapped)

  // 7. Confirm + execute
  if (!dryRun) {
    if (!opts.yes) {
      const confirmed = await confirm('\n  Migrate now? [Y/n] ')
      if (!confirmed) {
        console.log(chalk.dim('\n  Aborted. Nothing was written.\n'))
        process.exit(0)
      }
    }

    write(mapped, projectDir, { dryRun: false })
    printSuccess(ops, projectDir)
  } else if (!opts.diff) {
    console.log(chalk.dim('\n  Run without --dry-run to apply these changes.\n'))
  }
}

// ---- Parse all tools ----

async function parseAll(tools, projectDir) {
  const parsed = {}

  for (const tool of tools) {
    if (tool.id === 'cursor') {
      parsed.cursor = {
        rules: parseCursorRules(path.join(projectDir, '.cursorrules')),
        ignore: parseCursorIgnore(path.join(projectDir, '.cursorignore')),
        rulesDir: parseCursorRulesDir(path.join(projectDir, '.cursor', 'rules')),
      }
    }

    if (tool.id === 'copilot') {
      parsed.copilot = parseCopilotInstructions(
        path.join(projectDir, '.github', 'copilot-instructions.md')
      )
    }

    if (tool.id === 'windsurf') {
      parsed.windsurf = parseWindsurfRules(path.join(projectDir, '.windsurfrules'))
    }

    if (tool.id === 'cline') {
      parsed.cline = {
        rules: parseClineRules(path.join(projectDir, '.clinerules')),
        docs: parseClineDocs(path.join(projectDir, 'cline_docs')),
      }
    }
  }

  return parsed
}

// ---- Display helpers ----

function printBanner() {
  console.log()
  console.log(chalk.bold.white('  cursor-to-claude') + chalk.dim(` v${VERSION}`))
  console.log(chalk.dim('  The great migration. One command.\n'))
  console.log(chalk.dim('  ' + '─'.repeat(50)))
  console.log()
}

function showPlan(ops, projectDir, parsed, mapped) {
  console.log(chalk.bold('  Will create:\n'))

  for (const op of ops) {
    const icon = op.action === 'update' ? chalk.yellow('~') : chalk.green('+')
    const label = op.action === 'update' ? chalk.yellow('update') : chalk.green('create')
    console.log(`    ${icon} ${chalk.bold(op.relativePath)}  ${chalk.dim(`[${label}]`)}`)
  }

  if (parsed) {
    console.log()
    showDiff(parsed, mapped)
    return
  }

  // Summary stats
  const rulesCount = ops.filter((o) => o.relativePath.startsWith('.claude/rules')).length
  console.log()
  console.log(chalk.dim(`  ${ops.length} file(s) planned — ${rulesCount} rule file(s).`))
}

function showDiff(parsed, mapped) {
  console.log(chalk.bold('  Generated CLAUDE.md preview:\n'))
  const preview = mapped.claudeMd.split('\n').slice(0, 30).join('\n')
  console.log(
    preview
      .split('\n')
      .map((line) => chalk.dim('    ' + line))
      .join('\n')
  )
  if (mapped.claudeMd.split('\n').length > 30) {
    console.log(chalk.dim('    ... (truncated)'))
  }
  console.log()
}

function printSuccess(ops, projectDir) {
  console.log()
  console.log(chalk.bold.green('  Migration complete.\n'))

  for (const op of ops) {
    const icon = op.action === 'update' ? chalk.yellow('~') : chalk.green('+')
    console.log(`    ${icon} ${op.relativePath}`)
  }

  console.log()
  console.log(chalk.bold('  Next steps:\n'))
  console.log(chalk.dim('    1. Review CLAUDE.md — clean up migrated instructions'))
  console.log(chalk.dim('    2. Open Claude Code in this project: ') + chalk.white('claude'))
  console.log(chalk.dim('    3. Your rules and context are now active\n'))
  console.log(chalk.dim('  ') + chalk.bold('Welcome to Claude Code.') + chalk.dim(' You made the right call.\n'))
}

async function confirm(question) {
  process.stdout.write(chalk.bold(question))

  return new Promise((resolve) => {
    process.stdin.setEncoding('utf8')
    process.stdin.resume()
    process.stdin.once('data', (data) => {
      process.stdin.pause()
      const answer = data.trim().toLowerCase()
      resolve(answer === '' || answer === 'y' || answer === 'yes')
    })
  })
}
