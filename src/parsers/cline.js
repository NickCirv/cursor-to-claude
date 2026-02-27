import fs from 'fs'
import path from 'path'

/**
 * Parse .clinerules — freeform instruction file.
 */
export function parseClineRules(filePath) {
  if (!fs.existsSync(filePath)) return null

  const raw = fs.readFileSync(filePath, 'utf-8').trim()
  if (!raw) return null

  return { raw, sections: extractSections(raw), source: '.clinerules' }
}

/**
 * Parse cline_docs/ directory — Cline stores context as markdown files.
 * Common files: productContext.md, activeContext.md, systemPatterns.md,
 * techContext.md, progress.md
 */
export function parseClineDocs(dirPath) {
  if (!fs.existsSync(dirPath)) return null

  const files = fs
    .readdirSync(dirPath)
    .filter((f) => f.endsWith('.md'))
    .sort()

  if (files.length === 0) return null

  const docs = files.map((file) => {
    const raw = fs.readFileSync(path.join(dirPath, file), 'utf-8').trim()
    const name = path.basename(file, '.md')
    return {
      name,
      label: friendlyLabel(name),
      raw,
      sections: extractSections(raw),
      source: `cline_docs/${file}`,
    }
  })

  return docs
}

function friendlyLabel(name) {
  const labels = {
    productContext: 'Product Context',
    activeContext: 'Active Context',
    systemPatterns: 'System Patterns',
    techContext: 'Tech Stack',
    progress: 'Progress & Status',
  }
  return labels[name] || name.replace(/([A-Z])/g, ' $1').trim()
}

function extractSections(text) {
  const lines = text.split('\n')
  const sections = []
  let current = { heading: null, lines: [] }

  for (const line of lines) {
    const headingMatch = line.match(/^#{1,3}\s+(.+)/)
    if (headingMatch) {
      if (current.lines.some((l) => l.trim())) {
        sections.push({ heading: current.heading, text: current.lines.join('\n').trim() })
      }
      current = { heading: headingMatch[1], lines: [] }
    } else {
      current.lines.push(line)
    }
  }

  if (current.lines.some((l) => l.trim())) {
    sections.push({ heading: current.heading, text: current.lines.join('\n').trim() })
  }

  return sections
}
