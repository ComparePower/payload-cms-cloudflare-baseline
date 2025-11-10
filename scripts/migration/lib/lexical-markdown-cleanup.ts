/**
 * Cleans up markdown artifacts leftover from conversion
 *
 * Specifically handles escaped brackets and link syntax that remains
 * when inline components appear inside markdown links.
 */

interface LexicalNode {
  type: string
  children?: LexicalNode[]
  text?: string
  [key: string]: any
}

/**
 * Remove escaped markdown syntax and clean up malformed link artifacts
 */
export function cleanupMarkdownArtifacts(lexicalJSON: { root: LexicalNode }): { root: LexicalNode } {
  const result = JSON.parse(JSON.stringify(lexicalJSON)) // Deep clone

  // Walk the tree and clean each node
  walkAndCleanNode(result.root)

  return result
}

/**
 * Recursively walk the Lexical tree and clean nodes
 */
function walkAndCleanNode(node: LexicalNode, insideLink = false): void {
  if (!node.children) return

  const cleanedChildren: LexicalNode[] = []

  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i]

    // If this is a text node with escaped markdown syntax, clean or remove it
    if (child.type === 'text' && child.text) {
      // Don't trim text inside links - it may have intentional leading/trailing spaces
      const cleanedText = insideLink
        ? cleanMarkdownTextNoTrim(child.text)
        : cleanMarkdownText(child.text)

      // Only keep the node if there's text left after cleaning
      if (cleanedText.length > 0) {
        cleanedChildren.push({
          ...child,
          text: cleanedText
        })
      }
      // Otherwise skip this node (don't add to cleanedChildren)
    } else {
      // Keep non-text nodes as-is
      cleanedChildren.push(child)

      // Recurse into children, tracking if we're inside a link
      if (child.children) {
        const isLink = child.type === 'link'
        walkAndCleanNode(child, isLink)
      }
    }
  }

  node.children = cleanedChildren
}

/**
 * Clean escaped markdown syntax from text
 */
function cleanMarkdownText(text: string): string {
  let cleaned = text

  // Remove markdown link artifacts that appear around inline components
  // These are leftover from [text](url) syntax where inline components replaced the text/url
  cleaned = cleaned
    // Remove escaped opening bracket: "\["
    .replace(/\\\[/g, '')
    // Remove escaped closing bracket with link start: "]\(tel:", "]\(mailto:", "]\(http", etc.
    // This handles incomplete link syntax like "]\(tel:" without the closing ")"
    .replace(/\]\\\([^)]*$/g, '')
    // Remove escaped closing bracket with complete link: "]\(...)"
    .replace(/\]\\\([^)]*\)/g, '')
    // Remove standalone escaped closing bracket: "\]"
    .replace(/\\\]/g, '')
    // Remove orphaned closing parentheses from links: standalone ")"
    .replace(/^\s*\)\s*$/g, '')
    // Remove leading/trailing whitespace around cleaned text
    .trim()

  // If the entire text was just markdown artifacts, return empty string
  if (cleaned === '' || /^[\s\\\[\]()]+$/.test(cleaned)) {
    return ''
  }

  return cleaned
}

/**
 * Clean escaped markdown syntax from text WITHOUT trimming
 * Used for text inside links where leading/trailing spaces may be intentional
 */
function cleanMarkdownTextNoTrim(text: string): string {
  let cleaned = text

  // Remove markdown link artifacts (same as cleanMarkdownText but NO .trim())
  cleaned = cleaned
    .replace(/\\\[/g, '')
    .replace(/\]\\\([^)]*$/g, '')
    .replace(/\]\\\([^)]*\)/g, '')
    .replace(/\\\]/g, '')
    .replace(/^\s*\)\s*$/g, '')
    // NO .trim() here!

  // If the entire text was just markdown artifacts (but allow whitespace)
  if (cleaned === '' || /^[\\\[\]()]+$/.test(cleaned)) {
    return ''
  }

  return cleaned
}
