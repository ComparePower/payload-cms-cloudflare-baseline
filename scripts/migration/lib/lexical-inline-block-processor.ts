/**
 * Post-processes Lexical JSON to convert inline component placeholders
 * into actual Lexical inline block nodes
 *
 * The placeholder format is: {{INLINE_COMPONENT:ComponentName:{"prop":"value"}}}
 */

interface LexicalNode {
  type: string
  children?: LexicalNode[]
  text?: string
  [key: string]: any
}

interface InlineBlockNode {
  type: 'inlineBlock'
  fields: {
    blockType: string
    [key: string]: any
  }
}

/**
 * Process Lexical JSON to replace inline component placeholders with actual inline block nodes
 */
export function processInlineBlocks(lexicalJSON: { root: LexicalNode }): { root: LexicalNode } {
  const result = JSON.parse(JSON.stringify(lexicalJSON)) // Deep clone

  // Walk the tree and process each node
  walkAndProcessNode(result.root)

  return result
}

/**
 * Recursively walk the Lexical tree and process nodes
 */
function walkAndProcessNode(node: LexicalNode): void {
  if (!node.children) return

  const newChildren: LexicalNode[] = []

  for (const child of node.children) {
    // If this is a text node with a placeholder, split it
    // Check for both escaped and unescaped versions
    if (child.type === 'text' && child.text && (child.text.includes('{{INLINE_COMPONENT:') || child.text.includes('{{INLINE\\_COMPONENT:'))) {
      const processedNodes = splitTextNodeWithPlaceholders(child)
      newChildren.push(...processedNodes)
    } else {
      // Keep the node as-is
      newChildren.push(child)

      // Recurse into children
      if (child.children) {
        walkAndProcessNode(child)
      }
    }
  }

  node.children = newChildren
}

/**
 * Split a text node containing placeholders into text + inline block + text nodes
 */
function splitTextNodeWithPlaceholders(textNode: LexicalNode): LexicalNode[] {
  const text = textNode.text || ''
  // Handle both escaped and unescaped underscores (markdown stringifiers escape underscores)
  // Match either {{INLINE_COMPONENT: or {{INLINE\_COMPONENT:
  const placeholderRegex = /\{\{INLINE(?:_|\\_)COMPONENT:([^:]+):(\{[^}]*\})\}\}/g

  const result: LexicalNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = placeholderRegex.exec(text)) !== null) {
    const [fullMatch, componentName, propsJSON] = match
    const matchIndex = match.index

    // Add text before the placeholder (if any)
    if (matchIndex > lastIndex) {
      const beforeText = text.substring(lastIndex, matchIndex)
      result.push(createTextNode(beforeText, textNode))
    }

    // Add the inline block node
    const props = JSON.parse(propsJSON)
    result.push(createInlineBlockNode(componentName, props))

    lastIndex = matchIndex + fullMatch.length
  }

  // Add remaining text after last placeholder (if any)
  if (lastIndex < text.length) {
    const afterText = text.substring(lastIndex)
    result.push(createTextNode(afterText, textNode))
  }

  // If no placeholders were found, return original node
  if (result.length === 0) {
    return [textNode]
  }

  return result
}

/**
 * Create a text node with the same formatting as the original
 */
function createTextNode(text: string, originalNode: LexicalNode): LexicalNode {
  return {
    type: 'text',
    text,
    detail: originalNode.detail || 0,
    format: originalNode.format || 0,
    mode: originalNode.mode || 'normal',
    style: originalNode.style || '',
    version: originalNode.version || 1,
  }
}

/**
 * Create an inline block node
 */
