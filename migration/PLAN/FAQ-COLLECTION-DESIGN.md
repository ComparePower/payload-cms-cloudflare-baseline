# FAQ Collection & Block Design

**Pattern**: Similar to RichTextDataInstances (phone numbers with Organization schema)
**Goal**: Reusable FAQ entries with proper schema.org/FAQPage markup

---

## Collection: FAQs

### Purpose
Central repository of FAQ items that can be referenced in multiple posts with proper schema.org markup.

### Fields

```typescript
export const FAQs: CollectionConfig = {
  slug: 'faqs',
  admin: {
    useAsTitle: 'question',
    defaultColumns: ['question', 'category', 'updatedAt']
  },
  fields: [
    {
      name: 'question',
      type: 'text',
      required: true,
      admin: {
        description: 'The FAQ question'
      }
    },
    {
      name: 'answer',
      type: 'richText',
      required: true,
      admin: {
        description: 'The answer (supports rich text formatting)'
      }
    },
    {
      name: 'category',
      type: 'select',
      options: [
        { label: 'Electricity Providers', value: 'providers' },
        { label: 'Rates & Plans', value: 'rates' },
        { label: 'Billing', value: 'billing' },
        { label: 'General', value: 'general' }
      ],
      admin: {
        description: 'Category for organizing FAQs'
      }
    },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      index: true,
      admin: {
        description: 'URL-friendly identifier'
      },
      hooks: {
        beforeValidate: [
          ({ value, data }) => {
            if (!value && data?.question) {
              return data.question
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, '')
            }
            return value
          }
        ]
      }
    },
    {
      name: 'relatedTopics',
      type: 'array',
      fields: [
        {
          name: 'topic',
          type: 'text'
        }
      ],
      admin: {
        description: 'Related topics/keywords for search'
      }
    }
  ]
}
```

---

## Block: FAQ Block

### Purpose
Insert one or more FAQs into content with proper schema.org/FAQPage markup.

### Definition

```typescript
export const FaqBlock: Block = {
  slug: 'faqBlock',
  interfaceName: 'FaqBlockType',
  fields: [
    {
      name: 'faqs',
      type: 'relationship',
      relationTo: 'faqs',
      hasMany: true,
      required: true,
      admin: {
        description: 'Select one or more FAQs to display'
      }
    },
    {
      name: 'title',
      type: 'text',
      admin: {
        description: 'Optional title above FAQ section (e.g., "Frequently Asked Questions")'
      }
    },
    {
      name: 'showNumbers',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Show numbered list (1, 2, 3...)'
      }
    },
    {
      name: 'expandable',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Make FAQs collapsible/expandable (accordion style)'
      }
    },
    {
      name: 'includeSchema',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Include schema.org/FAQPage structured data for SEO'
      }
    }
  ]
}
```

---

## Lexical Rendering (Astro Frontend)

### lexical-renderer.ts

```typescript
// FAQ Block rendering with schema.org markup
if (blockType === 'faqBlock' && fields?.faqs) {
  const faqs = fields.faqs // array of FAQ objects
  const title = fields.title || ''
  const showNumbers = fields.showNumbers || false
  const expandable = fields.expandable !== false
  const includeSchema = fields.includeSchema !== false

  let html = '<div class="faq-block">'

  if (title) {
    html += `<h2 class="faq-title">${escapeHtml(title)}</h2>`
  }

  // Wrap with schema.org/FAQPage if enabled
  if (includeSchema) {
    html += '<div itemscope itemtype="https://schema.org/FAQPage">'
  }

  html += '<div class="faq-list">'

  faqs.forEach((faq, index) => {
    const question = faq.question || ''
    const answer = faq.answer || '' // This is Lexical JSON, needs conversion
    const answerHtml = lexicalToHtml(answer) // Recursive call for rich text answer

    // Each FAQ item with schema markup
    if (includeSchema) {
      html += '<div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">'
    } else {
      html += '<div class="faq-item">'
    }

    // Question
    const questionPrefix = showNumbers ? `${index + 1}. ` : ''
    if (expandable) {
      html += `<details class="faq-details">
        <summary class="faq-question"${includeSchema ? ' itemprop="name"' : ''}>
          ${escapeHtml(questionPrefix + question)}
        </summary>
        <div class="faq-answer"${includeSchema ? ' itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer"' : ''}>
          ${includeSchema ? '<div itemprop="text">' : ''}
          ${answerHtml}
          ${includeSchema ? '</div>' : ''}
        </div>
      </details>`
    } else {
      html += `<div class="faq-question"${includeSchema ? ' itemprop="name"' : ''}>
        ${escapeHtml(questionPrefix + question)}
      </div>
      <div class="faq-answer"${includeSchema ? ' itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer"' : ''}>
        ${includeSchema ? '<div itemprop="text">' : ''}
        ${answerHtml}
        ${includeSchema ? '</div>' : ''}
      </div>`
    }

    html += '</div>' // Close faq-item
  })

  html += '</div>' // Close faq-list

  if (includeSchema) {
    html += '</div>' // Close FAQPage schema wrapper
  }

  html += '</div>' // Close faq-block

  return html
}
```

