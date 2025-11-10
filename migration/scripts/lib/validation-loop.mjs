/**
 * Validation Loop - Iterative validation with interactive config
 *
 * Keeps running validation until all frontmatter fields and components are configured.
 * In interactive mode, prompts user to configure issues and then re-validates.
 * Avoids requiring script restarts.
 */

import fs from 'fs/promises'
import path from 'path'
import matter from 'gray-matter'
import chalk from 'chalk'
import { validateFrontmatterFields } from '../../../scripts/migration/lib/frontmatter-field-registry.ts'
import { displayUnmappedFieldsError } from '../../../scripts/migration/lib/frontmatter-field-registry.ts'
import { parseMDXToBlocks } from '../../../scripts/migration/lib/mdx-to-payload-blocks.ts'
import { displayBlockingError } from '../../../scripts/migration/lib/display-blocking-error.ts'
import { generateTodoFile } from '../../../scripts/migration/lib/auto-generate-todo.ts'
import { autoMergeComponents } from '../../../scripts/migration/lib/auto-merge-registry.ts'
import { markMigrationBlocked } from '../../../src/lib/migration-status.ts'

/**
 * Run validation loop until everything passes or max attempts reached
 *
 * @param mdxFiles - Array of MDX file paths to validate
 * @param sourceDir - Source directory for relative paths
 * @param collectionName - Collection name for registry lookups
 * @param options - Validation options
 * @returns True if validation passed, false otherwise
 */
export async function runValidationLoop(
  mdxFiles,
  sourceDir,
  collectionName,
  {
    interactive = false,
    ignoreUnmappedFields = false,
    ignoreUnhandled = false,
    interactiveFieldMapper,
    interactiveComponentMapper,
  }
) {
  const MAX_ATTEMPTS = 10
  let attempts = 0

  while (attempts < MAX_ATTEMPTS) {
    attempts++
    console.log(chalk.gray(`\n━━━ Validation Attempt ${attempts}/${MAX_ATTEMPTS} ━━━\n`))

    let allPassed = true

    // PHASE 1: Frontmatter field validation
    if (!ignoreUnmappedFields) {
      console.log('🔍 Pre-flight validation (1/2): Checking frontmatter fields...\n')

      const discoveredFields = new Set()

      // Collect all frontmatter fields
      for (let i = 0; i < mdxFiles.length; i++) {
        const filePath = mdxFiles[i]
        const progress = `[${i + 1}/${mdxFiles.length}]`
        const relativePath = path.relative(sourceDir, filePath)

        try {
          const fileContent = await fs.readFile(filePath, 'utf-8')
          const { data: frontmatter } = matter(fileContent)
          Object.keys(frontmatter).forEach(key => discoveredFields.add(key))
        } catch (error) {
          console.error(`   ${progress} ❌ Read error: ${relativePath}`)
          console.error(`      ${error.message}`)
        }
      }

      // Dynamically reload the registry to get latest updates (cache-busting with timestamp)
      const registryPath = path.resolve(process.cwd(), 'scripts/migration/lib/frontmatter-field-registry.ts')
      const { RATE_KNOWN_FIELDS, PROVIDER_KNOWN_FIELDS } = await import(registryPath + '?t=' + Date.now())
      const knownFields = collectionName === 'electricity-rates' ? RATE_KNOWN_FIELDS : PROVIDER_KNOWN_FIELDS

      const unmappedFields = validateFrontmatterFields(discoveredFields, knownFields)

      if (unmappedFields.length > 0) {
        allPassed = false

        if (interactive) {
          await interactiveFieldMapper(unmappedFields, mdxFiles)
          console.log(chalk.cyan('\n🔄 Registry updated! Re-validating...\n'))
          continue // Re-run validation
        } else {
          displayUnmappedFieldsError(unmappedFields, collectionName)
          console.log(chalk.yellow('\n💡 Tip: Use --interactive flag to map these fields interactively\n'))
          return false
        }
      }

      console.log(`   ✓ All ${discoveredFields.size} frontmatter fields are mapped\n`)
    } else {
      console.log('⏭️  Skipping frontmatter field check\n')
    }

    // PHASE 2: Component validation
    if (!ignoreUnhandled) {
      console.log('🔍 Pre-flight validation (2/2): Checking for unhandled components...\n')

      const unhandledComponentsMap = new Map()

      // Parse each file's MDX content
      for (let i = 0; i < mdxFiles.length; i++) {
        const filePath = mdxFiles[i]
        const progress = `[${i + 1}/${mdxFiles.length}]`
        const relativePath = path.relative(sourceDir, filePath)

        try {
          const fileContent = await fs.readFile(filePath, 'utf-8')
          const { data: frontmatter, content: mdxContent } = matter(fileContent)

          // Parse MDX with collectUnhandled=true
          // Correct function signature: parseMDXToBlocks(mdxContent, payloadConfig?, payload?, mdxFilePath?, options?)
          const { unhandledComponents } = await parseMDXToBlocks(
            mdxContent,
            undefined,  // payloadConfig (not needed for validation)
            undefined,  // payload (not needed for validation)
            filePath,   // mdxFilePath (for better error messages)
            {
              collectUnhandled: true  // Don't throw, collect unmapped components instead
            }
          )

          // Collect unhandled components
          for (const component of unhandledComponents || []) {
            if (unhandledComponentsMap.has(component.name)) {
              const existing = unhandledComponentsMap.get(component.name)
              existing.usageCount += component.usageCount
            } else {
              unhandledComponentsMap.set(component.name, { ...component })
            }
          }
        } catch (error) {
          console.error(`   ${progress} ❌ Parse error: ${relativePath}`)
          console.error(`      ${error.message}`)
        }
      }

      if (unhandledComponentsMap.size > 0) {
        allPassed = false
        const components = Array.from(unhandledComponentsMap.values())
          .sort((a, b) => b.usageCount - a.usageCount)

        if (interactive) {
          await interactiveComponentMapper(components, mdxFiles)  // Pass mdxFiles for prop analysis!
          console.log(chalk.cyan('\n🔄 Component registry updated! Re-validating...\n'))
          continue // Re-run validation
        } else {
          markMigrationBlocked(components)
          await generateTodoFile(components)
          await autoMergeComponents(components)
          displayBlockingError(components)
          return false
        }
      }

      console.log('   ✓ No unhandled components detected\n')
    } else {
      console.log('⏭️  Skipping unhandled component check\n')
    }

    // If we get here, all validations passed
    if (allPassed) {
      console.log(chalk.green.bold('\n✅ All pre-flight validations passed!\n'))
      return true
    }
  }

  console.log(chalk.red(`\n❌ Max validation attempts (${MAX_ATTEMPTS}) reached. Please check configuration.\n`))
  return false
}
