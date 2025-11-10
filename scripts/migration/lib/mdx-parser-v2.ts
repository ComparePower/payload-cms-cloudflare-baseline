/**
 * MDX Parser Utility (v2 - using unified/remark)
 *
 * Parses MDX files to extract JSX component usage using the proper AST
 */

import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkMdx from 'remark-mdx'
import { visit } from 'unist-util-visit'
import type { Root } from 'mdast'
import type { ComponentUsage, ComponentProp, ParsedMdxFile } from './types'

/**
 * Extract prop value and infer its type from an MDX JSX attribute
 */
function extractPropInfo(attrName: string, attrValue: any): ComponentProp {
  // Boolean prop (no value, just presence)
  if (attrValue === null || attrValue === undefined) {
    return {
      name: attrName,
      value: 'true',
      type: 'boolean',
    }
  }

  // String literal
  if (typeof attrValue === 'string') {
    return {
      name: attrName,
      value: attrValue,
      type: 'string',
    }
  }

  // Check if it's an MDX attribute value expression
  if (attrValue && typeof attrValue === 'object') {
    if (attrValue.type === 'mdxJsxAttributeValueExpression') {
      // Get the raw expression value
      const expressionValue = attrValue.value || ''

      // Try to infer type from the expression syntax
      const trimmed = expressionValue.trim()

      // Array: starts with [
      if (trimmed.startsWith('[')) {
        return {
          name: attrName,
          value: expressionValue,
          type: 'array',
        }
      }

      // Object: starts with {
      if (trimmed.startsWith('{')) {
        return {
          name: attrName,
          value: expressionValue,
          type: 'object',
        }
      }

      // Boolean literals
      if (trimmed === 'true' || trimmed === 'false') {
        return {
          name: attrName,
          value: trimmed,
          type: 'boolean',
        }
      }

      // Number literals
      if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
        return {
          name: attrName,
          value: trimmed,
          type: 'number',
        }
      }

      // String literals (quoted)
      if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
          (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
        return {
          name: attrName,
          value: trimmed.slice(1, -1),
          type: 'string',
        }
      }

      // Otherwise it's an expression (variable reference, function call, etc.)
      return {
        name: attrName,
        value: expressionValue,
        type: 'expression',
      }
    }

    // Check for simple value property
    if ('value' in attrValue) {
      return {
        name: attrName,
        value: String(attrValue.value),
        type: typeof attrValue.value === 'number' ? 'number' : 'string',
      }
    }
  }

  // Fallback
  return {
    name: attrName,
    value: String(attrValue),
    type: 'unknown',
  }
}

/**
 * Parse MDX content and extract component usage
 */
export async function parseMdxContent(content: string, filePath: string): Promise<ParsedMdxFile> {
  const components: ComponentUsage[] = []
  const errors: string[] = []

  try {
    // Parse MDX content to AST using unified
    const processor = unified()
      .use(remarkParse)
      .use(remarkMdx)

    const tree = processor.parse(content) as Root

    // Visit all JSX elements in the AST
    visit(tree, 'mdxJsxFlowElement', (node: any) => {
      const componentName = node.name

      // Skip if no component name
      if (!componentName || typeof componentName !== 'string') return

      // Extract props
      const props: ComponentProp[] = []
      if (node.attributes && Array.isArray(node.attributes)) {
        for (const attr of node.attributes) {
          if (attr.type === 'mdxJsxAttribute' && attr.name) {
            const propInfo = extractPropInfo(attr.name, attr.value)
            props.push(propInfo)
          }
        }
      }

      // Check if component has children
      const hasChildren = node.children && node.children.length > 0

      // Get line number
      const lineNumber = node.position?.start?.line || 0

      components.push({
        component: componentName,
        props,
        lineNumber,
        hasChildren,
      })
    })

    // Also check for inline JSX elements (mdxJsxTextElement)
    visit(tree, 'mdxJsxTextElement', (node: any) => {
      const componentName = node.name
      if (!componentName || typeof componentName !== 'string') return

      const props: ComponentProp[] = []
      if (node.attributes && Array.isArray(node.attributes)) {
        for (const attr of node.attributes) {
          if (attr.type === 'mdxJsxAttribute' && attr.name) {
            const propInfo = extractPropInfo(attr.name, attr.value)
            props.push(propInfo)
          }
        }
      }

      const hasChildren = node.children && node.children.length > 0
      const lineNumber = node.position?.start?.line || 0

      components.push({
        component: componentName,
        props,
        lineNumber,
        hasChildren,
      })
    })
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error))
  }

  // Calculate statistics
  const uniqueComponents = [...new Set(components.map(c => c.component))].sort()

  return {
    filePath,
    components,
    componentCount: components.length,
    uniqueComponents,
    errors,
  }
}

/**
 * Parse a single MDX file from disk
 */
export async function parseMdxFile(filePath: string): Promise<ParsedMdxFile> {
  const fs = await import('fs/promises')

  try {
    const content = await fs.readFile(filePath, 'utf-8')
    return await parseMdxContent(content, filePath)
  } catch (error) {
    return {
      filePath,
      components: [],
      componentCount: 0,
      uniqueComponents: [],
      errors: [error instanceof Error ? error.message : String(error)],
    }
  }
}
