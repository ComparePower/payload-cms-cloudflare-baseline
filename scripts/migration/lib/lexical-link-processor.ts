/**
 * Post-processes Lexical JSON to convert markdown link syntax to actual Lexical link nodes
 *
 * Converts: [Link Text](url) → Lexical link node structure
 */

interface LexicalNode {
  type: string
  children?: LexicalNode[]
  text?: string
  [key: string]: any
}

interface LinkNode {
  type: 'link'
  fields: {
    linkType: 'custom'
    url: string
    newTab?: boolean
  }
  children: LexicalNode[]
  format?: string
  indent?: number
  version?: number
}

/**
 * Process Lexical JSON to replace markdown link syntax with actual link nodes
 */
export function processLinks(lexicalJSON: { root: LexicalNode }): { root: LexicalNode } {
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
    // If this is a text node with markdown link syntax, split it
    if (child.type === 'text' && child.text && containsMarkdownLink(child.text)) {
      const processedNodes = splitTextNodeWithLinks(child)

      // Merge standalone whitespace-only text nodes into adjacent nodes
      // Payload filters out whitespace-only nodes during save, so we need to merge them
      for (let i = 0; i < processedNodes.length; i++) {
        const pNode = processedNodes[i]

        // If this is a whitespace-only text node
        if (pNode.type === 'text' && pNode.text && pNode.text.trim() === '') {
          const prevNode = newChildren.length > 0 ? newChildren[newChildren.length - 1] : null
          const nextNode = processedNodes[i + 1]

          // Strategy: Merge space FORWARD into next node (link or text) to avoid Payload trimming trailing spaces
          // Prefer merging into link text over merging into previous text node

          // Try to merge with next node (link's child or text)
          if (nextNode && nextNode.type === 'link' && nextNode.children?.[0]?.type === 'text') {
            nextNode.children[0].text = pNode.text + nextNode.children[0].text
            continue // Skip adding this node
          }
          // Otherwise merge with next text node
          else if (nextNode && nextNode.type === 'text') {
            nextNode.text = pNode.text + nextNode.text
            continue // Skip adding this node
          }
          // Otherwise merge with previous text node
          else if (prevNode && prevNode.type === 'text') {
            // Convert to nbsp to prevent trimming
            const nbsp = pNode.text.replace(/ /g, '\u00A0')
            prevNode.text = prevNode.text + nbsp
            continue // Skip adding this node
          }
          // If can't merge, keep as non-breaking space standalone node
          else {
            const nbsp = pNode.text.replace(/ /g, '\u00A0')
            pNode.text = nbsp
          }
        }

        newChildren.push(pNode)
      }
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
 * Check if text contains markdown link syntax
 */
function containsMarkdownLink(text: string): boolean {
  return /\[([^\]]+)\]\(([^)]+)\)/.test(text)
}

/**
 * Split a text node containing markdown links into text + link + text nodes
 */
function splitTextNodeWithLinks(textNode: LexicalNode): LexicalNode[] {
  const text = textNode.text || ''
  // Regex to match markdown links: [text](url)
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g

  const result: LexicalNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = linkRegex.exec(text)) !== null) {
    const [fullMatch, linkText, url] = match
    const matchIndex = match.index

    // Add text before the link (if any)
    if (matchIndex > lastIndex) {
      const beforeText = text.substring(lastIndex, matchIndex)
      const beforeNode = createTextNode(beforeText, textNode)
      result.push(beforeNode)
    }

    // Add the link node (inherit formatting from original text node)
    const linkNode = createLinkNode(linkText, url, textNode)
    result.push(linkNode)

    lastIndex = matchIndex + fullMatch.length
  }

  // Add remaining text after last link (if any)
  if (lastIndex < text.length) {
    const afterText = text.substring(lastIndex)
    const afterNode = createTextNode(afterText, textNode)
    result.push(afterNode)
  }

  // If no links were found, return original node
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
 * Generate unique ID for link nodes (Payload format)
 */
function generateLinkId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

/**
 * Create a Lexical link node matching Payload's exact structure
 * Inherits formatting (bold, italic, etc.) from the original text node
 */
function createLinkNode(linkText: string, url: string, originalNode: LexicalNode): LinkNode {
  return {
    type: 'link',
    version: 3,
    direction: null,
    format: '',
    indent: 0,
    fields: {
      url: url,
      newTab: false,
      linkType: 'custom',
    },
    id: generateLinkId(),
    children: [
      {
        type: 'text',
        text: linkText,
        detail: originalNode.detail || 0,
        format: originalNode.format || 0, // Inherit bold, italic, etc. from parent
        mode: originalNode.mode || 'normal',
        style: originalNode.style || '',
        version: 1,
      }
    ],
  }
}