function createInlineBlockNode(componentName: string, props: Record<string, any>): InlineBlockNode {
  // Map phone number components to RichTextDataInstance slugs
  const phoneComponentToSlug: Record<string, string> = {
    'AmigoPhoneNumber': 'amigo-phone',
    'CirroEnergyPhoneNumber': 'cirro-phone',
    'ConstellationPhoneNumber': 'constellation-phone',
    'DirectEnergyPhoneNumber': 'direct-energy-phone',
    'DiscountPowerPhoneNumber': 'discount-power-phone',
    'FlagshipPhoneNumber': 'flagship-phone',
    'FourChangePhoneNumber': '4change-phone',
    'FrontierPhoneNumber': 'frontier-phone',
    'FrontierPhoneNumberLinkRc': 'frontier-phone-rc',
    'GexaPhoneNumber': 'gexa-phone',
    'GreenMountainPhoneNumber': 'green-mountain-phone',
    'JustPhoneNumber': 'just-phone',
    'NewPowerPhoneNumber': 'new-power-phone',
    'PaylessPowerPhoneNumber': 'payless-power-phone',
    'PulsePowerPhoneNumber': 'pulse-power-phone',
    'ReliantPhoneNumber': 'reliant-phone',
    'RhythmEnergyPhone': 'rhythm-phone',
    'TaraEnergyPhoneNumber': 'tara-phone',
    'TxuPhoneNumber': 'txu-phone',
  }

  // Map other dynamic data components to slugs
  const dynamicDataComponentToSlug: Record<string, string> = {
    'AvgTexasResidentialRate': 'avg-tx-residential-rate',
    'ComparepowerReviewCount': 'comparepower-review-count',
  }

  // Check if this is AssetManager - convert to Lexical upload (inline image) node
  if (componentName === 'AssetManager') {
    return {
      type: 'upload',
      version: 1,
      relationTo: 'media',
      value: {
        _assetId: props.id, // Temporary - will be resolved to actual media ID during import
      },
      fields: {
        alt: props.alt || '',
      },
    }
  }

  // Check if this is a phone number component
  if (phoneComponentToSlug[componentName]) {
    return {
      type: 'inlineBlock',
      version: 1,
      fields: {
        blockType: 'dynamicDataInstanceSimple',
        category: 'phone',
        _richTextDataSlug: phoneComponentToSlug[componentName], // Temporary slug - will be resolved to ID during seeding
        enablePhoneLink: true,
      },
    }
  }

  // Check if this is another dynamic data component
  if (dynamicDataComponentToSlug[componentName]) {
    const category = componentName === 'AvgTexasResidentialRate' ? 'other' : 'other'
    return {
      type: 'inlineBlock',
      version: 1,
      fields: {
        blockType: 'dynamicDataInstanceSimple',
        category,
        _richTextDataSlug: dynamicDataComponentToSlug[componentName], // Temporary slug - will be resolved to ID during seeding
        enablePhoneLink: false,
      },
    }
  }

  // Map component names to block types (for other inline components)
  const blockTypeMap: Record<string, string> = {
    'CurrentYear': 'currentYear',
    'CurrentMonth': 'currentMonth',
    'YearsSince': 'yearsSince',
    'DynamicDataInstance': 'dynamicDataInstance',
    'DynamicDataInstanceInline': 'dynamicDataInstanceInline',
    'DynamicDataInstanceSimple': 'dynamicDataInstanceSimple',
    'LowestRateDisplay': 'lowestRateDisplay',
  }

  // Convert component name to camelCase if not in map (fallback)
  const blockType = blockTypeMap[componentName] ||
    (componentName.charAt(0).toLowerCase() + componentName.slice(1))

  // Add default values for LowestRateDisplay checkbox fields
  const fields: Record<string, any> = {
    blockType,
    ...props,
  }

  if (blockType === 'lowestRateDisplay') {
    // Ensure all fields have values, including checkboxes with defaults
    if (!('withoutCta' in fields)) {
      fields.withoutCta = false
    }
    if (!('onlyPrice' in fields)) {
      fields.onlyPrice = false
    }
  }

  return {
    type: 'inlineBlock',
    version: 1,
    fields,
  }
}
