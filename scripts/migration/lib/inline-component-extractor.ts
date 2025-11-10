/**
 * Inline Component Extractor
 *
 * Task: T009
 *
 * Detects mdxJsxTextElement nodes in MDX paragraphs and extracts them
 * as inline block placeholders. These placeholders are later converted
 * to Lexical inline block nodes.
 *
 * Handles phone number components and dynamic data components that
 * appear inline within text (not as separate blocks).
 */

import { visit } from 'unist-util-visit'
import type { Root, Content } from 'mdast'
import type { LexicalRoot, LexicalNode } from './mdx-to-lexical-converter'

export interface InlineComponent {
  /** Component name (e.g., 'FourChangePhoneNumber') */
  name: string
  /** Component props */
  props: Record<string, any>
  /** Position in original AST */
  position?: {
    start: { line: number; column: number }
    end: { line: number; column: number }
  }
}

export interface ExtractedInlineComponents {
  /** Updated Lexical JSON with inline block nodes */
  lexicalJSON: LexicalRoot
  /** List of extracted components */
  components: InlineComponent[]
}

/**
 * List of supported inline components
 *
 * These components can appear within paragraphs and will be converted
 * to inline block nodes in Lexical.
 */
const SUPPORTED_INLINE_COMPONENTS = [
  // Phone number components
  'AmigoPhoneNumber',
  'CirroEnergyPhoneNumber',
  'ConstellationPhoneNumber',
  'DirectEnergyPhoneNumber',
  'DiscountPowerPhoneNumber',
  'FlagshipPhoneNumber',
  'FourChangePhoneNumber',
  '4ChangePhoneNumber',
  'FrontierPhoneNumber',
  'FrontierPhoneNumberLinkRc',
  'GexaPhoneNumber',
  'GreenMountainPhoneNumber',
  'JustPhoneNumber',
  'NewPowerPhoneNumber',
  'PaylessPowerPhoneNumber',
  'PulsePowerPhoneNumber',
  'ReliantPhoneNumber',
  'RhythmEnergyPhone',
  'RhythmPhoneNumber',
  'TaraEnergyPhoneNumber',
  'TxuPhoneNumber',
  'TXUPhoneNumber',

  // Dynamic data components (inline)
  'AvgTexasResidentialRate',
  'ComparepowerReviewCount',
  'CurrentYear',
  'CurrentYearDirect',
  'CurrentMonth',
  'YearsSince',
  'LowestRateDisplay'
]

/**
 * Check if component name is supported as inline block
 */
export function isSupportedInlineComponent(componentName: string): boolean {
  return SUPPORTED_INLINE_COMPONENTS.includes(componentName)
}

/**
 * Extract inline components from Lexical JSON
 *
 * Searches for inline component placeholders ({{INLINE_COMPONENT:name:props}})
 * and converts them to proper Lexical inline block nodes.
 *
 * @param lexicalJSON - Lexical JSON structure
 * @returns Updated Lexical JSON and list of extracted components
 *
 * @example
 * const lexical = await convertMdxToLexical(content)
 * const { lexicalJSON, components } = extractInlineComponents(lexical)
 * console.log(`Found ${components.length} inline components`)
 */
export function extractInlineComponents(lexicalJSON: LexicalRoot): ExtractedInlineComponents {
  const components: InlineComponent[] = []

  // Deep clone to avoid mutation
  const updatedJSON = JSON.parse(JSON.stringify(lexicalJSON))

  // Recursively process all nodes
  processNode(updatedJSON.root, components)

  return {
    lexicalJSON: updatedJSON,
    components
  }
}

/**
 * Recursively process Lexical node tree to find and convert inline component placeholders
 */
function processNode(node: LexicalNode, components: InlineComponent[]): void {
  if (!node) return

  // Process children array
  if (node.children && Array.isArray(node.children)) {
    const newChildren: LexicalNode[] = []

    for (const child of node.children) {
      // Check if this is a text node with inline component placeholder
      if (child.type === 'text' && child.text) {
        const converted = convertTextWithInlineComponents(child.text, components)
        newChildren.push(...converted)
      } else {
        // Recursively process child
        processNode(child, components)
        newChildren.push(child)
      }
    }

    node.children = newChildren
  }
}

