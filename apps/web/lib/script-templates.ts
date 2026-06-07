import type { LanguageDefinition } from '@/lib/languages'
import type { ProjectStack } from '@/lib/project-stack'
import { formatStackContext } from '@/lib/project-stack'

export type ScriptGenerationInput = {
  language: LanguageDefinition
  prompt: string
  stack: ProjectStack
  mode: 'offline' | 'online'
}

export type ScriptGenerationResult = {
  filename: string
  content: string
  notes: string[]
}

export function generateTemplateDraft(input: ScriptGenerationInput): ScriptGenerationResult {
  const stackSummary = formatStackContext(input.stack)

  if (input.language.id === 'bash') {
    return {
      filename: 'helper.sh',
      content: `#!/usr/bin/env bash
set -euo pipefail

# Prompt:
# ${input.prompt}

# Project stack:
# ${stackSummary.split('\n').join('\n# ')}

echo "Starting task..."
`,
      notes: ['Review shell compatibility before running on production systems.'],
    }
  }

  if (input.language.id === 'python') {
    return {
      filename: 'helper.py',
      content: `"""
Prompt: ${input.prompt}

Project stack:
${stackSummary}
"""

def main():
    print("Starting task...")

if __name__ == "__main__":
    main()
`,
      notes: ['Offline mode creates a starter draft, not a validated final script.'],
    }
  }

  if (input.language.id === 'typescript') {
    return {
      filename: 'helper.ts',
      content: `// Prompt: ${input.prompt}
// Stack: ${stackSummary.split('\n').join(' | ')}

async function main() {
  console.log('Starting task...')
}

main()
`,
      notes: ['Run with: npx tsx helper.ts'],
    }
  }

  if (input.language.id === 'powershell') {
    return {
      filename: 'helper.ps1',
      content: `# Prompt: ${input.prompt}
# Stack: ${stackSummary.split('\n').join(' | ')}

Write-Host "Starting task..."
`,
      notes: ['Run with: pwsh helper.ps1'],
    }
  }

  return {
    filename: `generated${input.language.fileExtensions[0] ?? '.txt'}`,
    content: `# Prompt\n# ${input.prompt}\n\n# Stack\n# ${stackSummary}\n`,
    notes: ['No specialized template yet for this language.'],
  }
}
