#!/usr/bin/env node
/**
 * Error-Driven Migration Workflow Walkthrough
 *
 * Interactive demo that walks users through the complete error-driven migration
 * workflow from detecting unhandled components to configuring them in the Admin UI.
 *
 * Usage:
 *   ./scripts/doppler-run.sh dev pnpm tsx migration/scripts/walkthrough-error-driven-migration.mjs
 *
 * Or via npm script:
 *   pnpm run migration:walkthrough
 */

import readline from 'readline'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'

const execAsync = promisify(exec)

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

const question = (query) =>
  new Promise((resolve) => rl.question(query, resolve))

/**
 * Formatting helpers
 */
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function box(message, color = 'blue') {
  const lines = message.split('\n')
  const maxLength = Math.max(...lines.map((l) => l.length))
  const border = '═'.repeat(maxLength + 4)

  log(`\n╔${border}╗`, color)
  lines.forEach((line) => {
    const padding = ' '.repeat(maxLength - line.length)
    log(`║  ${line}${padding}  ║`, color)
  })
  log(`╚${border}╝\n`, color)
}

async function pause(message = '\nPress Enter to continue...') {
  await question(colors.cyan + message + colors.reset)
}

/**
 * Clear screen (cross-platform)
 */
function clearScreen() {
  console.clear()
}

/**
 * Step 1: Introduction
 */
async function step1_introduction() {
  clearScreen()
  box(
    '🚀 Error-Driven Migration Workflow Walkthrough\n\n' +
      'This interactive demo will walk you through the complete\n' +
      'error-driven migration workflow for MDX to Payload CMS.\n\n' +
      'You will learn:\n' +
      '  • How migrations detect unhandled components\n' +
      '  • How TODO files are auto-generated\n' +
      '  • How to configure components in the Admin UI\n' +
      '  • How to unblock and complete migrations',
    'green'
  )

  log('\n📋 Prerequisites:', 'bright')
  log('  ✓ Doppler CLI configured and authenticated')
  log('  ✓ MongoDB Atlas connection available')
  log('  ✓ Payload dev server running on port 3003')
  log('  ✓ Source MDX files in Astro project\n')

  await pause()
}

/**
 * Step 2: Explain the workflow
 */
async function step2_explainWorkflow() {
  clearScreen()
  box(
    '📊 Error-Driven Migration Workflow\n\n' +
      'Phase 1: Pre-flight Validation\n' +
      '  → Parse all MDX files with collectUnhandled=true\n' +
      '  → Detect unhandled components (not in registry)\n' +
      '  → Aggregate usage counts across all files\n\n' +
      'Phase 2: Blocking Error\n' +
      '  → Migration FAILS immediately (exit code 1)\n' +
      "  → Auto-generates TODO file with components\n" +
      '  → Auto-merges components into registry with isBlocking=true\n' +
      '  → Displays error message with Admin UI link\n\n' +
      'Phase 3: Admin UI Configuration\n' +
      '  → User opens Admin UI at localhost:3003\n' +
      '  → Blocking banner appears with component list\n' +
      '  → User configures each component\n' +
      '  → Save clears isBlocking flags\n\n' +
      'Phase 4: Re-run Migration\n' +
      '  → Run migration again\n' +
      '  → Pre-flight validation passes\n' +
      '  → Migration succeeds ✅',
    'cyan'
  )

  await pause()
}

/**
 * Step 3: Simulate running migration with unhandled components
 */
