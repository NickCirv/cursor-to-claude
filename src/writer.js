import fs from 'fs'
import path from 'path'

/**
 * Write the mapped output to disk (or simulate for --dry-run).
 * Returns an array of { action, filePath, content } describing what was written.
 */
export function write(mapped, projectDir, { dryRun = false } = {}) {
  const operations = []

  // CLAUDE.md
  const claudeMdPath = path.join(projectDir, 'CLAUDE.md')
  operations.push({
    action: fs.existsSync(claudeMdPath) ? 'update' : 'create',
    filePath: claudeMdPath,
    relativePath: 'CLAUDE.md',
    content: mapped.claudeMd,
  })

  // .claude/settings.json
  if (mapped.settings && Object.keys(mapped.settings).length > 0) {
    const settingsPath = path.join(projectDir, '.claude', 'settings.json')
    let existing = {}

    if (fs.existsSync(settingsPath)) {
      try {
        existing = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'))
      } catch {
        existing = {}
      }
    }

    const merged = mergeSettings(existing, mapped.settings)
    operations.push({
      action: fs.existsSync(settingsPath) ? 'update' : 'create',
      filePath: settingsPath,
      relativePath: '.claude/settings.json',
      content: JSON.stringify(merged, null, 2) + '\n',
    })
  }

  // .claude/rules/*.md
  for (const rule of mapped.rules) {
    const rulesDir = path.join(projectDir, '.claude', 'rules')
    const rulePath = path.join(rulesDir, `${rule.name}.md`)
    operations.push({
      action: fs.existsSync(rulePath) ? 'update' : 'create',
      filePath: rulePath,
      relativePath: `.claude/rules/${rule.name}.md`,
      content: rule.content,
    })
  }

  if (!dryRun) {
    for (const op of operations) {
      const dir = path.dirname(op.filePath)
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
      fs.writeFileSync(op.filePath, op.content, 'utf-8')
    }
  }

  return operations
}

/**
 * Deep merge settings, combining arrays and objects.
 */
function mergeSettings(existing, incoming) {
  const result = { ...existing }

  for (const [key, value] of Object.entries(incoming)) {
    if (Array.isArray(value)) {
      const existingArr = Array.isArray(existing[key]) ? existing[key] : []
      result[key] = [...new Set([...existingArr, ...value])]
    } else if (typeof value === 'object' && value !== null) {
      result[key] = mergeSettings(existing[key] || {}, value)
    } else {
      result[key] = value
    }
  }

  return result
}
