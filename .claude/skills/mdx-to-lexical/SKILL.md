---
name: mdx-to-lexical
description: Convert Astro MDX content to Payload Lexical JSON format, including frontmatter parsing, component extraction, inline block resolution, and relationship linking. Use when converting MDX files, transforming markdown content, processing Astro components, generating Lexical JSON, migrating rich text from Keystatic to Payload, resolving data instance references, or mapping MDX components to Payload blocks.
allowed-tools: Read, Write, Bash
---

# MDX to Lexical Conversion Skill

Convert Astro MDX files to Payload Lexical JSON format with full component mapping and inline block resolution.

## What This Skill Does

This skill handles the complete conversion pipeline from MDX source files to valid Payload Lexical JSON:
- Parse MDX files with YAML frontmatter
- Convert Markdown AST to Lexical nodes
- Extract inline components (phone numbers, dynamic data)
- Map components to Payload inline blocks
- Resolve data instance slugs to database IDs
- Validate Lexical JSON structure

## When to Use This Skill

Use this skill when:
- Converting MDX files to Lexical JSON
- Migrating content from Astro/Keystatic to Payload
- Transforming Markdown to Lexical format
- Processing Astro components
- Resolving inline block references
- Validating Lexical JSON structure

## Input/Output Contract

### Input
```typescript
interface ConversionInput {
  mdxFilePath: string              // Path to .mdx file
  frontmatter: Record<string, any>  // Parsed YAML frontmatter
  content: string                   // MDX content string
  dataInstanceMap: Map<string, string>  // slug → ID mapping
}
```

### Output
```typescript
interface ConversionOutput {
  lexicalJSON: SerializedEditorState  // Valid Lexical JSON
  inlineBlocks: InlineBlockReference[]  // Extracted components
  errors: ValidationError[]           // Conversion errors (if any)
  warnings: string[]                  // Non-critical issues
}
```

## Conversion Pipeline

### Phase 1: Parse MDX

**Tools**: `unified`, `remark-parse`, `remark-mdx`

**Process**:
```typescript
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkMdx from 'remark-mdx'

const ast = unified()
  .use(remarkParse)
  .use(remarkMdx)
  .parse(content)
```

**Output**: MDX AST (Abstract Syntax Tree)

**Validation**:
- [ ] No parse errors
- [ ] All frontmatter extracted
- [ ] Components identified

### Phase 2: Convert Markdown Nodes

**Node Mappings**:

| Markdown Node | Lexical Node |
|---------------|--------------|
| heading | `{ type: 'heading', tag: 'h1-h6', children: [...] }` |
| paragraph | `{ type: 'paragraph', children: [...] }` |
| text | `{ type: 'text', text: '...', format: 0 }` |
| strong | text with `format: 1` (bold) |
| emphasis | text with `format: 2` (italic) |
| link | `{ type: 'link', url: '...', children: [...] }` |
| list | `{ type: 'list', listType: 'bullet/number', children: [...] }` |
| listItem | `{ type: 'listitem', children: [...] }` |

**Code Example**:
```typescript
function convertNode(mdNode: MdastNode): LexicalNode {
  switch (mdNode.type) {
    case 'heading':
      return {
        type: 'heading',
        tag: `h${mdNode.depth}`,
        children: mdNode.children.map(convertNode),
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1
      }

    case 'paragraph':
      return {
        type: 'paragraph',
        children: mdNode.children.map(convertNode),
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1
      }

    case 'text':
      return {
        type: 'text',
        text: mdNode.value,
        format: 0,
        mode: 'normal',
        style: '',
        detail: 0,
        version: 1
      }

    // ... more node types
  }
}
```

**Validation**:
- [ ] All Markdown nodes converted
- [ ] Node structure valid
- [ ] No missing children

### Phase 3: Extract Inline Components

**Component Detection**:

Look for JSX-style components in MDX:
```mdx
Call us at <FourChangePhoneNumber /> for assistance.
The lowest rate is <LowestRateDisplay rateType="12month" />.
As of <CurrentYearDirect />, we serve Texas customers.
```