async function step3_runMigrationWithError() {
  clearScreen()
  box(
    '🔬 DEMO: Running Migration (will fail)\n\n' +
      'We will now simulate running the migration script\n' +
      'with unhandled components detected.',
    'yellow'
  )

  log('\n💡 Command:', 'bright')
  log(
    '  ./scripts/doppler-run.sh dev pnpm tsx migration/scripts/seed-with-payload-api.mjs\n',
    'cyan'
  )

  log('📝 What happens:', 'bright')
  log('  1. Script loads seed data (providers.json)')
  log('  2. Pre-flight validation parses all MDX content')
  log('  3. Detects 2 unhandled components: TestComponent, AnotherTest')
  log('  4. Aggregates usage counts')
  log('  5. Marks migration as blocked')
  log('  6. Auto-generates TODO file')
  log('  7. Auto-merges into registry with isBlocking=true')
  log('  8. Displays blocking error message')
  log('  9. Exits with code 1 ❌\n')

  await pause()

  // Simulate the error output
  clearScreen()
  log('\n🌱 Starting Database Seeding (Payload API)...\n', 'green')
  log('📂 Loading seed data...')
  log('   ✓ Loaded 157 providers\n')
  log('🔍 Pre-flight validation: Checking for unhandled components...\n', 'yellow')

  // Simulate parsing progress
  for (let i = 0; i < 5; i++) {
    await new Promise((resolve) => setTimeout(resolve, 300))
    log(`   Parsing provider ${i + 1}/157...`, 'cyan')
  }

  log('\n')

  // Display the blocking error
  log(
    '╔════════════════════════════════════════════════════════════════╗',
    'red'
  )
  log(
    '║                                                                ║',
    'red'
  )
  log(
    '║   ❌  MIGRATION FAILED: 2 unhandled components detected       ║',
    'red'
  )
  log(
    '║                                                                ║',
    'red'
  )
  log(
    '╚════════════════════════════════════════════════════════════════╝\n',
    'red'
  )

  log('The following components must be configured before migration can proceed:\n')
  log('  - TestComponent (15 uses, block)', 'red')
  log('  - AnotherTest (8 uses, inline)', 'red')
  log('')
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  log('\n📋 Next Steps:\n')
  log('1. Open: http://localhost:3003/admin/component-registry?filter=blocking', 'cyan')
  log('2. Configure required fields for each component:')
  log('   - Set componentType (\'block\', \'inline\', \'both\')')
  log('   - Set canRenderBlock and canRenderInline flags')
  log('   - Implement Payload block type if needed')
  log('   - Update status to \'implemented\' when complete')
  log('3. Save changes in Admin UI')
  log('4. Re-run this migration script\n')
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  log('✨ Auto-Actions Completed:\n', 'green')
  log('  ✓ Generated TODO file: migration/COMPONENT-REGISTRATION-TODO.ts')
  log('  ✓ Updated component registry with unhandled components')
  log('  ✓ Marked components as isBlocking: true')
  log('  ✓ Updated migration status file\n')
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  await pause()
}

/**
 * Step 4: Show auto-generated TODO file
 */
async function step4_showTodoFile() {
  clearScreen()
  box(
    '📄 Auto-Generated TODO File\n\n' +
      'The migration script automatically created a TODO file\n' +
      'with all unhandled components for easy review.',
    'green'
  )

  log('\n📁 File: migration/COMPONENT-REGISTRATION-TODO.ts\n', 'bright')
  log('```typescript')
  log('/**')
  log(' * Unregistered Components - Auto-generated')
  log(' * Generated: 2025-10-27T10:30:00.000Z')
  log(' * Components: 2')
  log(' */')
  log('')
  log('export const UNREGISTERED_COMPONENTS: Record<string, ComponentMapping> = {')
  log("  'TestComponent': {")
  log("    status: 'needs-work' as const,")
  log("    componentType: 'block' as const,")
  log('    canRenderBlock: true,')
  log('    canRenderInline: false,')
  log('    payloadBlockType: undefined,')
  log('    mdxUsageCount: 15,')
  log('    fields: {},')
  log('    todos: [')
  log("      'Configure component type',")
  log("      'Set rendering capabilities',")
  log("      'Implement Payload block',")
  log("      'Test with sample MDX'")
  log('    ],')
  log('    isBlocking: true,')
  log('  },')
  log('')
  log("  'AnotherTest': {")
  log("    status: 'needs-work' as const,")
  log("    componentType: 'inline' as const,")
  log('    canRenderBlock: false,')
  log('    canRenderInline: true,')
  log('    payloadBlockType: undefined,')
  log('    mdxUsageCount: 8,')
  log('    fields: {},')
  log('    todos: [')
  log("      'Configure component type',")
  log("      'Set rendering capabilities',")
  log("      'Implement Payload inline block',")
  log("      'Test with sample MDX'")
  log('    ],')
  log('    isBlocking: true,')
  log('  },')
  log('}')
  log('```\n')

  log('💡 These components were also merged into src/lib/component-registry.ts', 'cyan')

  await pause()
}

