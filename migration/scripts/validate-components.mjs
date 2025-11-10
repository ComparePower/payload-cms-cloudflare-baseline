#!/usr/bin/env node
/**
 * Component Validation Script
 *
 * For each unique component found in MDX files:
 * 1. Locate component file in Astro project
 * 2. Extract TypeScript interface/props
 * 3. Parse all component usages in MDX
 * 4. Validate props against interface
 * 5. Report errors and generate block definitions
 */

import fs from 'fs/promises'
import path from 'path'

const ASTRO_PROJECT = '/Users/brad/_CODE_DEV_PROJECTS/cp-content-site-astro'
const ASTRO_COMPONENTS_DIR = path.join(ASTRO_PROJECT, 'src/components')
const SOURCE_DIR = '/Users/brad/_CODE_DEV_PROJECTS/cp-content-site-astro/src/content/front-end/providers'
const OUTPUT_DIR = '/Users/brad/_CODE_DEV_PROJECTS/cp-cms-payload-cms-mongo/migration/data'
const COMPONENTS_FILE = path.join(OUTPUT_DIR, 'components-found.json')

// Validation results
const validation = {
  totalComponents: 0,
  componentsFound: 0,
  componentsNotFound: 0,
  totalUsages: 0,
  validUsages: 0,
  invalidUsages: 0,
  components: {},
  errors: []
}

/**
 * Find component file in Astro project
 */
async function findComponentFile(componentName) {
  const possibleExtensions = ['.astro', '.tsx', '.ts', '.jsx', '.js']

  // Search in components directory recursively
  async function searchDir(dir) {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true })

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)

        if (entry.isDirectory()) {
          const result = await searchDir(fullPath)
          if (result) return result
        } else if (entry.isFile()) {
          // Check if filename matches (with any extension)
          const basename = path.basename(entry.name, path.extname(entry.name))
          if (basename === componentName) {
            return fullPath
          }
        }
      }
    } catch (error) {
      // Directory might not be readable, skip
    }

    return null
  }

  return await searchDir(ASTRO_COMPONENTS_DIR)
}

/**
 * Extract props interface from component file
 */
async function extractPropsInterface(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8')
    const props = {
      required: [],
      optional: [],
      types: {},
      raw: null
    }

    // Try to find Props interface or type definition
    // Pattern 1: interface Props { ... }
    const interfaceMatch = content.match(/interface\s+Props\s*{([^}]*)}/s)

    // Pattern 2: type Props = { ... }
    const typeMatch = content.match(/type\s+Props\s*=\s*{([^}]*)}/s)

    // Pattern 3: Astro.props or const { ... } = Astro.props
    const astroPropsMatch = content.match(/const\s*{([^}]+)}\s*=\s*Astro\.props/s)

    let propsBlock = null

    if (interfaceMatch) {
      propsBlock = interfaceMatch[1]
      props.raw = `interface Props ${interfaceMatch[0]}`
    } else if (typeMatch) {
      propsBlock = typeMatch[1]
      props.raw = `type Props = ${typeMatch[0]}`
    } else if (astroPropsMatch) {
      propsBlock = astroPropsMatch[1]
      props.raw = `const { ${astroPropsMatch[1]} } = Astro.props`
    }

    if (propsBlock) {
      // Parse each prop line
      const lines = propsBlock.split(/[,\n]/).map(l => l.trim()).filter(Boolean)

      for (const line of lines) {
        // Match: propName?: type or propName: type
        const match = line.match(/^(\w+)(\??):\s*(.+)$/)
        if (match) {
          const [, propName, optional, propType] = match

          if (optional === '?') {
            props.optional.push(propName)
          } else {
            props.required.push(propName)
          }

          props.types[propName] = propType.trim()
        }
      }
    }

    return props
  } catch (error) {
    validation.errors.push({
      type: 'interface_extraction_error',
      file: filePath,
      error: error.message
    })
    return null
  }
}

/**
 * Parse component usage from MDX content
 */
function parseComponentUsages(content, componentName) {
  const usages = []

  // Pattern for self-closing tags: <ComponentName prop1="value1" prop2="value2" />
  const selfClosingRegex = new RegExp(
    `<${componentName}([^/>]*?)/>`,
    'gs'
  )

  // Pattern for opening tags: <ComponentName prop1="value1">
  const openingRegex = new RegExp(
    `<${componentName}([^>]*?)>`,
    'gs'
  )

  // Find all matches
  let match

  // Self-closing tags
  while ((match = selfClosingRegex.exec(content)) !== null) {
    const propsString = match[1].trim()
    const props = parsePropsString(propsString)

    usages.push({
      type: 'self-closing',
      propsString,
      props,
      fullMatch: match[0],
      position: match.index
    })
  }

  // Opening tags
  while ((match = openingRegex.exec(content)) !== null) {
    const propsString = match[1].trim()
    const props = parsePropsString(propsString)

    usages.push({
      type: 'opening-tag',
      propsString,
      props,
      fullMatch: match[0],
      position: match.index
    })
  }

  return usages
}

