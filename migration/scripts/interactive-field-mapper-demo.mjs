#!/usr/bin/env node
/**
 * Interactive Field Mapper - DEMO
 *
 * Demonstrates the interactive CLI workflow for mapping unmapped frontmatter fields.
 * This is a proof-of-concept showing what the full implementation would look like.
 *
 * Run: pnpm tsx migration/scripts/interactive-field-mapper-demo.mjs
 */

import prompts from 'prompts'
import chalk from 'chalk'

// DEMO DATA: Simulated unmapped fields
const DEMO_UNMAPPED_FIELDS = [
  {
    name: 'editorial_team_editor',
    exampleValues: ['john-doe', 'jane-smith', 'bob-jones'],
    fileCount: 5,
  },
  {
    name: 'featured_image',
    exampleValues: ['/uploads/image1.jpg', '/uploads/image2.png'],
    fileCount: 12,
  },
  {
    name: 'reading_time_minutes',
    exampleValues: [5, 8, 12, 3],
    fileCount: 45,
  },
]

console.log(chalk.cyan.bold('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'))
console.log(chalk.cyan.bold('  🎯 Interactive Field Mapper - DEMO'))
console.log(chalk.cyan.bold('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'))

console.log(chalk.yellow('This demo shows what the interactive workflow would look like.'))
console.log(chalk.gray('In the real implementation, this would be integrated into the migration script.\n'))