### Generated Schema.org Output Example

```html
<div class="faq-block">
  <h2 class="faq-title">Frequently Asked Questions</h2>

  <div itemscope itemtype="https://schema.org/FAQPage">
    <div class="faq-list">

      <!-- FAQ Item 1 -->
      <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
        <details class="faq-details">
          <summary class="faq-question" itemprop="name">
            What is the average electricity rate in Texas?
          </summary>
          <div class="faq-answer" itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
            <div itemprop="text">
              <p>The average residential electricity rate in Texas is around 12.5 cents per kWh...</p>
            </div>
          </div>
        </details>
      </div>

      <!-- FAQ Item 2 -->
      <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
        <details class="faq-details">
          <summary class="faq-question" itemprop="name">
            How do I switch electricity providers in Texas?
          </summary>
          <div class="faq-answer" itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
            <div itemprop="text">
              <p>Switching providers in Texas is easy. Simply choose a new plan...</p>
            </div>
          </div>
        </details>
      </div>

    </div>
  </div>
</div>
```

---

## Migration Strategy

### Step 1: Create FAQs Collection in Target Payload

```bash
# Generated collection config
cp migration/generated/collections/FAQs.ts src/collections/FAQs.ts

# Update payload.config.ts
import { FAQs } from './collections/FAQs'

export default buildConfig({
  collections: [
    FAQs,
    // ... other collections
  ]
})
```

### Step 2: Parse Existing FaqRankMath Usage

For the 28 MDX files with `<FaqRankMath>`:

```javascript
// In prepare-seed-data.mjs

// Parse FaqRankMath from MDX
const faqMatch = mdxContent.match(/<FaqRankMath\s+questions=\{([^}]+)\}/s)

if (faqMatch) {
  // Extract questions prop (likely an array)
  const questionsData = parseFaqData(faqMatch[1])

  // Create FAQ entries in FAQs collection
  const faqIds = []
  for (const item of questionsData) {
    const faq = await payload.create({
      collection: 'faqs',
      data: {
        question: item.question,
        answer: item.answer, // Convert to Lexical
        category: 'providers',
        slug: generateSlug(item.question)
      }
    })
    faqIds.push(faq.id)
  }

  // Replace with FaqBlock in content
  return {
    blockType: 'faqBlock',
    faqs: faqIds,
    title: 'Frequently Asked Questions',
    showNumbers: false,
    expandable: true,
    includeSchema: true
  }
}
```

### Step 3: Handle Missing `questions` Prop

For 28 files without proper `questions` data:

```javascript
// Create placeholder EditorBlock
return {
  blockType: 'editorBlock',
  componentType: 'FaqRankMath',
  editorNotes: 'TODO: Add FAQ data - convert to FaqBlock',
  originalMarkup: faqMatch[0]
}
```

---

## Benefits

1. **Reusable FAQs**: Create once, use in multiple posts
2. **Centralized Management**: Update FAQ answer in one place
3. **Proper SEO**: Schema.org/FAQPage markup automatically applied
4. **Flexible Display**: Expandable, numbered, with/without schema
5. **Rich Answers**: Support full Lexical formatting in answers
6. **Searchable**: Category and topic tagging for easy finding

---

## Admin UI Experience

### Creating FAQ
1. Go to FAQs collection
2. Click "Create New"
3. Enter question and answer (with rich text editor)
4. Select category
5. Add related topics
6. Save

### Using in Content
1. Add "FAQ Block" to content
2. Search and select FAQs from dropdown (multi-select)
3. Optionally add title
4. Toggle options (numbered, expandable, schema)
5. FAQs render with proper markup

---

## Styling (Astro CSS)

```css
.faq-block {
  margin: 2rem 0;
}

.faq-title {
  font-size: 1.5rem;
  margin-bottom: 1rem;
}

.faq-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.faq-item {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 1rem;
}

.faq-details {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 1rem;
}

.faq-question {
  font-weight: 600;
  cursor: pointer;
  user-select: none;
}

.faq-details[open] .faq-question {
  margin-bottom: 0.75rem;
}

.faq-answer {
  color: #555;
  line-height: 1.6;
}

.faq-answer p {
  margin: 0.5rem 0;
}
```

---

## Next Steps

1. Generate FAQs collection config
2. Generate FaqBlock block definition
3. Update lexical-renderer with FAQ rendering
4. Parse existing FaqRankMath usages during data preparation
5. Create FAQ entries for valid data
6. Create placeholder EditorBlocks for missing data
7. Test FAQ rendering on frontend with schema validation

---

## Future Enhancements

- **FAQ Analytics**: Track which FAQs are viewed most
- **FAQ Search**: Dedicated FAQ search page
- **Auto-suggest**: Suggest related FAQs based on content
- **Import/Export**: Bulk import FAQs from CSV
- **Versioning**: Track FAQ answer changes over time