/**
 * Step 5: Guide user to Admin UI
 */
async function step5_openAdminUI() {
  clearScreen()
  box(
    '🌐 Open Admin UI\n\n' +
      'Now let\'s configure the components in the Admin UI.\n' +
      'The UI will show a blocking banner and filter.',
    'blue'
  )

  log('\n📍 URL: http://localhost:3003/admin/component-registry?filter=blocking\n', 'cyan')

  log('🎨 What you\'ll see:', 'bright')
  log('  1. Blocking migration banner at the top (pulsing red)')
  log('  2. "Migration Blocked: 2 components need configuration"')
  log('  3. List of blocking components')
  log('  4. Components highlighted with red border and animation')
  log('  5. Filter dropdown already set to "🚨 Blocking Migration"\n')

  log('👉 Next actions in Admin UI:', 'bright')
  log('  1. Click on TestComponent to expand')
  log('  2. Verify componentType = "block"')
  log('  3. Verify canRenderBlock = true')
  log('  4. Set Payload Block Type (e.g., "TestComponentBlock")')
  log('  5. Change status to "implemented"')
  log('  6. Repeat for AnotherTest')
  log('  7. Click "💾 Save Registry"\n')

  log('⚠️  Note: In this demo, we\'ll simulate these actions.\n', 'yellow')
  log('         In real usage, you would do this in the browser.\n')

  await pause()
}

/**
 * Step 6: Simulate saving in Admin UI
 */
async function step6_simulateSave() {
  clearScreen()
  box(
    '💾 Saving Component Registry\n\n' +
      'User has configured both components and clicked Save.',
    'green'
  )

  log('\n📝 What happens on save:\n', 'bright')
  log('  1. Validate all components (check required fields)')
  log('  2. Clear isBlocking flag for components with status="implemented"')
  log('  3. POST to /api/component-registry with updated data')
  log('  4. POST to /api/migration-status to clear blocking status')
  log('  5. Reload migration status')
  log('  6. Display success message: "✅ Component Registry saved successfully! (2 components unblocked)"\n')

  await pause()

  // Simulate the save actions
  log('\n💫 Simulating save actions...\n', 'cyan')

  await new Promise((resolve) => setTimeout(resolve, 500))
  log('  ✓ Validating components...', 'green')

  await new Promise((resolve) => setTimeout(resolve, 500))
  log('  ✓ Clearing isBlocking flags...', 'green')

  await new Promise((resolve) => setTimeout(resolve, 500))
  log('  ✓ Saving to registry file...', 'green')

  await new Promise((resolve) => setTimeout(resolve, 500))
  log('  ✓ Updating migration status...', 'green')

  await new Promise((resolve) => setTimeout(resolve, 500))
  log('  ✓ Reloading status...', 'green')

  log('\n✅ Component Registry saved successfully! (2 components unblocked)\n', 'bright')

  await pause()
}

/**
 * Step 7: Re-run migration successfully
 */
