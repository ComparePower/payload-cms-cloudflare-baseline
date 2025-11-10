# Adding Inline Dynamic Content to Rich Text

## Overview

Payload supports inline blocks within rich text, allowing you to insert dynamic content like phone numbers directly in sentences.

## Example: Dynamic Phone Numbers

### 1. Update payload.config.ts

```typescript
import {
  BoldFeature,
  HeadingFeature,
  InlineBlocksFeature, // ADD THIS
  // ... other imports
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import { DynamicPhone } from './lexical/inlineBlocks/DynamicPhone'

export default buildConfig({
  // ... your config
  editor: lexicalEditor({
    features: () => {
      return [
        ParagraphFeature(),
        HeadingFeature({
          enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
        }),
        BoldFeature(),
        ItalicFeature(),
        UnderlineFeature(),
        StrikethroughFeature(),
        OrderedListFeature(),
        UnorderedListFeature(),
        LinkFeature({ /* ... */ }),
        IndentFeature(),

        // ADD THIS:
        InlineBlocksFeature({
          inlineBlocks: [DynamicPhone],
        }),
      ]
    },
  }),
})
```

### 2. How Editors Use It

In the Payload admin, editors can:

1. Type: "Call TXU Energy at "
2. Click the "+" button or type "/"
3. Select "Dynamic Phone"
4. Choose provider: "TXU Energy"
5. Continue typing: " for assistance"

Result: "Call TXU Energy at [TXU: 1-866-xxx-xxxx] for assistance"

### 3. Rendering in Astro

The inline block will appear in your Lexical JSON as:

```json
{
  "children": [
    { "type": "text", "text": "Call TXU Energy at " },
    {
      "type": "inline-block",
      "fields": {
        "blockType": "dynamicPhone",
        "provider": "txu"
      }
    },
    { "type": "text", "text": " for assistance" }
  ]
}
```

In your Astro lexical renderer, add:

```typescript
// src/lib/lexical-renderer.ts
function renderNode(node: any): string {
  // ... existing rendering

  if (node.type === 'inline-block') {
    const blockType = node.fields?.blockType
    if (blockType === 'dynamicPhone') {
      const provider = node.fields?.provider
      const phoneNumbers = {
        txu: '1-866-961-1345',
        reliant: '1-855-339-5971',
        gexa: '1-866-961-9399',
        comparepower: '1-866-580-8100',
      }
      return phoneNumbers[provider] || 'N/A'
    }
  }

  // ... rest of rendering
}
```

## Alternative: Simple Text Replacement

If inline blocks are too complex, you can use simple text replacement:

### In Rich Text
Editors type: `Call TXU Energy at {{TXU_PHONE}} for assistance`

### In Renderer
```typescript
function replaceVariables(text: string): string {
  const variables = {
    TXU_PHONE: '1-866-961-1345',
    RELIANT_PHONE: '1-855-339-5971',
    GEXA_PHONE: '1-866-961-9399',
    COMPAREPOWER_PHONE: '1-866-580-8100',
  }

  return text.replace(/\{\{([A-Z_]+)\}\}/g, (match, key) => {
    return variables[key] || match
  })
}
```

This is simpler but less type-safe and harder to manage.

## Recommendation

For your use case ("Call TXU Energy at {PHONE}"):
- **Use InlineBlocksFeature** if you have many dynamic values and want type safety
- **Use text replacement** if you only have a few values and want simplicity

The inline blocks approach is more maintainable and provides a better editing experience!