**Extraction Logic**:
```typescript
function extractInlineComponents(paragraph: MdastParagraph): {
  nodes: LexicalNode[]
  components: ComponentReference[]
} {
  const nodes: LexicalNode[] = []
  const components: ComponentReference[] = []

  for (const child of paragraph.children) {
    if (child.type === 'mdxJsxTextElement') {
      // Found inline component
      const componentName = child.name
      const props = extractProps(child.attributes)

      components.push({
        name: componentName,
        props,
        slug: mapComponentToSlug(componentName)
      })

      // Replace with inline block placeholder
      nodes.push({
        type: 'inlineBlock',
        fields: {
          blockType: mapComponentToBlockType(componentName),
          dataInstanceSlug: mapComponentToSlug(componentName)
        }
      })
    } else {
      // Regular text node
      nodes.push(convertNode(child))
    }
  }

  return { nodes, components }
}
```

**Component Mapping Table**:

| Astro Component | Block Type | Data Instance Slug |
|-----------------|------------|-------------------|
| `<FourChangePhoneNumber />` | `providerPhone` | `4change-phone` |
| `<AmigoPhoneNumber />` | `providerPhone` | `amigo-phone` |
| `<LowestRateDisplay />` | `lowestRate` | `lowest-rate-display` |
| `<CurrentYearDirect />` | `currentYear` | `current-year-direct` |
| `<ComparepowerReviewCount />` | `reviewCount` | `comparepower-review-count` |
| `<AvgTexasResidentialRate />` | `avgRate` | `avg-texas-residential-rate` |

**Validation**:
- [ ] All components detected
- [ ] Components mapped to block types
- [ ] Slugs generated correctly

### Phase 4: Resolve Data Instance References

**Problem**: Inline blocks reference `RichTextDataInstances` by slug, but Payload needs IDs.

**Solution**: Query database for slug → ID mapping

**Code Example**:
```typescript
async function resolveDataInstanceSlugs(
  lexicalJSON: SerializedEditorState,
  payload: Payload
): Promise<SerializedEditorState> {
  // Collect all slugs
  const slugs = new Set<string>()
  traverseNodes(lexicalJSON.root, (node) => {
    if (node.type === 'inlineBlock') {
      slugs.add(node.fields.dataInstanceSlug)
    }
  })

  // Query database for IDs
  const { docs } = await payload.find({
    collection: 'richTextDataInstances',
    where: {
      slug: { in: Array.from(slugs) }
    },
    limit: 1000
  })

  // Create slug → ID map
  const slugToId = new Map(
    docs.map(doc => [doc.slug, doc.id])
  )

  // Replace slugs with IDs
  traverseNodes(lexicalJSON.root, (node) => {
    if (node.type === 'inlineBlock') {
      const slug = node.fields.dataInstanceSlug
      const id = slugToId.get(slug)

      if (!id) {
        throw new Error(`Data instance not found: ${slug}`)
      }

      // Replace slug with relationship ID
      node.fields.dataInstance = id
      delete node.fields.dataInstanceSlug
    }
  })

  return lexicalJSON
}
```

**Validation**:
- [ ] All slugs resolved to IDs
- [ ] No orphaned references
- [ ] Relationships valid

### Phase 5: Validate Lexical JSON

**Validation Rules**:

1. **Root Structure**:
```typescript
{
  root: {
    type: 'root',
    format: '',
    indent: 0,
    version: 1,
    children: [...],  // Array of nodes
    direction: 'ltr'
  }
}
```

2. **Required Fields**:
- All nodes must have `type` field
- All nodes must have `version: 1`
- All nodes must have `children` (except text nodes)

3. **Text Format Bitmask**:
- `0` = normal
- `1` = bold
- `2` = italic
- `4` = strikethrough
- `8` = underline

4. **Heading Tags**:
- Must be one of: h1, h2, h3, h4, h5, h6

5. **Link URLs**:
- Must be valid URLs or internal references
- Format: `https://example.com` or `/internal/path`

**Validation Code**:
```typescript
function validateLexicalJSON(json: SerializedEditorState): ValidationResult {
  const errors: string[] = []

  // Check root structure
  if (!json.root) {
    errors.push('Missing root node')
  }

  if (json.root.type !== 'root') {
    errors.push('Root must have type: "root"')
  }

  // Traverse all nodes
  traverseNodes(json.root, (node, path) => {
    if (!node.type) {
      errors.push(`Missing type at ${path}`)
    }

    if (!node.version) {
      errors.push(`Missing version at ${path}`)
    }

    if (node.type === 'heading' && !['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(node.tag)) {
      errors.push(`Invalid heading tag at ${path}: ${node.tag}`)
    }

    if (node.type === 'inlineBlock') {
      if (!node.fields.dataInstance) {
        errors.push(`Unresolved inline block at ${path}`)
      }
    }
  })

  return {
    valid: errors.length === 0,
    errors
  }
}
```