async function step7_rerunMigration() {
  clearScreen()
  box(
    '🔄 Re-running Migration\n\n' +
      'Now that components are configured, let\'s run the migration again.',
    'blue'
  )

  log('\n💡 Command:', 'bright')
  log(
    '  ./scripts/doppler-run.sh dev pnpm tsx migration/scripts/seed-with-payload-api.mjs\n',
    'cyan'
  )

  log('📝 What happens this time:', 'bright')
  log('  1. Script loads seed data (providers.json)')
  log('  2. Pre-flight validation parses all MDX content')
  log('  3. All components are now in registry')
  log('  4. Validation passes ✅')
  log('  5. Migration continues to database seeding')
  log('  6. Providers are created successfully')
  log('  7. Migration completes with exit code 0 ✅\n')

  await pause()

  // Simulate successful migration
  clearScreen()
  log('\n🌱 Starting Database Seeding (Payload API)...\n', 'green')
  log('📂 Loading seed data...')
  log('   ✓ Loaded 157 providers\n')
  log('🔍 Pre-flight validation: Checking for unhandled components...\n', 'yellow')

  await new Promise((resolve) => setTimeout(resolve, 1000))
  log('   ✓ No unhandled components detected\n', 'green')

  log('🔌 Initializing Payload...')
  await new Promise((resolve) => setTimeout(resolve, 500))
  log('   ✓ Payload initialized\n')

  log('🗑️  Purging existing providers...')
  await new Promise((resolve) => setTimeout(resolve, 300))
  log('   ✓ Deleted 0 providers\n')

  log('📥 Seeding 157 providers...\n', 'cyan')

  for (let i = 0; i < 5; i++) {
    await new Promise((resolve) => setTimeout(resolve, 200))
    log(`   [${i + 1}/157] ✓ Created: Provider ${i + 1}`, 'green')
  }

  log('   ... (152 more)\n')

  log('\n✅ Seeding complete!\n', 'bright')

  log('🔍 Verifying...')
  log('   Total providers in database: 157')
  log('   Expected: 157')
  log('   ✅ Verification passed!\n', 'green')

  log('📊 Summary:')
  log('   Total: 157')
  log('   Created: 157')
  log('   Failed: 0\n')

  log('✅ Done!\n', 'bright')

  await pause()
}

/**
 * Step 8: Summary and conclusion
 */
async function step8_summary() {
  clearScreen()
  box(
    '🎉 Walkthrough Complete!\n\n' +
      'You have successfully learned the error-driven\n' +
      'migration workflow from start to finish.',
    'green'
  )

  log('\n📚 Key Takeaways:\n', 'bright')
  log('  ✅ Migrations fail immediately on unhandled components')
  log('  ✅ TODO files are auto-generated for easy review')
  log('  ✅ Components are auto-merged into registry with isBlocking=true')
  log('  ✅ Admin UI provides guided configuration interface')
  log('  ✅ Blocking banner and filters help focus on what needs attention')
  log('  ✅ Saving clears isBlocking and updates migration status')
  log('  ✅ Re-running migration succeeds after configuration\n')

  log('🔗 Useful Commands:\n', 'bright')
  log('  # Run migration')
  log('  ./scripts/doppler-run.sh dev pnpm tsx migration/scripts/seed-with-payload-api.mjs\n', 'cyan')
  log('  # Run this walkthrough')
  log('  pnpm run migration:walkthrough\n', 'cyan')
  log('  # Open Admin UI')
  log('  open http://localhost:3003/admin/component-registry\n', 'cyan')

  log('📖 Documentation:\n', 'bright')
  log('  • GitHub Issue: specs/001-keystatic-to-payload-migration/ERROR_DRIVEN_MIGRATION_EPIC.md')
  log('  • Implementation Guide: CLAUDE.MD\n')

  log('\n💡 Ready to run a real migration? Follow the same steps!\n', 'yellow')

  await pause('\nPress Enter to exit...')
}

/**
 * Main walkthrough flow
 */
async function main() {
  try {
    await step1_introduction()
    await step2_explainWorkflow()
    await step3_runMigrationWithError()
    await step4_showTodoFile()
    await step5_openAdminUI()
    await step6_simulateSave()
    await step7_rerunMigration()
    await step8_summary()

    rl.close()
    process.exit(0)
  } catch (error) {
    console.error('\n❌ Walkthrough error:', error.message)
    rl.close()
    process.exit(1)
  }
}

// Run the walkthrough
main()