/**
 * Parse props string into object
 * Handles: prop="value", prop={value}, prop={true}, prop
 */
function parsePropsString(propsString) {
  const props = {}

  if (!propsString) return props

  // Match prop="value" or prop='value' or prop={value} or standalone prop
  const propRegex = /(\w+)(?:=(?:"([^"]*)"|'([^']*)'|{([^}]*)})|(?=\s|$))/g

  let match
  while ((match = propRegex.exec(propsString)) !== null) {
    const propName = match[1]
    const doubleQuoteValue = match[2]
    const singleQuoteValue = match[3]
    const braceValue = match[4]

    if (doubleQuoteValue !== undefined) {
      props[propName] = { value: doubleQuoteValue, type: 'string' }
    } else if (singleQuoteValue !== undefined) {
      props[propName] = { value: singleQuoteValue, type: 'string' }
    } else if (braceValue !== undefined) {
      // Try to infer type from braced value
      const trimmed = braceValue.trim()
      if (trimmed === 'true' || trimmed === 'false') {
        props[propName] = { value: trimmed === 'true', type: 'boolean' }
      } else if (!isNaN(trimmed)) {
        props[propName] = { value: Number(trimmed), type: 'number' }
      } else {
        props[propName] = { value: braceValue, type: 'expression' }
      }
    } else {
      // Standalone prop (boolean true)
      props[propName] = { value: true, type: 'boolean' }
    }
  }

  return props
}

/**
 * Validate usage against interface
 */
function validateUsage(usage, propsInterface, componentName, filePath) {
  const errors = []

  if (!propsInterface) {
    errors.push({
      severity: 'warning',
      message: 'No props interface found - cannot validate',
      usage: usage.fullMatch
    })
    return errors
  }

  // Check for required props
  for (const requiredProp of propsInterface.required) {
    if (!(requiredProp in usage.props)) {
      errors.push({
        severity: 'error',
        message: `Missing required prop: ${requiredProp}`,
        expected: propsInterface.types[requiredProp],
        usage: usage.fullMatch,
        file: filePath
      })
    }
  }

  // Check for invalid props (props not in interface)
  const allValidProps = [...propsInterface.required, ...propsInterface.optional]
  for (const propName in usage.props) {
    if (!allValidProps.includes(propName)) {
      errors.push({
        severity: 'warning',
        message: `Unknown prop: ${propName}`,
        value: usage.props[propName],
        usage: usage.fullMatch,
        file: filePath
      })
    }
  }

  // Type checking (basic)
  for (const propName in usage.props) {
    const expectedType = propsInterface.types[propName]
    const actualValue = usage.props[propName]

    if (expectedType && actualValue) {
      // Basic type checking
      if (expectedType === 'string' && actualValue.type !== 'string') {
        errors.push({
          severity: 'warning',
          message: `Type mismatch for prop: ${propName}`,
          expected: 'string',
          actual: actualValue.type,
          usage: usage.fullMatch,
          file: filePath
        })
      } else if (expectedType === 'number' && actualValue.type !== 'number') {
        errors.push({
          severity: 'warning',
          message: `Type mismatch for prop: ${propName}`,
          expected: 'number',
          actual: actualValue.type,
          usage: usage.fullMatch,
          file: filePath
        })
      } else if (expectedType === 'boolean' && actualValue.type !== 'boolean') {
        errors.push({
          severity: 'warning',
          message: `Type mismatch for prop: ${propName}`,
          expected: 'boolean',
          actual: actualValue.type,
          usage: usage.fullMatch,
          file: filePath
        })
      }
    }
  }

  return errors
}

/**
 * Find all MDX files and extract component usages
 */
async function findAllUsages(componentName) {
  const usages = []

  async function searchDir(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)

      if (entry.isDirectory()) {
        await searchDir(fullPath)
      } else if (entry.isFile() && entry.name.endsWith('.mdx')) {
        try {
          const content = await fs.readFile(fullPath, 'utf-8')
          const fileUsages = parseComponentUsages(content, componentName)

          for (const usage of fileUsages) {
            usages.push({
              ...usage,
              file: path.relative(SOURCE_DIR, fullPath)
            })
          }
        } catch (error) {
          validation.errors.push({
            type: 'mdx_read_error',
            file: fullPath,
            error: error.message
          })
        }
      }
    }
  }

  await searchDir(SOURCE_DIR)
  return usages
}

/**
 * Validate a single component
 */