**Validation**:
- [ ] Root structure valid
- [ ] All nodes have required fields
- [ ] Heading tags valid
- [ ] Links valid
- [ ] Inline blocks resolved

## Common Edge Cases

### Edge Case 1: Nested Components

**Problem**: Component inside component
```mdx
<CallToAction>
  Call <FourChangePhoneNumber /> today!
</CallToAction>
```

**Solution**: Flatten to paragraph with inline block
```typescript
// Convert to:
{
  type: 'paragraph',
  children: [
    { type: 'text', text: 'Call ' },
    { type: 'inlineBlock', fields: { ... } },
    { type: 'text', text: ' today!' }
  ]
}
```

### Edge Case 2: Component with Props

**Problem**: Component has attributes
```mdx
<LowestRateDisplay rateType="12month" city="Houston" />
```

**Solution**: Store props in inline block fields
```typescript
{
  type: 'inlineBlock',
  fields: {
    blockType: 'lowestRate',
    dataInstance: '...',
    props: {
      rateType: '12month',
      city: 'Houston'
    }
  }
}
```

### Edge Case 3: Missing Data Instance

**Problem**: Component references non-existent data instance

**Solution**: Create placeholder or fail gracefully
```typescript
if (!dataInstanceId) {
  warnings.push(`Missing data instance: ${slug}`)
  // Option 1: Skip component (convert to text)
  // Option 2: Create placeholder
  // Option 3: Fail migration for this file
}
```

### Edge Case 4: HTML in Markdown

**Problem**: Raw HTML in MDX
```mdx
Click <a href="https://example.com">here</a> for details.
```

**Solution**: Convert HTML to Lexical nodes
```typescript
// Convert <a> to Lexical link:
{
  type: 'link',
  url: 'https://example.com',
  children: [
    { type: 'text', text: 'here' }
  ]
}
```

## Example Conversion

### Input MDX
```mdx
---
title: 4Change Energy Review
slug: 4change-energy
status: published
publish_date: 2023-01-15
---

# 4Change Energy Review

4Change Energy is a **top-rated** provider in Texas. Call <FourChangePhoneNumber /> for more information.

## Plans & Rates

The current lowest rate is <LowestRateDisplay rateType="12month" />.

- Fixed-rate plans
- Variable-rate plans
- Green energy options

[Compare Rates](/compare-rates)
```

### Output Lexical JSON
```json
{
  "root": {
    "type": "root",
    "format": "",
    "indent": 0,
    "version": 1,
    "children": [
      {
        "type": "heading",
        "tag": "h1",
        "children": [
          {
            "type": "text",
            "text": "4Change Energy Review",
            "format": 0
          }
        ],
        "direction": "ltr",
        "format": "",
        "indent": 0,
        "version": 1
      },
      {
        "type": "paragraph",
        "children": [
          {
            "type": "text",
            "text": "4Change Energy is a ",
            "format": 0
          },
          {
            "type": "text",
            "text": "top-rated",
            "format": 1
          },
          {
            "type": "text",
            "text": " provider in Texas. Call ",
            "format": 0
          },
          {
            "type": "inlineBlock",
            "fields": {
              "blockType": "providerPhone",
              "dataInstance": "676a1b2c3d4e5f6g7h8i9j0k"
            }
          },
          {
            "type": "text",
            "text": " for more information.",
            "format": 0
          }
        ],
        "direction": "ltr",
        "format": "",
        "indent": 0,
        "version": 1
      },
      {
        "type": "heading",
        "tag": "h2",
        "children": [
          {
            "type": "text",
            "text": "Plans & Rates",
            "format": 0
          }
        ],
        "direction": "ltr",
        "format": "",
        "indent": 0,
        "version": 1
      },
      {
        "type": "paragraph",
        "children": [
          {
            "type": "text",
            "text": "The current lowest rate is ",
            "format": 0
          },
          {
            "type": "inlineBlock",
            "fields": {
              "blockType": "lowestRate",
              "dataInstance": "123a4b5c6d7e8f9g0h1i2j3k"
            }
          },
          {
            "type": "text",
            "text": ".",
            "format": 0
          }
        ],
        "direction": "ltr",
        "format": "",
        "indent": 0,
        "version": 1
      },
      {
        "type": "list",
        "listType": "bullet",
        "children": [
          {
            "type": "listitem",
            "children": [
              {
                "type": "text",
                "text": "Fixed-rate plans",
                "format": 0
              }
            ]
          },
          {
            "type": "listitem",
            "children": [
              {
                "type": "text",
                "text": "Variable-rate plans",
                "format": 0
              }
            ]
          },
          {
            "type": "listitem",
            "children": [
              {
                "type": "text",
                "text": "Green energy options",
                "format": 0
              }
            ]
          }
        ],
        "direction": "ltr",
        "format": "",
        "indent": 0,
        "version": 1
      },
      {
        "type": "paragraph",
        "children": [
          {
            "type": "link",
            "url": "/compare-rates",
            "children": [
              {
                "type": "text",
                "text": "Compare Rates",
                "format": 0
              }
            ],
            "direction": "ltr",
            "format": "",
            "indent": 0,
            "version": 1
          }
        ],
        "direction": "ltr",
        "format": "",
        "indent": 0,
        "version": 1
      }
    ],
    "direction": "ltr"
  }
}
```

