import fs from 'fs'
import path from 'path'

const TOOL_SIGNATURES = {
  cursor: {
    name: 'Cursor',
    files: ['.cursorrules', '.cursorignore', '.cursor/rules'],
    color: 'cyan',
  },
  copilot: {
    name: 'GitHub Copilot',
    files: ['.github/copilot-instructions.md'],
    color: 'blue',
  },
  windsurf: {
    name: 'Windsurf',
    files: ['.windsurfrules'],
    color: 'green',
  },
  cline: {
    name: 'Cline',
    files: ['.clinerules', 'cline_docs'],
    color: 'yellow',
  },
}

/**
 * Detect which AI tools are configured in the given project directory.
 * Returns an array of { id, name, files } for each detected tool.
 */
export function detect(projectDir) {
  const detected = []

  for (const [id, tool] of Object.entries(TOOL_SIGNATURES)) {
    const foundFiles = tool.files.filter((f) => {
      const fullPath = path.join(projectDir, f)
      return fs.existsSync(fullPath)
    })

    if (foundFiles.length > 0) {
      detected.push({
        id,
        name: tool.name,
        color: tool.color,
        files: foundFiles.map((f) => path.join(projectDir, f)),
      })
    }
  }

  return detected
}

/**
 * Check whether a Claude Code config already exists in the project.
 */
export function hasClaudeConfig(projectDir) {
  return (
    fs.existsSync(path.join(projectDir, 'CLAUDE.md')) ||
    fs.existsSync(path.join(projectDir, '.claude'))
  )
}
