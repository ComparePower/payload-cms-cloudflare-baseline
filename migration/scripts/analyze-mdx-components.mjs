#!/usr/bin/env node

/**
 * Analyze MDX Component Usage
 *
 * Scans all MDX files in the Astro content directory and generates a
 * comprehensive report of component usage, cross-referenced with the
 * Component Registry to show implementation status.
 *
 * Output: Console report + optional JSON file
 *
 * Usage:
 *   node migration/scripts/analyze-mdx-components.mjs [--json output.json]
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import matter from 'gray-matter'
import { COMPONENT_REGISTRY } from '../../scripts/migration/lib/component-registry.ts'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Source content directory
const ASTRO_CONTENT_DIR = '/Users/brad/_CODE_DEV_PROJECTS/cp-content-site-astro/src/content'

/**
 * Recursively find all MDX files in a directory
 */
function findMDXFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir)

  for (const file of files) {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)

    if (stat.isDirectory()) {
      findMDXFiles(filePath, fileList)
    } else if (file.endsWith('.mdx')) {
      fileList.push(filePath)
    }
  }

  return fileList
}

// Component usage tracking
const componentUsage = new Map() // componentName -> { count, files: Set, props: Map }

/**
 * Extract JSX components from MDX content
 */
function extractComponents(content, filePath) {
  // Match JSX self-closing tags: <ComponentName prop="value" />
  const selfClosingRegex = /<([A-Z][A-Za-z0-9_]*)\s*([^>]*?)\/>/g

  // Match JSX opening/closing tags: <ComponentName>...</ComponentName>
  const openCloseRegex = /<([A-Z][A-Za-z0-9_]*)\s*([^>]*?)>/g

  const components = new Set()

  // Extract self-closing components
  let match
  while ((match = selfClosingRegex.exec(content)) !== null) {
    const componentName = match[1]
    const propsString = match[2].trim()

    components.add(componentName)
    trackComponentUsage(componentName, filePath, propsString)
  }

  // Extract opening tag components (may have closing tags)
  while ((match = openCloseRegex.exec(content)) !== null) {
    const componentName = match[1]
    const propsString = match[2].trim()

    components.add(componentName)
    trackComponentUsage(componentName, filePath, propsString)
  }

  return components
}

/**
 * Track component usage statistics
 */
function trackComponentUsage(componentName, filePath, propsString) {
  if (!componentUsage.has(componentName)) {
    componentUsage.set(componentName, {
      count: 0,
      files: new Set(),
      props: new Map(), // propName -> count
    })
  }

  const usage = componentUsage.get(componentName)
  usage.count++
  usage.files.add(filePath)

  // Extract prop names from props string
  if (propsString) {
    const propRegex = /(\w+)=/g
    let propMatch
    while ((propMatch = propRegex.exec(propsString)) !== null) {
      const propName = propMatch[1]
      usage.props.set(propName, (usage.props.get(propName) || 0) + 1)
    }
  }
}

/**
 * Scan MDX files and extract component usage
 */
function scanMDXFiles() {
  console.log('🔍 Scanning MDX files for component usage...\n')

  // Find all MDX files recursively
  const mdxFiles = findMDXFiles(ASTRO_CONTENT_DIR)

  console.log(`Found ${mdxFiles.length} MDX files\n`)

  let processedCount = 0
  let errorCount = 0

  for (const filePath of mdxFiles) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8')
      const { content: mdxContent } = matter(content)

      // Extract components from MDX content
      extractComponents(mdxContent, filePath)

      processedCount++

      // Progress indicator every 100 files
      if (processedCount % 100 === 0) {
        console.log(`Processed ${processedCount}/${mdxFiles.length} files...`)
      }
    } catch (error) {
      errorCount++
      console.error(`Error processing ${filePath}:`, error.message)
    }
  }

  console.log(`\n✅ Processed ${processedCount} files`)
  if (errorCount > 0) {
    console.log(`⚠️  ${errorCount} files had errors`)
  }

  return { processedCount, errorCount, totalFiles: mdxFiles.length }
}

/**
 * Generate component usage report
 */
