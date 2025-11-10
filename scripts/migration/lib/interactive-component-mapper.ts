/**
 * Interactive Component Mapper
 *
 * Guides user through configuring unhandled MDX components interactively.
 * Updates the component registry with user's configuration choices.
 *
 * @module interactive-component-mapper
 */

import fs from 'fs/promises'
import path from 'path'
import prompts from 'prompts'
import chalk from 'chalk'
import type { UnhandledComponent } from './mdx-to-payload-blocks.js'
import type { ComponentMapping } from '../../../src/lib/component-registry.js'

/**
 * Interactive component mapper - guides user through configuring unhandled components
 *
 * For each unhandled component, prompts user for:
 * - Component type (block, inline, both)
 * - Rendering capabilities
 * - Payload block type mapping
 * - Whether to mark as implemented or needs-work
 *
 * Updates the component registry file with user's choices.
 *
 * @param components - Array of unhandled components
 * @returns Number of components configured
 */
export async function interactiveComponentMapper(
  components: UnhandledComponent[]
): Promise<number> {
  console.log(chalk.cyan.bold('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'))
  console.log(chalk.cyan.bold('  🧩 Interactive Component Mapper\n'))
  console.log(chalk.cyan.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'))

  console.log(chalk.yellow(`Found ${components.length} unhandled components.\n`))
  console.log(chalk.gray('This interactive workflow will guide you through configuring each component.\n'))

  const startResponse = await prompts({
    type: 'confirm',
    name: 'start',
    message: 'Would you like to interactively configure these components?',
    initial: true,
  })

  if (!startResponse.start) {
    console.log(chalk.red('\n✖ Migration cancelled. Please configure components manually.\n'))
    return 0
  }

  const componentConfigs = new Map<string, ComponentMapping>()

  // Process each component
  for (let i = 0; i < components.length; i++) {
    const component = components[i]
    const { name, componentType: detectedType, usageCount } = component

    console.log(chalk.cyan.bold(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`))
    console.log(chalk.cyan.bold(`  🧩 Component ${i + 1}/${components.length}: ${name}`))
    console.log(chalk.cyan.bold(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`))

    console.log(chalk.gray(`Used ${usageCount} time(s)`))
    console.log(chalk.gray(`Detected as: ${chalk.yellow(detectedType)} component\n`))

    // Prompt 1: Confirm or override component type
    const typeResponse = await prompts({
      type: 'select',
      name: 'componentType',
      message: 'What type of component is this?',
      choices: [
        {
          title: 'Block component',
          value: 'block',
          description: 'Standalone block (RatesTable, FaqSection, etc.)'
        },
        {
          title: 'Inline component',
          value: 'inline',
          description: 'Inline text component (PhoneNumber, LinkTo, etc.)'
        },
        {
          title: 'Both block and inline',
          value: 'both',
          description: 'Can render as either block or inline'
        },
        {
          title: 'Ignore (don\'t migrate)',
          value: 'ignore',
          description: 'Skip this component entirely'
        },
      ],
      initial: ['block', 'inline', 'both'].indexOf(detectedType),
    })

    if (typeResponse.componentType === 'ignore') {
      console.log(chalk.gray(`\n✓ Will ignore ${chalk.cyan(name)}\n`))
      continue
    }

    // Prompt 2: Rendering capabilities
    const canRenderBlock = typeResponse.componentType === 'block' || typeResponse.componentType === 'both'
    const canRenderInline = typeResponse.componentType === 'inline' || typeResponse.componentType === 'both'

    // Prompt 3: Payload block type mapping (for block components)
    let payloadBlockType: string | undefined

    if (canRenderBlock) {
      const blockTypeResponse = await prompts({
        type: 'select',
        name: 'blockType',
        message: 'Map to which Payload block type?',
        choices: [
          { title: 'ratesTable', value: 'ratesTable', description: 'Rates comparison table' },
          { title: 'faqSection', value: 'faqSection', description: 'FAQ section' },
          { title: 'chart', value: 'chart', description: 'Data visualization chart' },
          { title: 'searchBar', value: 'searchBar', description: 'Zipcode/City search' },
          { title: 'genericBlock', value: 'genericBlock', description: 'Generic content block' },
          { title: 'customBlock', value: 'customBlock', description: 'Custom/unique block (specify below)' },
          { title: 'none', value: undefined, description: 'No mapping yet (configure later)' },
        ],
        initial: 0,
      })

      if (blockTypeResponse.blockType === 'customBlock') {
        const customTypeResponse = await prompts({
          type: 'text',
          name: 'customType',
          message: 'Enter custom block type name (camelCase):',
          initial: name.charAt(0).toLowerCase() + name.slice(1),
        })
        payloadBlockType = customTypeResponse.customType
      } else {
        payloadBlockType = blockTypeResponse.blockType
      }
    }

    // Prompt 4: Implementation status
    const statusResponse = await prompts({
      type: 'select',
      name: 'status',
      message: 'What is the implementation status?',
      choices: [
        {
          title: 'Implemented (ready to use)',
          value: 'implemented',
          description: 'Component is fully configured and ready'
        },
        {
          title: 'Needs work (configure later)',
          value: 'needs-work',
          description: 'Component needs additional configuration'
        },
      ],
      initial: payloadBlockType ? 0 : 1,
    })

    // Prompt 5: Should block migration?
    const blockingResponse = await prompts({
      type: 'confirm',
      name: 'blocking',
      message: 'Should this component block migration if not configured?',
      initial: statusResponse.status === 'needs-work',
    })

    // Build component config
    const config: ComponentMapping = {
      status: statusResponse.status,
      componentType: typeResponse.componentType === 'both' ? 'block' : typeResponse.componentType,
      canRenderBlock,
      canRenderInline,
      payloadBlockType,
      mdxUsageCount: usageCount,
      fields: {},
      todos: statusResponse.status === 'needs-work' ? [
        'Configure component type',
        'Set rendering capabilities',
        'Implement Payload block or inline block',
        'Test with sample MDX',
      ] : [],
      isBlocking: blockingResponse.blocking,
    }

    componentConfigs.set(name, config)

    console.log(chalk.green('\n✓ Configuration captured!'))
    console.log(chalk.gray(`  Type: ${config.componentType}`))
    console.log(chalk.gray(`  Status: ${config.status}`))
    console.log(chalk.gray(`  Blocking: ${config.isBlocking ? 'Yes' : 'No'}`))
    if (payloadBlockType) {
      console.log(chalk.gray(`  Payload Block: ${payloadBlockType}`))
    }
  }

  console.log(chalk.cyan.bold('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'))
  console.log(chalk.cyan.bold('  📝 Review Configuration'))
  console.log(chalk.cyan.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'))

  console.log(chalk.white(`Configured ${componentConfigs.size} component(s):\n`))
  for (const [name, config] of componentConfigs) {
    const statusColor = config.status === 'implemented' ? chalk.green : chalk.yellow
    console.log(`  ${statusColor('●')} ${name}: ${config.status} (${config.componentType})`)
  }

  console.log('')

  // Prompt 6: Apply changes?
  const applyResponse = await prompts({
    type: 'confirm',
    name: 'apply',
    message: 'Apply these configurations to the component registry?',
    initial: true,
  })

  if (!applyResponse.apply) {
    console.log(chalk.red('\n✖ Configuration not applied. No changes made.\n'))
    return 0
  }

  // Apply changes to registry file
  console.log(chalk.yellow('\n🔧 Updating component registry...\n'))

  const registryPath = path.join(process.cwd(), 'src', 'lib', 'component-registry.ts')
  let registryContent = await fs.readFile(registryPath, 'utf-8')

  let updatedCount = 0

  for (const [name, config] of componentConfigs) {
    // Check if component already exists in registry
    const componentPattern = new RegExp(`'${name}'\\s*:\\s*\\{[^}]*\\}`, 's')
    const existsInRegistry = componentPattern.test(registryContent)

    if (existsInRegistry) {
      // Update existing component
      const newComponentCode = generateComponentCode(name, config)
      registryContent = registryContent.replace(componentPattern, newComponentCode)
      console.log(chalk.green(`  ✓ Updated ${name}`))
      updatedCount++
    } else {
      // Add new component before closing brace
      const newComponentCode = generateComponentCode(name, config)
      const registryEndPattern = /(\n}\s+as const\s*\n)/
      registryContent = registryContent.replace(
        registryEndPattern,
        `\n${newComponentCode}\n\n$1`
      )
      console.log(chalk.green(`  ✓ Added ${name}`))
      updatedCount++
    }
  }

  // Write updated registry file
  await fs.writeFile(registryPath, registryContent, 'utf-8')

  console.log(chalk.green(`\n✅ Successfully updated ${updatedCount} component(s) in registry\n`))

  console.log(chalk.cyan.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'))
  console.log(chalk.cyan.bold('  ✅ Interactive mapping complete!'))
  console.log(chalk.cyan.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'))

  return updatedCount
}

/**
 * Generate TypeScript code for a component entry
 */
function generateComponentCode(name: string, config: ComponentMapping): string {
  let code = `  '${name}': {\n`
  code += `    status: '${config.status}',\n`
  code += `    componentType: '${config.componentType}',\n`
  code += `    canRenderBlock: ${config.canRenderBlock},\n`
  code += `    canRenderInline: ${config.canRenderInline},\n`
  code += `    payloadBlockType: ${config.payloadBlockType ? `'${config.payloadBlockType}'` : 'undefined'},\n`
  code += `    mdxUsageCount: ${config.mdxUsageCount},\n`
  code += `    fields: {},\n`

  if (config.todos && config.todos.length > 0) {
    code += `    todos: [\n`
    for (const todo of config.todos) {
      code += `      '${todo}',\n`
    }
    code += `    ],\n`
  } else {
    code += `    todos: [],\n`
  }

  code += `    isBlocking: ${config.isBlocking},\n`
  code += `  },`

  return code
}
