/**
 * Inquirer-based Interactive Component Mapper
 *
 * Replaces prompts library with inquirer for better stdin handling
 * in nested script execution contexts (doppler → tsx → script)
 *
 * Guides user through configuring unhandled MDX components interactively.
 * Updates the component registry with user's configuration choices.
 */

import fs from 'fs/promises'
import path from 'path'
import inquirer from 'inquirer'
import chalk from 'chalk'
import matter from 'gray-matter'

/**
 * Analyze component props across ALL usages in MDX files
 *
 * Extracts:
 * - All prop names used
 * - Example values for each prop
 * - Coverage (how often each prop appears)
 * - Inferred types based on values
 */
async function analyzeComponentProps(componentName, mdxFiles) {
  const propsAnalysis = {}
  const exampleUsages = []
  let totalUsages = 0

  // Regex to find component usages (both self-closing and with children)
  const componentRegex = new RegExp(`<${componentName}([^>]*?)(/?>|>[\\s\\S]*?</${componentName}>)`, 'gi')

  for (const filePath of mdxFiles) {
    try {
      const content = await fs.readFile(filePath, 'utf-8')
      const { content: mdxContent } = matter(content)

      let match
      componentRegex.lastIndex = 0 // Reset regex

      while ((match = componentRegex.exec(mdxContent)) !== null) {
        totalUsages++
        const propsString = match[1] // The attributes part
        exampleUsages.push(match[0].substring(0, 200)) // First 200 chars

        // Extract individual props using a basic regex
        // Matches: propName="value" or propName={value} or propName
        const propRegex = /(\w+)(?:=(?:"([^"]*)"|{([^}]*)}|(\S+)))?/g
        let propMatch

        while ((propMatch = propRegex.exec(propsString)) !== null) {
          const propName = propMatch[1]
          const propValue = propMatch[2] || propMatch[3] || propMatch[4] || 'true'

          // Skip HTML attributes and React reserved props
          if (['class', 'className', 'style', 'key', 'ref'].includes(propName)) continue

          if (!propsAnalysis[propName]) {
            propsAnalysis[propName] = {
              usageCount: 0,
              exampleValues: [],
              inferredType: null
            }
          }

          propsAnalysis[propName].usageCount++

          // Store unique example values (up to 5)
          if (propsAnalysis[propName].exampleValues.length < 5 &&
              !propsAnalysis[propName].exampleValues.includes(propValue)) {
            propsAnalysis[propName].exampleValues.push(propValue)
          }
        }
      }
    } catch (error) {
      // Silently skip files that can't be read
    }
  }

  // Infer types based on values
  for (const [propName, data] of Object.entries(propsAnalysis)) {
    const { exampleValues } = data

    // Infer type from first few values
    if (exampleValues.some(v => v === 'true' || v === 'false')) {
      data.inferredType = 'checkbox'
    } else if (exampleValues.every(v => !isNaN(v) && v !== '')) {
      data.inferredType = 'number'
    } else if (exampleValues.some(v => v.startsWith('http'))) {
      data.inferredType = 'text' // Could be upload/relationship, but default to text
    } else {
      data.inferredType = 'text'
    }

    // Calculate coverage percentage
    data.coverage = ((data.usageCount / totalUsages) * 100).toFixed(0)
    data.required = data.coverage > 80 // Consider required if used in >80% of cases
  }

  return {
    props: propsAnalysis,
    exampleUsages: exampleUsages.slice(0, 3), // Keep first 3 examples
    totalUsages
  }
}

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
 * @param mdxFiles - Array of MDX file paths to analyze props from
 * @returns Number of components configured
 */