function generateReport() {
  console.log('\n' + '='.repeat(80))
  console.log('MDX COMPONENT USAGE REPORT')
  console.log('='.repeat(80))

  // Get all unique components sorted by usage count (descending)
  const sortedComponents = Array.from(componentUsage.entries())
    .sort((a, b) => b[1].count - a[1].count)

  console.log(`\nTotal Unique Components: ${sortedComponents.length}`)

  // Categorize components by registry status
  const implemented = []
  const needsWork = []
  const placeholder = []
  const unregistered = []

  for (const [componentName, usage] of sortedComponents) {
    const mapping = COMPONENT_REGISTRY[componentName]

    if (!mapping) {
      unregistered.push({ componentName, usage })
    } else if (mapping.status === 'implemented') {
      implemented.push({ componentName, usage, mapping })
    } else if (mapping.status === 'needs-work') {
      needsWork.push({ componentName, usage, mapping })
    } else if (mapping.status === 'placeholder') {
      placeholder.push({ componentName, usage, mapping })
    }
  }

  console.log(`\n📊 Implementation Status:`)
  console.log(`  ✅ Implemented: ${implemented.length}`)
  console.log(`  🚧 Needs Work: ${needsWork.length}`)
  console.log(`  📝 Placeholder: ${placeholder.length}`)
  console.log(`  ❌ Unregistered: ${unregistered.length}`)

  // High-usage components (>100 uses)
  console.log('\n' + '─'.repeat(80))
  console.log('HIGH-USAGE COMPONENTS (>100 uses)')
  console.log('─'.repeat(80))

  const highUsage = sortedComponents.filter(([_, usage]) => usage.count > 100)

  if (highUsage.length === 0) {
    console.log('No components used more than 100 times')
  } else {
    for (const [componentName, usage] of highUsage) {
      const mapping = COMPONENT_REGISTRY[componentName]
      const status = mapping
        ? `${mapping.status} (${mapping.componentType})`
        : '❌ UNREGISTERED'

      console.log(`\n${componentName}: ${usage.count} uses`)
      console.log(`  Status: ${status}`)
      console.log(`  Files: ${usage.files.size}`)

      if (usage.props.size > 0) {
        const propsStr = Array.from(usage.props.entries())
          .sort((a, b) => b[1] - a[1])
          .map(([prop, count]) => `${prop}(${count})`)
          .join(', ')
        console.log(`  Props: ${propsStr}`)
      }

      if (mapping && mapping.todos && mapping.todos.length > 0) {
        console.log(`  TODOs: ${mapping.todos.join(', ')}`)
      }
    }
  }

  // Unregistered components
  if (unregistered.length > 0) {
    console.log('\n' + '─'.repeat(80))
    console.log('❌ UNREGISTERED COMPONENTS (NOT IN REGISTRY)')
    console.log('─'.repeat(80))
    console.log('These components MUST be added to Component Registry before migration\n')

    for (const { componentName, usage } of unregistered) {
      console.log(`${componentName}: ${usage.count} uses in ${usage.files.size} files`)

      if (usage.props.size > 0) {
        const propsStr = Array.from(usage.props.entries())
          .sort((a, b) => b[1] - a[1])
          .map(([prop, count]) => `${prop}(${count})`)
          .join(', ')
        console.log(`  Props: ${propsStr}`)
      }

      // Show sample file
      const sampleFile = Array.from(usage.files)[0]
      const relativePath = path.relative(ASTRO_CONTENT_DIR, sampleFile)
      console.log(`  Example: ${relativePath}`)
      console.log()
    }
  }

  // Needs Work components
  if (needsWork.length > 0) {
    console.log('\n' + '─'.repeat(80))
    console.log('🚧 NEEDS WORK (REGISTERED BUT INCOMPLETE)')
    console.log('─'.repeat(80))

    for (const { componentName, usage, mapping } of needsWork) {
      console.log(`\n${componentName}: ${usage.count} uses in ${usage.files.size} files`)
      console.log(`  Type: ${mapping.componentType}`)

      if (mapping.todos && mapping.todos.length > 0) {
        console.log(`  TODOs:`)
        for (const todo of mapping.todos) {
          console.log(`    - ${todo}`)
        }
      }
    }
  }

  // Summary
  console.log('\n' + '='.repeat(80))
  console.log('SUMMARY')
  console.log('='.repeat(80))

  const totalUsages = sortedComponents.reduce((sum, [_, usage]) => sum + usage.count, 0)

  console.log(`\nTotal Component Usages: ${totalUsages}`)
  console.log(`Total Unique Components: ${sortedComponents.length}`)
  console.log(`\nRegistry Coverage: ${implemented.length + needsWork.length + placeholder.length}/${sortedComponents.length} (${Math.round((implemented.length + needsWork.length + placeholder.length) / sortedComponents.length * 100)}%)`)

  if (unregistered.length === 0 && needsWork.length === 0) {
    console.log('\n✅ All components are registered and implemented!')
    console.log('Migration can proceed safely.')
  } else {
    console.log('\n⚠️  Action Required:')
    if (unregistered.length > 0) {
      console.log(`  - Add ${unregistered.length} unregistered components to Component Registry`)
    }
    if (needsWork.length > 0) {
      console.log(`  - Complete ${needsWork.length} components marked as "needs-work"`)
    }
  }

  console.log()

  return {
    totalUsages,
    totalComponents: sortedComponents.length,
    implemented: implemented.length,
    needsWork: needsWork.length,
    placeholder: placeholder.length,
    unregistered: unregistered.length,
    components: Object.fromEntries(
      sortedComponents.map(([name, usage]) => [
        name,
        {
          count: usage.count,
          fileCount: usage.files.size,
          props: Object.fromEntries(usage.props),
          status: COMPONENT_REGISTRY[name]?.status || 'unregistered',
          type: COMPONENT_REGISTRY[name]?.componentType || null,
        },
      ])
    ),
  }
}

/**
 * Main execution
 */
function main() {
  const args = process.argv.slice(2)
  const jsonOutputIndex = args.indexOf('--json')
  const jsonOutputPath = jsonOutputIndex !== -1 ? args[jsonOutputIndex + 1] : null

  console.log('MDX Component Usage Analyzer')
  console.log('Source:', ASTRO_CONTENT_DIR)
  console.log()

  // Check if source directory exists
  if (!fs.existsSync(ASTRO_CONTENT_DIR)) {
    console.error(`❌ Source directory not found: ${ASTRO_CONTENT_DIR}`)
    console.error('Please verify the Astro project path in CLAUDE.MD')
    process.exit(1)
  }

  // Scan all MDX files
  const scanResults = scanMDXFiles()

  // Generate report
  const reportData = generateReport()

  // Save JSON output if requested
  if (jsonOutputPath) {
    const outputPath = path.resolve(jsonOutputPath)
    fs.writeFileSync(
      outputPath,
      JSON.stringify({ scanResults, ...reportData }, null, 2),
      'utf-8'
    )
    console.log(`\n📄 JSON report saved to: ${outputPath}`)
  }
}

try {
  main()
} catch (error) {
  console.error('❌ Error:', error)
  process.exit(1)
}