/**
 * Convert text containing inline component placeholders to array of text and inline block nodes
 *
 * Placeholder format: {{INLINE_COMPONENT:ComponentName:{"prop":"value"}}}
 */
function convertTextWithInlineComponents(text: string, components: InlineComponent[]): LexicalNode[] {
  const nodes: LexicalNode[] = []

  // Regex to match inline component placeholders
  const placeholderRegex = /\{\{INLINE_COMPONENT:([^:]+):(\{[^}]*\})\}\}/g

  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = placeholderRegex.exec(text)) !== null) {
    const [fullMatch, componentName, propsJson] = match
    const matchIndex = match.index

    // Add text before the component
    if (matchIndex > lastIndex) {
      const textBefore = text.substring(lastIndex, matchIndex)
      if (textBefore) {
        nodes.push(createTextNode(textBefore))
      }
    }

    // Parse props
    let props: Record<string, any> = {}
    try {
      props = JSON.parse(propsJson)
    } catch (e) {
      console.error(`Failed to parse inline component props: ${propsJson}`, e)
    }

    // Track component
    components.push({
      name: componentName,
      props
    })

    // Add inline block node
    if (isSupportedInlineComponent(componentName)) {
      nodes.push(createInlineBlockNode(componentName, props))
    } else {
      // Unsupported component - add as plain text placeholder
      nodes.push(createTextNode(`[${componentName}]`))
    }

    lastIndex = matchIndex + fullMatch.length
  }

  // Add any remaining text after the last component
  if (lastIndex < text.length) {
    const textAfter = text.substring(lastIndex)
    if (textAfter) {
      nodes.push(createTextNode(textAfter))
    }
  }

  // If no components were found, return original text as single node
  if (nodes.length === 0) {
    return [createTextNode(text)]
  }

  return nodes
}

/**
 * Create Lexical text node
 */
function createTextNode(text: string): LexicalNode {
  return {
    type: 'text',
    text,
    format: 0,
    mode: 'normal',
    style: '',
    detail: 0,
    version: 1
  }
}

/**
 * Create Lexical inline block node
 *
 * Inline blocks are represented as 'block' type nodes with fields
 * containing the component name and props.
 */
function createInlineBlockNode(componentName: string, props: Record<string, any>): LexicalNode {
  // Normalize component name to camelCase for block slug
  const blockSlug = componentName.charAt(0).toLowerCase() + componentName.slice(1)

  return {
    type: 'block',
    format: '',
    version: 1,
    fields: {
      blockType: blockSlug,
      ...props,
      id: generateId()
    }
  }
}

/**
 * Generate unique ID for inline blocks
 */
function generateId(): string {
  return Math.random().toString(36).substring(2, 15)
}

/**
 * Extract inline components from markdown AST (before Lexical conversion)
 *
 * This can be used to analyze components before conversion.
 *
 * @param ast - Markdown AST from remark parser
 * @returns List of inline components found
 */
export function extractInlineComponentsFromAST(ast: Root): InlineComponent[] {
  const components: InlineComponent[] = []

  visit(ast, 'mdxJsxTextElement', (node: any) => {
    const componentName = node.name
    if (!componentName) return

    // Extract props
    const props: Record<string, any> = {}
    if (node.attributes && Array.isArray(node.attributes)) {
      for (const attr of node.attributes) {
        if (attr.type === 'mdxJsxAttribute') {
          props[attr.name] = extractPropValue(attr.value)
        }
      }
    }

    components.push({
      name: componentName,
      props,
      position: node.position
    })
  })

  return components
}

/**
 * Extract prop value from MDX attribute
 */
function extractPropValue(attrValue: any): any {
  if (!attrValue) return true // Boolean prop

  if (typeof attrValue === 'string') return attrValue

  if (attrValue.type === 'mdxJsxAttributeValueExpression') {
    const value = attrValue.value

    // Try to parse as JSON
    try {
      if (value.startsWith('[') || value.startsWith('{')) {
        return JSON.parse(value.replace(/'/g, '"'))
      }
    } catch (e) {
      // Fall through
    }

    // Try to parse as number
    const num = Number(value)
    if (!isNaN(num)) return num

    // Try to parse as boolean
    if (value === 'true') return true
    if (value === 'false') return false

    return value
  }

  return attrValue
}
