/**
 * Scan MDX files for inline components
 *
 * This script checks if we have any mdxJsxTextElement nodes in our MDX files
 * (components used inline within text, not on their own line)
 */

import { promises as fs } from 'fs'
import path from 'path'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkMdx from 'remark-mdx'
import { visit } from 'unist-util-visit'

const MDX_DIR = '/Users/brad/_CODE_DEV_PROJECTS/cp-content-site-astro/src/data'

interface ComponentUsage {
  file: string
  component: string
  type: 'block' | 'inline'
  line?: number
}

async function scanFile(filePath: string): Promise<ComponentUsage[]> {
  const usages: ComponentUsage[] = []

  try {
    const content = await fs.readFile(filePath, 'utf-8')

    // Parse MDX
    const parser = unified().use(remarkParse).use(remarkMdx)
    const tree = parser.parse(content)

    // Find all JSX components
    visit(tree, (node: any) => {
      if (node.type === 'mdxJsxFlowElement') {
        usages.push({
          file: filePath,
          component: node.name,
          type: 'block',
          line: node.position?.start?.line,
        })
      } else if (node.type === 'mdxJsxTextElement') {
        usages.push({
          file: filePath,
          component: node.name,
          type: 'inline',
          line: node.position?.start?.line,
        })
      }
    })
  } catch (error) {
    console.error(`Error scanning ${filePath}:`, error)
  }

  return usages
}

async function scanDirectory(dir: string): Promise<ComponentUsage[]> {
  const allUsages: ComponentUsage[] = []

  async function walk(currentPath: string) {
    const entries = await fs.readdir(currentPath, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name)

      if (entry.isDirectory()) {
        await walk(fullPath)
      } else if (entry.name.endsWith('.mdx')) {
        const usages = await scanFile(fullPath)
        allUsages.push(...usages)
      }
    }
  }

  await walk(dir)
  return allUsages
}

async function main() {
  console.log('🔍 Scanning MDX files for inline vs block components...\n')

  const usages = await scanDirectory(MDX_DIR)

  // Group by type
  const blockComponents = usages.filter(u => u.type === 'block')
  const inlineComponents = usages.filter(u => u.type === 'inline')

  console.log(`📊 Results:`)
  console.log(`  Total components found: ${usages.length}`)
  console.log(`  Block components (mdxJsxFlowElement): ${blockComponents.length}`)
  console.log(`  Inline components (mdxJsxTextElement): ${inlineComponents.length}\n`)

  if (inlineComponents.length > 0) {
    console.log('⚠️  Found inline components:')

    // Group by component name
    const inlineByName = inlineComponents.reduce((acc, usage) => {
      if (!acc[usage.component]) {
        acc[usage.component] = []
      }
      acc[usage.component].push(usage)
      return acc
    }, {} as Record<string, ComponentUsage[]>)

    for (const [componentName, instances] of Object.entries(inlineByName)) {
      console.log(`\n  <${componentName}> - ${instances.length} instances:`)
      instances.slice(0, 5).forEach(usage => {
        const relativePath = usage.file.replace(MDX_DIR, '')
        console.log(`    - ${relativePath}:${usage.line}`)
      })
      if (instances.length > 5) {
        console.log(`    ... and ${instances.length - 5} more`)
      }
    }
  } else {
    console.log('✅ No inline components found!')
    console.log('   All components are block-level (on their own line)')
  }

  // Show unique block component names
  const uniqueBlockComponents = [...new Set(blockComponents.map(u => u.component))]
  console.log(`\n📦 Unique block components (${uniqueBlockComponents.length}):`)
  uniqueBlockComponents.sort().forEach(name => {
    const count = blockComponents.filter(u => u.component === name).length
    console.log(`  - ${name} (${count} instances)`)
  })
}

main().catch(console.error)
