#!/usr/bin/env node
/**
 * Interactive Migration Wizard
 *
 * Full interactive workflow for migrating content from Astro/Keystatic to Payload CMS.
 * Asks all questions upfront, validates configuration, and executes migration.
 *
 * Run: ./scripts/doppler-run.sh dev pnpm tsx migration/scripts/interactive-migration-wizard.mjs
 */

import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { exec } from 'child_process'
import { promisify } from 'util'
import inquirer from 'inquirer'
import chalk from 'chalk'
import { runValidationLoop } from './lib/validation-loop.mjs'
import { interactiveFieldMapper } from './lib/inquirer-field-mapper.mjs'
import { interactiveComponentMapper } from './lib/inquirer-component-mapper.mjs'

const execAsync = promisify(exec)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Source directories
const ASTRO_BASE_DIR = '/Users/brad/_CODE_DEV_PROJECTS/cp-content-site-astro/src/content/front-end'
const COLLECTIONS = {
  providers: {
    name: 'Providers',
    dir: path.join(ASTRO_BASE_DIR, 'providers'),
    script: 'migration/scripts/seed-with-payload-api.mjs',
    description: 'Energy provider company pages',
  },
  'electricity-rates': {
    name: 'Electricity Rates',
    dir: path.join(ASTRO_BASE_DIR, 'electricity-rates'),
    script: 'migration/scripts/seed-electricity-rates-with-payload-api.mjs',
    description: 'City-specific electricity rate pages',
  },
}

/**
 * Count MDX files in a directory
 */
async function countMDXFiles(dir) {
  try {
    const { stdout } = await execAsync(`find "${dir}" -name "*.mdx" -type f | wc -l`)
    return parseInt(stdout.trim(), 10)
  } catch (error) {
    return 0
  }
}

/**
 * Get MDX files sorted alphabetically (for suggestions)
 */