export async function interactiveComponentMapper(components, mdxFiles = []) {
  console.log(chalk.cyan.bold('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'))
  console.log(chalk.cyan.bold('  🧩 Interactive Component Mapper\n'))
  console.log(chalk.cyan.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'))

  console.log(chalk.yellow(`Found ${components.length} unhandled components.\n`))
  console.log(chalk.gray('This interactive workflow will guide you through configuring each component.\n'))

  const { start } = await inquirer.prompt([{
    type: 'confirm',
    name: 'start',
    message: 'Would you like to interactively configure these components?',
    default: true,
  }])

  if (!start) {
    console.log(chalk.red('\n✖ Migration cancelled. Please configure components manually.\n'))
    return 0
  }

  const componentConfigs = new Map()

  // Process each component
  for (let i = 0; i < components.length; i++) {
    const component = components[i]
    const { name, componentType: detectedType, usageCount, firstSeenFile, firstSeenLine } = component

    console.log(chalk.cyan.bold(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`))
    console.log(chalk.cyan.bold(`  🧩 Component ${i + 1}/${components.length}: ${name}`))
    console.log(chalk.cyan.bold(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`))

    console.log(chalk.gray(`Used ${usageCount} time(s)`))
    console.log(chalk.gray(`Detected as: ${chalk.yellow(detectedType)} component`))
    console.log(chalk.gray(`First seen: ${firstSeenFile}${firstSeenLine ? `:${firstSeenLine}` : ''}\n`))

    // Analyze props across all usages
    console.log(chalk.yellow('⏳ Analyzing component props across all files...'))
    const propsData = mdxFiles.length > 0 ? await analyzeComponentProps(name, mdxFiles) : null

    if (propsData && Object.keys(propsData.props).length > 0) {
      console.log(chalk.green(`✓ Found ${Object.keys(propsData.props).length} props across ${propsData.totalUsages} usages\n`))

      console.log(chalk.yellow('📊 Props Analysis:'))
      console.log(chalk.gray('─────────────────────────────────────────────────────'))

      // Sort props by coverage (most used first)
      const sortedProps = Object.entries(propsData.props)
        .sort(([, a], [, b]) => b.usageCount - a.usageCount)

      for (const [propName, data] of sortedProps) {
        const requiredLabel = data.required ? chalk.red(' [REQUIRED]') : chalk.gray(' [optional]')
        console.log(chalk.cyan(`  ${propName}${requiredLabel}`))
        console.log(chalk.gray(`    Type: ${data.inferredType}`))
        console.log(chalk.gray(`    Coverage: ${data.coverage}% (${data.usageCount}/${propsData.totalUsages} usages)`))
        if (data.exampleValues.length > 0) {
          console.log(chalk.gray(`    Examples: ${data.exampleValues.slice(0, 3).join(', ')}`))
        }
      }
      console.log(chalk.gray('─────────────────────────────────────────────────────\n'))

      // Show example usages
      if (propsData.exampleUsages.length > 0) {
        console.log(chalk.yellow('📝 Example usages:'))
        console.log(chalk.gray('─────────────────────────────────────────────────────'))
        propsData.exampleUsages.forEach((usage, idx) => {
          console.log(chalk.gray(`${idx + 1}. ${usage}...`))
        })
        console.log(chalk.gray('─────────────────────────────────────────────────────\n'))
      }
    }

    // Read the actual file to show usage example (fallback if props analysis didn't work)
    try {
      const fileContent = await fs.readFile(firstSeenFile, 'utf-8')
      const lines = fileContent.split('\n')

      // Find lines that contain this component
      const componentRegex = new RegExp(`<${name}[\\s/>]`, 'gi')
      const exampleLines = []

      for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
        const line = lines[lineIdx]
        if (componentRegex.test(line)) {
          // Show context: 1 line before, the component line(s), 1 line after
          const start = Math.max(0, lineIdx - 1)
          const end = Math.min(lines.length, lineIdx + 3)
          exampleLines.push(...lines.slice(start, end))
          break // Just show first example
        }
      }

      if (exampleLines.length > 0) {
        console.log(chalk.yellow('📝 Example usage:'))
        console.log(chalk.gray('─────────────────────────────────────────────────────'))
        exampleLines.forEach(line => {
          const highlighted = line.includes(`<${name}`)
            ? chalk.cyan(line)
            : chalk.gray(line)
          console.log(highlighted)
        })
        console.log(chalk.gray('─────────────────────────────────────────────────────\n'))
      }
    } catch (error) {
      // Silently ignore read errors
    }

    // Prompt 1: Confirm or override component type
    const { componentType } = await inquirer.prompt([{
      type: 'list',
      name: 'componentType',
      message: 'What type of component is this?',
      choices: [
        {
          name: 'Block component - Standalone block (RatesTable, FaqSection, etc.)',
          value: 'block'
        },
        {
          name: 'Inline component - Inline text component (PhoneNumber, LinkTo, etc.)',
          value: 'inline'
        },
        {
          name: 'Both block and inline - Can render as either block or inline',
          value: 'both'
        },
        {
          name: 'Ignore (don\'t migrate) - Skip this component entirely',
          value: 'ignore'
        },
      ],
      default: ['block', 'inline', 'both'].indexOf(detectedType),
    }])

    if (componentType === 'ignore') {
      console.log(chalk.gray(`\n✓ Will ignore ${chalk.cyan(name)}\n`))
      continue
    }

    // Prompt 2: Rendering capabilities
    const canRenderBlock = componentType === 'block' || componentType === 'both'
    const canRenderInline = componentType === 'inline' || componentType === 'both'

    // Prompt 3: Payload block type mapping (for block components)
    let payloadBlockType = undefined

    if (canRenderBlock) {
      // Suggest block type based on component name
      const nameLower = name.toLowerCase()
      let suggestedIndex = 6 // default to "none"

      if (nameLower.includes('rate') || nameLower.includes('table') || nameLower.includes('comparison')) {
        suggestedIndex = 0 // ratesTable
      } else if (nameLower.includes('faq') || nameLower.includes('question')) {
        suggestedIndex = 1 // faqSection
      } else if (nameLower.includes('chart') || nameLower.includes('graph')) {
        suggestedIndex = 2 // chart
      } else if (nameLower.includes('search') || nameLower.includes('zipcode') || nameLower.includes('city')) {
        suggestedIndex = 3 // searchBar
      } else if (nameLower.includes('image') || nameLower.includes('img') || nameLower.includes('picture')) {
        suggestedIndex = 4 // genericBlock
      }

      console.log(chalk.yellow(`💡 Suggested block type: ${['ratesTable', 'faqSection', 'chart', 'searchBar', 'genericBlock', 'customBlock', 'none'][suggestedIndex]}\n`))

      const { blockType } = await inquirer.prompt([{
        type: 'list',
        name: 'blockType',
        message: 'Map to which Payload block type?',
        choices: [
          { name: 'ratesTable - Rates comparison table', value: 'ratesTable' },
          { name: 'faqSection - FAQ section', value: 'faqSection' },
          { name: 'chart - Data visualization chart', value: 'chart' },
          { name: 'searchBar - Zipcode/City search', value: 'searchBar' },
          { name: 'genericBlock - Generic content block (images, etc.)', value: 'genericBlock' },
          { name: 'customBlock - Custom/unique block (specify below)', value: 'customBlock' },
          { name: 'none - No mapping yet (configure later)', value: undefined },
        ],
        default: suggestedIndex,
      }])

      if (blockType === 'customBlock') {
        const { customType } = await inquirer.prompt([{
          type: 'input',
          name: 'customType',
          message: 'Enter custom block type name (camelCase):',
          default: name.charAt(0).toLowerCase() + name.slice(1),
        }])
        payloadBlockType = customType
      } else {
        payloadBlockType = blockType
      }
    }

    // Prompt 4: Implementation status
    console.log(chalk.gray('\n📋 Implementation status determines if migration will fail on this component:'))
    console.log(chalk.gray('   - Implemented: Payload block exists and can render this component'))
    console.log(chalk.gray(`   - Needs work: Block doesn't exist yet (you'll need to create it later)\n`))

    if (!payloadBlockType) {
      console.log(chalk.yellow('⚠️  No block type mapped → Recommend "Needs work"\n'))
    }

    const { status } = await inquirer.prompt([{
      type: 'list',
      name: 'status',
      message: 'What is the implementation status?',
      choices: [
        {
          name: 'Implemented (ready to use) - Payload block exists and works',
          value: 'implemented'
        },
        {
          name: 'Needs work (configure later) - Block doesn\'t exist yet, needs creation',
          value: 'needs-work'
        },
      ],
      default: payloadBlockType ? 0 : 1,
    }])

    // Prompt 5: Should block migration?
    const { blocking } = await inquirer.prompt([{
      type: 'confirm',
      name: 'blocking',
      message: 'Should this component block migration if not configured?',
      default: status === 'needs-work',
    }])

    // Build component config
    const config = {
      status,
      componentType: componentType === 'both' ? 'block' : componentType,
      canRenderBlock,
      canRenderInline,
      payloadBlockType,
      mdxUsageCount: usageCount,
      fields: {},
      todos: status === 'needs-work' ? [
        'Configure component type',
        'Set rendering capabilities',
        'Implement Payload block or inline block',
        'Test with sample MDX',
      ] : [],
      isBlocking: blocking,
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
  const { apply } = await inquirer.prompt([{
    type: 'confirm',
    name: 'apply',
    message: 'Apply these configurations to the component registry?',
    default: true,
  }])

  if (!apply) {
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
function generateComponentCode(name, config) {
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
