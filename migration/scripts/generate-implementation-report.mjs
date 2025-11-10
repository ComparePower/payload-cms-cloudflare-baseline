#!/usr/bin/env node

/**
 * Generate Component Implementation Report
 *
 * Uses the Component Registry to generate a comprehensive markdown report
 * showing implementation status of all MDX components.
 *
 * Output: migration/IMPLEMENTATION-REPORT.md
 *
 * Usage:
 *   pnpm tsx migration/scripts/generate-implementation-report.mjs
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { generateImplementationReport } from '../../scripts/migration/lib/component-registry.ts'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const OUTPUT_PATH = path.join(__dirname, '..', 'IMPLEMENTATION-REPORT.md')

console.log('🔍 Generating Component Implementation Report...\n')

try {
  // Generate the markdown report
  const report = generateImplementationReport()

  // Write to file
  fs.writeFileSync(OUTPUT_PATH, report, 'utf-8')

  console.log('✅ Report generated successfully!')
  console.log(`📄 Output: ${OUTPUT_PATH}`)
  console.log(`📊 Report size: ${(report.length / 1024).toFixed(2)} KB\n`)

  // Show preview of first 10 lines
  const lines = report.split('\n').slice(0, 10)
  console.log('📝 Preview (first 10 lines):')
  console.log('─'.repeat(60))
  console.log(lines.join('\n'))
  console.log('─'.repeat(60))
  console.log(`\n💡 View full report: cat ${OUTPUT_PATH}`)

} catch (error) {
  console.error('❌ Error generating report:', error)
  process.exit(1)
}