async function getRecentMDXFiles(dir, limit = 10) {
  try {
    const { stdout } = await execAsync(
      `find "${dir}" -name "*.mdx" -type f`
    )

    const files = stdout
      .trim()
      .split('\n')
      .filter(line => line.trim())
      .map((filePath) => {
        const relativePath = path.relative(dir, filePath)
        const slug = relativePath.replace(/\/index\.mdx$/, '').replace(/\.mdx$/, '').replace(/\//g, '-')
        return { slug, path: relativePath }
      })
      // Sort alphabetically by slug
      .sort((a, b) => a.slug.localeCompare(b.slug))
      // Take first N results
      .slice(0, limit)

    return files
  } catch (error) {
    return []
  }
}

/**
 * Find all MDX files based on user selections
 * Returns array of absolute file paths
 */
async function findAllMDXFiles(collectionDir, slugFilter = null, limitCount = null) {
  try {
    const { stdout } = await execAsync(`find "${collectionDir}" -name "*.mdx" -type f`)

    let files = stdout
      .trim()
      .split('\n')
      .filter(line => line.trim())

    // Filter by slug if requested
    if (slugFilter) {
      files = files.filter(f => {
        const relativePath = path.relative(collectionDir, f)
        const slug = relativePath.replace(/\/index\.mdx$/, '').replace(/\.mdx$/, '').replace(/\//g, '-')
        return slug === slugFilter || f.includes(slugFilter)
      })
    }

    // Limit if requested
    if (limitCount) {
      files = files.slice(0, limitCount)
    }

    return files
  } catch (error) {
    console.error(chalk.red(`Error finding MDX files: ${error.message}`))
    return []
  }
}

/**
 * Welcome screen
 */
function displayWelcome() {
  console.clear()
  console.log(chalk.cyan.bold('\n╔════════════════════════════════════════════════════════════════╗'))
  console.log(chalk.cyan.bold('║                                                                ║'))
  console.log(chalk.cyan.bold('║           🚀 Interactive Migration Wizard                      ║'))
  console.log(chalk.cyan.bold('║                                                                ║'))
  console.log(chalk.cyan.bold('║           Keystatic → Payload CMS                              ║'))
  console.log(chalk.cyan.bold('║                                                                ║'))
  console.log(chalk.cyan.bold('╚════════════════════════════════════════════════════════════════╝\n'))

  console.log(chalk.gray('This wizard will guide you through migrating content from Astro/Keystatic'))
  console.log(chalk.gray('to Payload CMS with interactive prompts and validation.\n'))
}

/**
 * Main wizard flow
 */
async function runWizard() {
  displayWelcome()

  // ============================================================================
  // PHASE 1: Collection Selection
  // ============================================================================

  console.log(chalk.cyan.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'))
  console.log(chalk.cyan.bold('  📚 Step 1: Select Collection'))
  console.log(chalk.cyan.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'))

  // Count files in each collection
  const providerCount = await countMDXFiles(COLLECTIONS.providers.dir)
  const ratesCount = await countMDXFiles(COLLECTIONS['electricity-rates'].dir)

  const collectionResponse = await inquirer.prompt([{
    type: 'list',
    name: 'collection',
    message: 'Which collection would you like to migrate?',
    choices: [
      {
        name: `Providers (${providerCount} files) - ${COLLECTIONS.providers.description}`,
        value: 'providers',
      },
      {
        name: `Electricity Rates (${ratesCount} files) - ${COLLECTIONS['electricity-rates'].description}`,
        value: 'electricity-rates',
      },
    ],
    default: 0,
  }])

  if (!collectionResponse.collection) {
    console.log(chalk.red('\n✖ Migration cancelled.\n'))
    process.exit(0)
  }

  const selectedCollection = COLLECTIONS[collectionResponse.collection]
  const totalFiles = collectionResponse.collection === 'providers' ? providerCount : ratesCount

  // ============================================================================
  // PHASE 2: Scope Selection
  // ============================================================================

  console.log(chalk.cyan.bold('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'))
  console.log(chalk.cyan.bold('  🎯 Step 2: Import Scope'))
  console.log(chalk.cyan.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'))

  const scopeResponse = await inquirer.prompt([{
    type: 'list',
    name: 'scope',
    message: 'What scope would you like to migrate?',
    choices: [
      {
        name: `All files (${totalFiles} files) - Migrate all content from this collection`,
        value: 'all',
      },
      {
        name: 'Single file (test with one) - Migrate a single file for testing',
        value: 'single',
      },
      {
        name: 'Limited batch - Migrate a specific number of files',
        value: 'limit',
      },
    ],
    default: 0,
  }])

  if (!scopeResponse.scope) {
    console.log(chalk.red('\n✖ Migration cancelled.\n'))
    process.exit(0)
  }

  let slugFilter = undefined
  let limitCount = undefined

  // Handle single file selection
  if (scopeResponse.scope === 'single') {
    const slugResponse = await inquirer.prompt([{
      type: 'input',
      name: 'slug',
      message: 'Enter slug or path (or leave empty for suggestions):',
      default: '',
    }])

    if (slugResponse.slug === '') {
      // Show suggestions
      console.log(chalk.gray('\n🔍 Fetching files (alphabetically sorted)...\n'))
      const recentFiles = await getRecentMDXFiles(selectedCollection.dir)

      if (recentFiles.length === 0) {
        console.log(chalk.red('No MDX files found in this collection.\n'))
        process.exit(1)
      }

      const suggestionResponse = await inquirer.prompt([{
        type: 'list',
        name: 'suggestion',
        message: 'Select a file:',
        choices: recentFiles.map((file, i) => ({
          name: file.slug,
          value: file.slug,
        })),
      }])

      if (!suggestionResponse.suggestion) {
        console.log(chalk.red('\n✖ Migration cancelled.\n'))
        process.exit(0)
      }

      slugFilter = suggestionResponse.suggestion
    } else {
      slugFilter = slugResponse.slug
    }
  }

  // Handle limited batch
  if (scopeResponse.scope === 'limit') {
    const limitResponse = await inquirer.prompt([{
      type: 'number',
      name: 'limit',
      message: 'How many files would you like to migrate?',
      default: 10,
      min: 1,
      max: totalFiles,
    }])

    if (!limitResponse.limit) {
      console.log(chalk.red('\n✖ Migration cancelled.\n'))
      process.exit(0)
    }

    limitCount = limitResponse.limit
  }

  // ============================================================================
  // PHASE 3: Purge Options
  // ============================================================================

  console.log(chalk.cyan.bold('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'))
  console.log(chalk.cyan.bold('  🗑️  Step 3: Data Purge'))
  console.log(chalk.cyan.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'))

  console.log(chalk.gray('Purging removes all existing records before migration.'))
  console.log(chalk.gray('This ensures a clean slate and prevents duplicates.\n'))

  const purgeResponse = await inquirer.prompt([{
    type: 'confirm',
    name: 'purge',
    message: 'Purge existing data before migration? (Recommended)',
    default: true,
  }])

  if (purgeResponse.purge === undefined) {
    console.log(chalk.red('\n✖ Migration cancelled.\n'))
    process.exit(0)
  }

  // ============================================================================
  // PHASE 4: Validation Mode
  // ============================================================================

  console.log(chalk.cyan.bold('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'))
  console.log(chalk.cyan.bold('  ✅ Step 4: Validation'))
  console.log(chalk.cyan.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'))

  console.log(chalk.gray('Validation checks for unmapped frontmatter fields and unhandled components.'))
  console.log(chalk.gray('If issues are found, you can configure them interactively.\n'))

  const validationResponse = await inquirer.prompt([{
    type: 'confirm',
    name: 'validate',
    message: 'Run pre-flight validation? (Recommended)',
    default: true,
  }])

  if (validationResponse.validate === undefined) {
    console.log(chalk.red('\n✖ Migration cancelled.\n'))
    process.exit(0)
  }

  const skipValidation = !validationResponse.validate

  // ============================================================================
  // PHASE 4.5: Run Validation in Wizard Process (if enabled)
  // ============================================================================

  if (validationResponse.validate) {
    console.log(chalk.cyan.bold('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'))
    console.log(chalk.cyan.bold('  🔍 Running Validation'))
    console.log(chalk.cyan.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'))

    console.log(chalk.gray('Scanning MDX files for validation issues...\n'))

    // Find all MDX files based on user selections
    const mdxFiles = await findAllMDXFiles(selectedCollection.dir, slugFilter, limitCount)

    console.log(chalk.gray(`Found ${mdxFiles.length} files to validate\n`))

    // Run validation with interactive handling (stdin works here!)
    const validationPassed = await runValidationLoop(
      mdxFiles,
      selectedCollection.dir,
      collectionResponse.collection,
      {
        interactive: true, // Interactive prompts work in wizard process!
        ignoreUnmappedFields: false,
        ignoreUnhandled: false,
        interactiveFieldMapper,
        interactiveComponentMapper,
      }
    )

    if (!validationPassed) {
      console.log(chalk.red('\n❌ Validation failed. Please resolve issues and try again.\n'))
      process.exit(1)
    }

    console.log(chalk.green('\n✅ All validation checks passed!\n'))
  }

  // ============================================================================
  // PHASE 5: Summary & Confirmation
  // ============================================================================

  console.log(chalk.cyan.bold('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'))
  console.log(chalk.cyan.bold('  📋 Migration Plan'))
  console.log(chalk.cyan.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'))

  console.log(chalk.white('  Collection:    ') + chalk.yellow(selectedCollection.name))
  console.log(chalk.white('  Scope:         ') + chalk.yellow(
    scopeResponse.scope === 'all' ? `All files (${totalFiles})` :
    scopeResponse.scope === 'single' ? `Single file: ${slugFilter}` :
    `Limited batch (${limitCount} files)`
  ))
  console.log(chalk.white('  Purge:         ') + chalk.yellow(purgeResponse.purge ? 'Yes (hard delete)' : 'No (append mode)'))
  console.log(chalk.white('  Validation:    ') + chalk.yellow(skipValidation ? 'Skipped' : 'Enabled'))
  console.log()

  const confirmResponse = await inquirer.prompt([{
    type: 'confirm',
    name: 'confirm',
    message: 'Ready to proceed with migration?',
    default: true,
  }])

  if (!confirmResponse.confirm) {
    console.log(chalk.red('\n✖ Migration cancelled.\n'))
    process.exit(0)
  }

  // ============================================================================
  // PHASE 6: Execute Migration
  // ============================================================================

  console.log(chalk.cyan.bold('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'))
  console.log(chalk.cyan.bold('  🚀 Executing Migration'))
  console.log(chalk.cyan.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'))

  // Build command with flags
  const flags = []
  if (!purgeResponse.purge) flags.push('--skip-purge')
  if (slugFilter) flags.push(`--slug=${slugFilter}`)
  if (limitCount) flags.push(`--limit=${limitCount}`)

  // ALWAYS skip validation in spawned script (already done in wizard if enabled)
  flags.push('--ignore-unmapped-fields')
  flags.push('--ignore-unhandled')

  const scriptPath = selectedCollection.script
  const command = `./scripts/doppler-run.sh dev pnpm tsx ${scriptPath} ${flags.join(' ')}`

  console.log(chalk.gray(`Running: ${command}\n`))

  try {
    // Execute migration script
    const child = exec(command, { cwd: process.cwd() })

    // Pipe output to console
    child.stdout.pipe(process.stdout)
    child.stderr.pipe(process.stderr)

    // Wait for completion
    await new Promise((resolve, reject) => {
      child.on('close', (code) => {
        if (code === 0) {
          resolve()
        } else {
          reject(new Error(`Migration failed with exit code ${code}`))
        }
      })
      child.on('error', reject)
    })

    console.log(chalk.green.bold('\n✅ Migration wizard completed successfully!\n'))
  } catch (error) {
    console.error(chalk.red.bold('\n❌ Migration failed:\n'))
    console.error(error.message)
    process.exit(1)
  }
}

// Run wizard
runWizard().catch((error) => {
  console.error(chalk.red('\n💥 Unexpected error:'), error)
  process.exit(1)
})
