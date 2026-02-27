import fs from 'fs'

/**
 * Parse .windsurfrules
 * Windsurf uses a similar freeform format to Cursor.
 * Sections separated by headings or double newlines.
 */
export function parseWindsurfRules(filePath) {
  if (!fs.existsSync(filePath)) return null

  const raw = fs.readFileSync(filePath, 'utf-8').trim()
  if (!raw) return null

  const sections = []
  const blocks = raw.split(/\n{2,}/)

  for (const block of blocks) {
    const trimmed = block.trim()
    if (!trimmed) continue

    const firstLine = trimmed.split('\n')[0]
    const headingMatch = firstLine.match(/^#{1,3}\s+(.+)/)

    if (headingMatch) {
      sections.push({
        heading: headingMatch[1],
        text: trimmed.replace(/^#{1,3}\s+.+\n?/, '').trim(),
      })
    } else {
      sections.push({ heading: null, text: trimmed })
    }
  }

  return { raw, sections, source: '.windsurfrules' }
}
