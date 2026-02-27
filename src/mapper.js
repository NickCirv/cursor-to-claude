/**
 * Maps parsed AI tool configs into Claude Code format.
 *
 * Output shape:
 * {
 *   claudeMd: string,             // CLAUDE.md content
 *   settings: object,             // .claude/settings.json content
 *   rules: [{ name, content }],   // .claude/rules/*.md files
 * }
 */

export function map(parsed) {
  const output = {
    claudeMd: '',
    settings: { ignorePaths: [] },
    rules: [],
  }

  const claudeSections = []

  // --- Cursor ---
  if (parsed.cursor?.rules) {
    const { raw, sections } = parsed.cursor.rules
    claudeSections.push(buildSection('Migrated from Cursor (.cursorrules)', mapInstructions(raw)))
    output.rules.push({
      name: 'cursor-migrated',
      content: buildRulesFile('Cursor Rules (migrated)', sections),
    })
  }

  if (parsed.cursor?.rulesDir) {
    for (const ruleFile of parsed.cursor.rulesDir) {
      output.rules.push({
        name: `cursor-${slugify(ruleFile.name)}`,
        content: buildRulesFile(`Cursor: ${ruleFile.name}`, ruleFile.sections),
      })
    }
  }

  if (parsed.cursor?.ignore) {
    output.settings.ignorePaths = [
      ...output.settings.ignorePaths,
      ...parsed.cursor.ignore.patterns,
    ]
  }

  // --- Copilot ---
  if (parsed.copilot) {
    const { raw, sections } = parsed.copilot
    claudeSections.push(buildSection('Migrated from GitHub Copilot', mapInstructions(raw)))
    if (sections.length > 1) {
      output.rules.push({
        name: 'copilot-migrated',
        content: buildRulesFile('Copilot Instructions (migrated)', sections),
      })
    }
  }

  // --- Windsurf ---
  if (parsed.windsurf) {
    const { raw, sections } = parsed.windsurf
    claudeSections.push(buildSection('Migrated from Windsurf (.windsurfrules)', mapInstructions(raw)))
    if (sections.length > 1) {
      output.rules.push({
        name: 'windsurf-migrated',
        content: buildRulesFile('Windsurf Rules (migrated)', sections),
      })
    }
  }

  // --- Cline ---
  if (parsed.cline?.rules) {
    const { raw } = parsed.cline.rules
    claudeSections.push(buildSection('Migrated from Cline (.clinerules)', mapInstructions(raw)))
  }

  if (parsed.cline?.docs) {
    const docsContent = parsed.cline.docs
      .map((doc) => `## ${doc.label}\n\n${doc.raw}`)
      .join('\n\n---\n\n')

    output.rules.push({
      name: 'cline-context',
      content: `# Cline Project Context (migrated)\n\n> Migrated from cline_docs/ by cursor-to-claude.\n\n${docsContent}`,
    })

    // Pull tech context and active context into main CLAUDE.md
    const techDoc = parsed.cline.docs.find((d) => d.name === 'techContext')
    const activeDoc = parsed.cline.docs.find((d) => d.name === 'activeContext')

    if (techDoc) {
      claudeSections.push(buildSection('Tech Stack (from Cline)', techDoc.raw))
    }
    if (activeDoc) {
      claudeSections.push(buildSection('Active Context (from Cline)', activeDoc.raw))
    }
  }

  // --- Build final CLAUDE.md ---
  output.claudeMd = buildClaudeMd(claudeSections, parsed)

  // --- Clean up settings ---
  if (output.settings.ignorePaths.length === 0) {
    delete output.settings.ignorePaths
  }

  return output
}

// ---- Helpers ----

/**
 * Apply concept-level mappings to raw instruction text.
 * Transforms tool-specific patterns into Claude Code idioms.
 */
function mapInstructions(raw) {
  // Process line by line so replacements don't bleed into surrounding words
  const lines = raw.split('\n').map((line) => {
    // Strip generic AI filler lines entirely
    if (/^you are (a |an )?(helpful )?(ai |coding )?(assistant|pair programmer)[.!]?\s*$/i.test(line)) {
      return null
    }

    return line
      // "always use typescript" → clear instruction (match full phrase)
      .replace(/\balways use typescript\b\.?/gi, 'Always write TypeScript, never plain JavaScript.')
      // "don't use any" → type safety
      .replace(/\bdon'?t use any\b\.?/gi, "Never use TypeScript's `any` type — use proper types or `unknown`.")
      // "use functional components" → React specific (strip trailing " in React")
      .replace(/\buse functional components\b(?: in react)?\b\.?/gi, 'Prefer React functional components over class components.')
      // "use tailwind" → styling
      .replace(/\buse tailwind\b(?: for styling)?\.?/gi, 'Use Tailwind CSS for styling.')
      // "write tests for all new code" must come before "write tests" (more specific first)
      .replace(/\bwrite tests? for all new code\b\.?/gi, 'Write tests for all new code. Prefer TDD.')
      .replace(/\bwrite tests?\b(?! for all new code)\.?/gi, 'Write tests for all new code. Prefer TDD.')
      // "use conventional commits"
      .replace(/\buse conventional commits?\b\.?/gi, 'Follow Conventional Commits format (feat:, fix:, chore:, etc.).')
  })

  return lines.filter((l) => l !== null).join('\n').trim()
}

function buildSection(title, content) {
  return `## ${title}\n\n${content}`
}

function buildClaudeMd(sections, parsed) {
  const sources = getSourceList(parsed)
  const header = `# CLAUDE.md

> Migrated from ${sources} by [cursor-to-claude](https://github.com/NickCirv/cursor-to-claude).
> Review and customize — this is your project's AI instruction file.

`
  const body = sections.length > 0 ? sections.join('\n\n---\n\n') : '_No instructions were found to migrate._'

  return header + body + '\n'
}

function buildRulesFile(title, sections) {
  const body = sections
    .map((s) => {
      const heading = s.heading ? `## ${s.heading}\n\n` : ''
      return `${heading}${s.text}`
    })
    .join('\n\n')

  return `# ${title}\n\n> Migrated by cursor-to-claude.\n\n${body}\n`
}

function getSourceList(parsed) {
  const sources = []
  if (parsed.cursor?.rules || parsed.cursor?.rulesDir) sources.push('Cursor')
  if (parsed.copilot) sources.push('GitHub Copilot')
  if (parsed.windsurf) sources.push('Windsurf')
  if (parsed.cline?.rules || parsed.cline?.docs) sources.push('Cline')
  return sources.join(', ') || 'unknown source'
}

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}
