/**
 * Inquirer-based Interactive Field Mapper
 *
 * Replaces prompts library with inquirer for better stdin handling
 * in nested script execution contexts (doppler → tsx → script)
 */

import inquirer from 'inquirer'
import chalk from 'chalk'
import { analyzeUnmappedFields } from '../../../scripts/migration/lib/field-type-detector.ts'
import { generateCodeSnippets, suggestPayloadFieldName, buildFieldConfig, formatSnippetsForDisplay } from '../../../scripts/migration/lib/code-generator.ts'
import { updateAllFiles, formatUpdateResults } from '../../../scripts/migration/lib/file-writer.ts'

/**
 * Interactive field mapper - guides user through configuring unmapped fields
 */
export async function interactiveFieldMapper(unmappedFields, mdxFiles) {
  console.log(chalk.cyan.bold('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'))
  console.log(chalk.cyan.bold('  🎯 Interactive Field Mapper\n'))
  console.log(chalk.cyan.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'))

  console.log(chalk.yellow(`Found ${unmappedFields.length} unmapped frontmatter fields.\n`))
  console.log(chalk.gray('This interactive workflow will guide you through configuring each field.\n'))

  const { start } = await inquirer.prompt([{
    type: 'confirm',
    name: 'start',
    message: 'Would you like to interactively map these fields?',
    default: true,
  }])

  if (!start) {
    console.log(chalk.red('\n✖ Migration cancelled. Please map fields manually.\n'))
    process.exit(1)
  }

  // Analyze all unmapped fields
  const analyses = await analyzeUnmappedFields(unmappedFields, mdxFiles)

  // Track configurations for bulk update
  const fieldConfigurations = []

  // Process each field
  for (let i = 0; i < unmappedFields.length; i++) {
    const fieldName = unmappedFields[i]
    const analysis = analyses.get(fieldName)

    if (!analysis) continue

    console.log(chalk.cyan.bold(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`))
    console.log(chalk.cyan.bold(`  📝 Field ${i + 1}/${unmappedFields.length}: ${fieldName}`))
    console.log(chalk.cyan.bold(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`))

    console.log(chalk.gray(`Found in ${analysis.fileCount} files`))
    console.log(chalk.gray(`Example values:`))
    analysis.exampleValues.slice(0, 3).forEach(val => {
      console.log(chalk.gray(`  - ${chalk.white(JSON.stringify(val))}`))
    })
    console.log(chalk.gray(`\nSuggested type: ${chalk.yellow(analysis.suggestedType)} (${Math.round(analysis.confidence * 100)}% confidence)`))
    if (analysis.relationshipHints) {
      console.log(chalk.gray(`Relationship hint: ${analysis.relationshipHints.reason}`))
    }
    console.log('')

    // Prompt 1: Field type
    const { fieldType } = await inquirer.prompt([{
      type: 'list',
      name: 'fieldType',
      message: 'What type of field is this?',
      choices: [
        { name: 'Text field - Simple text string', value: 'text' },
        { name: 'Relationship to another collection - References team, authors, etc.', value: 'relationship' },
        { name: 'Upload/Media - Image, PDF, or other file', value: 'upload' },
        { name: 'Number - Numeric value', value: 'number' },
        { name: 'Date - ISO date string', value: 'date' },
        { name: 'Boolean - true/false value', value: 'checkbox' },
        { name: 'Ignore (don\'t migrate) - Skip this field', value: 'ignore' },
      ],
      default: analysis.suggestedType,
    }])

    if (fieldType === 'ignore') {
      console.log(chalk.gray(`\n✓ Will ignore ${chalk.cyan(fieldName)}\n`))
      continue
    }

    // Prompt 2: Additional config based on type
    let relationTo = undefined
    let uploadRelationTo = undefined

    if (fieldType === 'relationship') {
      const { relationTo: relTo } = await inquirer.prompt([{
        type: 'list',
        name: 'relationTo',
        message: 'Which collection does it relate to?',
        choices: [
          { name: 'team', value: 'team' },
          { name: 'authors', value: 'authors' },
          { name: 'categories', value: 'categories' },
          { name: 'tags', value: 'tags' },
          { name: 'Other (specify)', value: 'other' },
        ],
        default: analysis.relationshipHints?.suggestedCollection || 'team',
      }])

      if (relTo === 'other') {
        const { customRelation } = await inquirer.prompt([{
          type: 'input',
          name: 'customRelation',
          message: 'Enter the collection slug:',
        }])
        relationTo = customRelation
      } else {
        relationTo = relTo
      }
    }

    if (fieldType === 'upload') {
      const { uploadRel } = await inquirer.prompt([{
        type: 'list',
        name: 'uploadRel',
        message: 'Upload to which collection?',
        choices: [
          { name: 'media', value: 'media' },
          { name: 'files', value: 'files' },
        ],
        default: 'media',
      }])
      uploadRelationTo = uploadRel
    }

    // Prompt 3: Payload field name
    const suggestedName = suggestPayloadFieldName(fieldName)
    const { payloadName } = await inquirer.prompt([{
      type: 'input',
      name: 'payloadName',
      message: 'Payload field name (camelCase)?',
      default: suggestedName,
    }])

    // Prompt 4: Required field?
    const { required } = await inquirer.prompt([{
      type: 'confirm',
      name: 'required',
      message: 'Is this field required?',
      default: false,
    }])

    // Build field config
    const fieldConfig = buildFieldConfig(analysis, {
      fieldType,
      payloadName,
      required,
      relationTo,
      uploadRelationTo,
    })

    // Generate code snippets
    const snippets = generateCodeSnippets(fieldConfig)

    console.log(chalk.green('\n✓ Configuration captured!\n'))
    console.log(chalk.cyan.bold('Generated code snippets:\n'))
    console.log(formatSnippetsForDisplay(snippets, 'electricity-rates'))

    // Prompt 5: Apply changes?
    const { action } = await inquirer.prompt([{
      type: 'list',
      name: 'action',
      message: '\nWhat would you like to do?',
      choices: [
        { name: 'Apply changes (auto-update files) - Update files and continue', value: 'apply' },
        { name: 'Show snippets for manual apply - Show snippets again', value: 'manual' },
        { name: 'Skip this field - Move to next field', value: 'skip' },
        { name: 'Abort migration - Exit without changes', value: 'abort' },
      ],
      default: 'apply',
    }])

    if (action === 'abort') {
      console.log(chalk.red('\n✖ Migration aborted.\n'))
      process.exit(1)
    }

    if (action === 'manual') {
      console.log(chalk.cyan('\n📋 Code Snippets (copy manually):\n'))
      console.log(formatSnippetsForDisplay(snippets, 'electricity-rates'))
      console.log(chalk.gray('\nPress Enter to continue to next field...\n'))
      await inquirer.prompt([{ type: 'input', name: 'continue', message: '' }])
      continue
    }

    if (action === 'skip') {
      console.log(chalk.gray(`\n⏭️  Skipped ${chalk.cyan(fieldName)}\n`))
      continue
    }

    // Auto-apply changes
    fieldConfigurations.push({ fieldName, fieldConfig, snippets })
  }

  // Apply all configurations
  if (fieldConfigurations.length > 0) {
    console.log(chalk.cyan.bold('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'))
    console.log(chalk.cyan.bold('  📝 Applying Changes'))
    console.log(chalk.cyan.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'))

    const updateResults = await updateAllFiles(fieldConfigurations, 'electricity-rates')
    console.log(formatUpdateResults(updateResults))

    const { confirm } = await inquirer.prompt([{
      type: 'confirm',
      name: 'confirm',
      message: '\nChanges applied. Continue with migration?',
      default: true,
    }])

    if (!confirm) {
      console.log(chalk.red('\n✖ Migration cancelled.\n'))
      process.exit(1)
    }

    console.log(chalk.green('\n✅ Field mapping complete!\n'))
  }

  return fieldConfigurations.length
}
