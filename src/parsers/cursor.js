import fs from 'fs'
import path from 'path'

/**
 * Parse .cursorrules — freeform text instructions.
 * Returns { raw, sections } where sections are logical blocks split by headings or blank lines.
 */
export function parseCursorRules(filePath) {
  if (!fs.existsSync(filePath)) return null

  const raw = fs.readFileSync(filePath, 'utf-8').trim()
  if (!raw) return null

  const sections = extractSections(raw)

  return { raw, sections, source: '.cursorrules' }
}

/**
 * Parse .cursorignore — same format as .gitignore.
 * Returns an array of glob patterns.
 */
export function parseCursorIgnore(filePath) {
  if (!fs.existsSync(filePath)) return null

  const raw = fs.readFileSync(filePath, 'utf-8').trim()
  if (!raw) return null

  const patterns = raw
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))

  return { patterns, source: '.cursorignore' }
}

/**
 * Parse .cursor/rules directory — each file is a named rule set.
 */
export function parseCursorRulesDir(dirPath) {
  if (!fs.existsSync(dirPath)) return null

  const files = fs.readdirSync(dirPath).filter((f) => f.endsWith('.md') || f.endsWith('.txt'))
  if (files.length === 0) return null

  return files.map((file) => {
    const raw = fs.readFileSync(path.join(dirPath, file), 'utf-8').trim()
    return {
      name: path.basename(file, path.extname(file)),
      raw,
      sections: extractSections(raw),
      source: `.cursor/rules/${file}`,
    }
  })
}

function extractSections(text) {
  const lines = text.split('\n')
  const sections = []
  let current = { heading: null, lines: [] }

  for (const line of lines) {
    const headingMatch = line.match(/^#{1,3}\s+(.+)/)
    if (headingMatch) {
      if (current.lines.some((l) => l.trim())) {
        sections.push({ ...current, text: current.lines.join('\n').trim() })
      }
      current = { heading: headingMatch[1], lines: [] }
    } else {
      current.lines.push(line)
    }
  }

  if (current.lines.some((l) => l.trim())) {
    sections.push({ ...current, text: current.lines.join('\n').trim() })
  }

  return sections
}