async function validateComponent(componentName) {
  console.log(`\n🔍 Validating: ${componentName}`)

  const result = {
    name: componentName,
    found: false,
    filePath: null,
    propsInterface: null,
    usages: [],
    errors: [],
    validUsages: 0,
    invalidUsages: 0
  }

  // Step 1: Find component file
  const componentFile = await findComponentFile(componentName)

  if (!componentFile) {
    console.log(`  ❌ Component file not found`)
    result.errors.push({
      severity: 'error',
      message: `Component file not found in ${ASTRO_COMPONENTS_DIR}`
    })
    validation.componentsNotFound++
    return result
  }

  console.log(`  ✓ Found: ${path.relative(ASTRO_PROJECT, componentFile)}`)
  result.found = true
  result.filePath = path.relative(ASTRO_PROJECT, componentFile)
  validation.componentsFound++

  // Step 2: Extract props interface
  const propsInterface = await extractPropsInterface(componentFile)
  result.propsInterface = propsInterface

  if (propsInterface && (propsInterface.required.length > 0 || propsInterface.optional.length > 0)) {
    console.log(`  ✓ Props: ${propsInterface.required.length} required, ${propsInterface.optional.length} optional`)
  } else {
    console.log(`  ⚠ No props interface found`)
  }

  // Step 3: Find all usages
  const usages = await findAllUsages(componentName)
  console.log(`  ✓ Found ${usages.length} usage(s)`)
  validation.totalUsages += usages.length

  // Step 4: Validate each usage
  for (const usage of usages) {
    const usageErrors = validateUsage(usage, propsInterface, componentName, usage.file)

    if (usageErrors.length > 0) {
      result.errors.push(...usageErrors)
      result.invalidUsages++
      validation.invalidUsages++
    } else {
      result.validUsages++
      validation.validUsages++
    }

    result.usages.push({
      file: usage.file,
      props: usage.props,
      fullMatch: usage.fullMatch,
      errors: usageErrors
    })
  }

  if (result.errors.length > 0) {
    console.log(`  ⚠ ${result.errors.length} validation error(s)`)
  } else {
    console.log(`  ✅ All usages valid`)
  }

  return result
}

/**
 * Main validation function
 */
async function validate() {
  console.log('🔍 Starting Component Validation...\n')

  // Load components list
  const componentsData = JSON.parse(await fs.readFile(COMPONENTS_FILE, 'utf-8'))
  const components = componentsData.components || []

  validation.totalComponents = components.length
  console.log(`Found ${components.length} unique components to validate\n`)

  // Validate each component
  for (const componentName of components) {
    // Skip text replacement patterns
    if (componentName.startsWith('%') && componentName.endsWith('%')) {
      console.log(`\n⏭️  Skipping text pattern: ${componentName}`)
      continue
    }

    const result = await validateComponent(componentName)
    validation.components[componentName] = result
  }

  // Generate summary
  console.log('\n\n📊 Validation Summary\n')
  console.log(`Total Components: ${validation.totalComponents}`)
  console.log(`Components Found: ${validation.componentsFound}`)
  console.log(`Components Not Found: ${validation.componentsNotFound}`)
  console.log(`Total Usages: ${validation.totalUsages}`)
  console.log(`Valid Usages: ${validation.validUsages}`)
  console.log(`Invalid Usages: ${validation.invalidUsages}`)
  console.log(`Parse Errors: ${validation.errors.length}`)

  // Count errors by severity
  let errorCount = 0
  let warningCount = 0

  for (const componentName in validation.components) {
    const component = validation.components[componentName]
    for (const error of component.errors) {
      if (error.severity === 'error') errorCount++
      else warningCount++
    }
  }

  console.log(`\nErrors: ${errorCount}`)
  console.log(`Warnings: ${warningCount}`)

  // Save results
  await fs.writeFile(
    path.join(OUTPUT_DIR, 'component-validation.json'),
    JSON.stringify(validation, null, 2)
  )

  // Generate component props file (for Payload block creation)
  const componentProps = {}
  for (const componentName in validation.components) {
    const component = validation.components[componentName]
    if (component.found && component.propsInterface) {
      componentProps[componentName] = component.propsInterface
    }
  }

  await fs.writeFile(
    path.join(OUTPUT_DIR, 'component-props.json'),
    JSON.stringify(componentProps, null, 2)
  )

  console.log('\n📝 Results saved to:')
  console.log(`  - ${OUTPUT_DIR}/component-validation.json`)
  console.log(`  - ${OUTPUT_DIR}/component-props.json`)

  // Show critical errors
  if (errorCount > 0) {
    console.log('\n\n⚠️  CRITICAL ERRORS FOUND:\n')

    for (const componentName in validation.components) {
      const component = validation.components[componentName]
      const criticalErrors = component.errors.filter(e => e.severity === 'error')

      if (criticalErrors.length > 0) {
        console.log(`${componentName}:`)
        for (const error of criticalErrors) {
          console.log(`  - ${error.message}`)
          if (error.file) console.log(`    File: ${error.file}`)
        }
        console.log()
      }
    }
  }

  console.log('\n✅ Validation complete!')
}

// Run validation
validate().catch(console.error)