## Scripts Reference

### `scripts/convert-mdx.ts`

**Purpose**: Main conversion script

**Usage**:
```bash
pnpm tsx .claude/skills/mdx-to-lexical/scripts/convert-mdx.ts \
  --input /path/to/file.mdx \
  --output /path/to/output.json
```

**Output**: Lexical JSON file

### `scripts/validate-lexical.ts`

**Purpose**: Validate Lexical JSON structure

**Usage**:
```bash
pnpm tsx .claude/skills/mdx-to-lexical/scripts/validate-lexical.ts \
  --input /path/to/lexical.json
```

**Output**: Validation report with errors/warnings

## Validation Checklist

Before marking conversion complete, verify:

- [ ] MDX file parsed without syntax errors
- [ ] All frontmatter fields extracted
- [ ] Lexical JSON has valid root structure
- [ ] All heading nodes have valid tags (h1-h6)
- [ ] All text nodes have format bitmask
- [ ] All inline components converted to inline blocks
- [ ] All data instance slugs resolved to IDs
- [ ] No orphaned references
- [ ] All links are valid URLs or internal paths
- [ ] Lexical JSON validates against schema
- [ ] Test render in Payload admin UI

## Troubleshooting

### Issue: Parse Error

**Symptom**: MDX parsing fails with syntax error

**Causes**:
- Invalid YAML frontmatter
- Unclosed JSX tags
- Malformed Markdown syntax

**Fix**:
1. Check YAML frontmatter syntax
2. Validate JSX component tags
3. Test with simpler MDX content
4. Review error message for line number

### Issue: Missing Inline Block

**Symptom**: Component not converted to inline block

**Causes**:
- Component not in mapping table
- Component name mismatch
- Nested component (not supported)

**Fix**:
1. Add component to mapping table
2. Check exact component name
3. Flatten nested components

### Issue: Unresolved Reference

**Symptom**: "Data instance not found" error

**Causes**:
- Missing RichTextDataInstance in database
- Incorrect slug mapping
- Slug typo

**Fix**:
1. Create missing data instance
2. Verify slug mapping in database
3. Check for typos in slug

### Issue: Invalid Lexical JSON

**Symptom**: Validation fails

**Causes**:
- Missing required fields
- Invalid node structure
- Wrong field types

**Fix**:
1. Run validation script for detailed errors
2. Check node structure against Lexical spec
3. Verify all required fields present

## Best Practices

1. **Test with One File First**: Validate conversion on single file before batch processing
2. **Keep Component Mapping Updated**: Add new components as discovered
3. **Validate Early**: Check Lexical JSON structure immediately after conversion
4. **Log Warnings**: Track non-critical issues for review
5. **Preserve Source**: Keep original MDX files for reference
6. **Version Lexical JSON**: Use `version: 1` consistently

## Resources

- **Lexical Documentation**: https://lexical.dev/docs/intro
- **Payload Lexical Editor**: https://payloadcms.com/docs/rich-text/lexical
- **MDX Specification**: https://mdxjs.com/docs/
- **Unified/Remark**: https://unifiedjs.com/

---

**Created**: 2025-10-24
**Version**: 1.0
**Use**: Ask "Convert MDX file to Lexical JSON"
