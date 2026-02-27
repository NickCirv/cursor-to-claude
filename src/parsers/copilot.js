import fs from 'fs'

/**
 * Parse .github/copilot-instructions.md
 * Copilot uses freeform markdown. We extract the full content and any
 * structured sections (code style, testing, architecture, etc.).
 */
export function parseCopilotInstructions(filePath) {
  if (!fs.existsSync(filePath)) return null

  const raw = fs.readFileSync(filePath, 'utf-8').trim()
  if (!raw) return null

  const sections = []
  const lines = raw.split('\n')
  let current = { heading: null, lines: [] }

  for (const line of lines) {
    const headingMatch = line.match(/^#{1,3}\s+(.+)/)
    if (headingMatch) {
      if (current.lines.some((l) => l.trim())) {
        sections.push({
          heading: current.heading,
          text: current.lines.join('\n').trim(),
        })
      }
      current = { heading: headingMatch[1], lines: [] }
    } else {
      current.lines.push(line)
    }
  }

  if (current.lines.some((l) => l.trim())) {
    sections.push({
      heading: current.heading,
      text: current.lines.join('\n').trim(),
    })
  }

  return { raw, sections, source: '.github/copilot-instructions.md' }
}