async function demo() {
  console.log(chalk.red.bold(`❌ Found ${DEMO_UNMAPPED_FIELDS.length} unmapped frontmatter fields:\n`))

  DEMO_UNMAPPED_FIELDS.forEach((field, i) => {
    console.log(chalk.white(`   ${i + 1}. ${chalk.cyan(field.name)}`))
    console.log(chalk.gray(`      Found in ${field.fileCount} files`))
    console.log(chalk.gray(`      Example values: ${field.exampleValues.slice(0, 3).join(', ')}`))
  })

  console.log(chalk.yellow('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'))

  const startResponse = await prompts({
    type: 'confirm',
    name: 'start',
    message: 'Would you like to interactively map these fields?',
    initial: true,
  })

  if (!startResponse.start) {
    console.log(chalk.red('\n✖ Migration cancelled. Please map fields manually.\n'))
    return
  }

  // DEMO: Process each unmapped field
  for (let i = 0; i < DEMO_UNMAPPED_FIELDS.length; i++) {
    const field = DEMO_UNMAPPED_FIELDS[i]

    console.log(chalk.cyan.bold(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`))
    console.log(chalk.cyan.bold(`  📝 Field ${i + 1}/${DEMO_UNMAPPED_FIELDS.length}: ${field.name}`))
    console.log(chalk.cyan.bold(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`))

    console.log(chalk.gray(`Found in ${field.fileCount} files`))
    console.log(chalk.gray(`Example values:`))
    field.exampleValues.forEach(val => {
      console.log(chalk.gray(`  - ${chalk.white(val)}`))
    })
    console.log('')

    // Prompt 1: Field type
    const typeResponse = await prompts({
      type: 'select',
      name: 'fieldType',
      message: 'What type of field is this?',
      choices: [
        { title: 'Text field', value: 'text', description: 'Simple text string' },
        { title: 'Relationship to another collection', value: 'relationship', description: 'References team, authors, etc.' },
        { title: 'Upload/Media', value: 'upload', description: 'Image, PDF, or other file' },
        { title: 'Number', value: 'number', description: 'Numeric value' },
        { title: 'Date', value: 'date', description: 'ISO date string' },
        { title: 'Boolean', value: 'checkbox', description: 'true/false value' },
        { title: 'Ignore (don\'t migrate)', value: 'ignore', description: 'Skip this field' },
      ],
      initial: field.name.includes('_id') || field.name.includes('team') || field.name.includes('author') ? 1 : 0,
    })

    if (typeResponse.fieldType === 'ignore') {
      console.log(chalk.gray(`\n✓ Will ignore ${chalk.cyan(field.name)}\n`))
      continue
    }

    // Prompt 2: Additional config based on type
    let additionalConfig = {}

    if (typeResponse.fieldType === 'relationship') {
      const relResponse = await prompts({
        type: 'select',
        name: 'relationTo',
        message: 'Which collection does it relate to?',
        choices: [
          { title: 'team', value: 'team' },
          { title: 'authors', value: 'authors' },
          { title: 'categories', value: 'categories' },
          { title: 'tags', value: 'tags' },
          { title: 'Other (specify)', value: 'other' },
        ],
        initial: field.name.includes('team') ? 0 : field.name.includes('author') ? 1 : 0,
      })

      if (relResponse.relationTo === 'other') {
        const customRel = await prompts({
          type: 'text',
          name: 'customRelation',
          message: 'Enter the collection slug:',
        })
        additionalConfig.relationTo = customRel.customRelation
      } else {
        additionalConfig.relationTo = relResponse.relationTo
      }
    }

    if (typeResponse.fieldType === 'upload') {
      const uploadResponse = await prompts({
        type: 'select',
        name: 'relationTo',
        message: 'Upload to which collection?',
        choices: [
          { title: 'media', value: 'media' },
          { title: 'files', value: 'files' },
        ],
        initial: 0,
      })
      additionalConfig.relationTo = uploadResponse.relationTo
    }

    // Prompt 3: Payload field name
    const suggestedName = field.name
      .split('_')
      .map((part, i) => i === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1))
      .join('')

    const nameResponse = await prompts({
      type: 'text',
      name: 'payloadName',
      message: 'Payload field name (camelCase)?',
      initial: suggestedName,
    })

    // Prompt 4: Required field?
    const requiredResponse = await prompts({
      type: 'confirm',
      name: 'required',
      message: 'Is this field required?',
      initial: false,
    })

    // Generate code snippets
    console.log(chalk.green('\n✓ Configuration captured!\n'))
    console.log(chalk.cyan.bold('Generated code snippets:\n'))

    // Payload schema snippet
    console.log(chalk.gray('─'.repeat(60)))
    console.log(chalk.yellow.bold('📄 src/collections/ElectricityRates/index.ts'))
    console.log(chalk.gray('─'.repeat(60)))
    console.log(chalk.white(generatePayloadSchemaSnippet(nameResponse.payloadName, typeResponse.fieldType, additionalConfig, requiredResponse.required)))

    // Field mapper interface snippet
    console.log(chalk.gray('\n' + '─'.repeat(60)))
    console.log(chalk.yellow.bold('📄 scripts/migration/lib/rate-field-mapper.ts (Interface)'))
    console.log(chalk.gray('─'.repeat(60)))
    console.log(chalk.white(generateInterfaceSnippet(field.name, typeResponse.fieldType)))

    // Field mapper logic snippet
    console.log(chalk.gray('\n' + '─'.repeat(60)))
    console.log(chalk.yellow.bold('📄 scripts/migration/lib/rate-field-mapper.ts (Mapping)'))
    console.log(chalk.gray('─'.repeat(60)))
    console.log(chalk.white(generateMapperSnippet(field.name, nameResponse.payloadName, typeResponse.fieldType)))

    // Registry addition snippet
    console.log(chalk.gray('\n' + '─'.repeat(60)))
    console.log(chalk.yellow.bold('📄 scripts/migration/lib/frontmatter-field-registry.ts'))
    console.log(chalk.gray('─'.repeat(60)))
    console.log(chalk.white(`'${field.name}',  // ${typeResponse.fieldType}`))
    console.log(chalk.gray('─'.repeat(60)))

    // Prompt 5: Apply changes?
    const applyResponse = await prompts({
      type: 'select',
      name: 'action',
      message: '\nWhat would you like to do?',
      choices: [
        { title: 'Continue (in real version, would write files)', value: 'apply', description: 'Apply changes and continue' },
        { title: 'Copy to clipboard (manual apply)', value: 'copy', description: 'Copy snippets to clipboard' },
        { title: 'Skip this field', value: 'skip', description: 'Move to next field' },
        { title: 'Abort migration', value: 'abort', description: 'Exit without changes' },
      ],
      initial: 0,
    })

    if (applyResponse.action === 'abort') {
      console.log(chalk.red('\n✖ Migration aborted.\n'))
      return
    }

    if (applyResponse.action === 'apply') {
      console.log(chalk.green(`\n✓ [DEMO] Would write to 3 files`))
      console.log(chalk.green(`✓ [DEMO] Would add '${field.name}' to RATE_KNOWN_FIELDS registry\n`))
    }

    if (applyResponse.action === 'copy') {
      console.log(chalk.gray('\n[DEMO] Would copy to clipboard\n'))
    }
  }

  // Summary
  console.log(chalk.cyan.bold('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'))
  console.log(chalk.cyan.bold('  ✅ Demo Complete!'))
  console.log(chalk.cyan.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'))

  console.log(chalk.green('✓ All fields mapped!'))
  console.log(chalk.gray('In the real implementation, the migration would now continue.\n'))

  const continueResponse = await prompts({
    type: 'confirm',
    name: 'continue',
    message: 'Would you like to see this integrated into the migration script?',
    initial: true,
  })

  if (continueResponse.continue) {
    console.log(chalk.yellow('\n📝 Next steps to integrate:'))
    console.log(chalk.white('  1. Add interactive mode to seed-electricity-rates-with-payload-api.mjs'))
    console.log(chalk.white('  2. Create field-type-detector.ts (analyze values to suggest types)'))
    console.log(chalk.white('  3. Create code-generator.ts (generate snippets)'))
    console.log(chalk.white('  4. Create file-writer.ts (safely update TypeScript files)'))
    console.log(chalk.white('  5. Add --interactive flag to migration script\n'))
  } else {
    console.log(chalk.gray('\n👍 No problem! You can continue using the batch error workflow.\n'))
  }
}

// Helper functions to generate code snippets
function generatePayloadSchemaSnippet(fieldName, fieldType, additionalConfig, required) {
  const fieldConfig = {
    name: fieldName,
    type: fieldType,
    ...(required && { required: true }),
    ...additionalConfig,
  }

  return JSON.stringify(fieldConfig, null, 2)
}

function generateInterfaceSnippet(frontmatterField, fieldType) {
  const tsType = {
    text: 'string',
    number: 'number',
    checkbox: 'boolean',
    date: 'string',
    relationship: 'string',  // Slug before resolution
    upload: 'string',  // Path before resolution
  }[fieldType] || 'string'

  return `${frontmatterField}?: ${tsType}`
}

function generateMapperSnippet(frontmatterField, payloadField, fieldType) {
  return `${payloadField}: frontmatter.${frontmatterField}`
}

// Run demo
demo().catch(console.error)
