# Inline Blocks Implementation Guide

## What We Just Added

Based on the article you found, we've implemented inline blocks that allow editors to insert dynamic data within text. For example:

**Before**: "Call TXU Energy at 1-866-961-1345"
**After**: "Call TXU Energy at [Dynamic Value: TXU Phone]"

When the phone number changes in one place, it updates everywhere automatically!

## What's Been Configured

### 1. New Collection: `RichTextDataInstances`
Location: `src/collections/RichTextDataInstances.ts`

This collection lets users create and manage dynamic values:
- Phone numbers
- Email addresses
- Addresses
- Any frequently changing values

### 2. Inline Blocks Defined
Location: `src/lexical/inlineBlocks/index.ts`

Three inline blocks are available:
- **CurrentYear**: Displays current year (for copyright notices)
- **YearsSince**: Calculates years since a specific year
- **DynamicDataInstance**: Inserts values from the collection

### 3. Updated Payload Config
The editor now supports inline blocks via `BlocksFeature`.

## How Editors Use It

### Step 1: Create Data Instances

1. Go to Payload admin: http://localhost:3003/admin
2. Navigate to "Rich Text Data Instances"
3. Click "Create New"
4. Add phone numbers:
   - Name: "TXU Energy Phone"
   - Value: "1-866-961-1345"
   - Category: "Phone Number"

Repeat for all phone numbers.

### Step 2: Insert in Content

When editing a post:
1. Type: "Call TXU Energy at "
2. Click the "+" button (or type "/")
3. Select "Dynamic Value"
4. Choose "TXU Energy Phone" from dropdown
5. Continue typing

Result: The phone number appears inline and updates automatically if changed!

## Frontend Implementation (Astro)

You need to update your lexical renderer to handle inline blocks.

### Update `astro-poc/src/lib/lexical-renderer.ts`

Add this to the `renderNode` function:

\`\`\`typescript
function renderNode(node: any, index: number = 0): string {
  // ... existing code for paragraph, heading, etc.

  // Handle inline blocks
  if (node.type === 'inlineBlock') {
    const blockType = node.fields?.blockType

    // Current Year
    if (blockType === 'currentYear') {
      return new Date().getFullYear().toString()
    }

    // Years Since
    if (blockType === 'yearsSince') {
      const startYear = node.fields?.year
      if (startYear) {
        const yearsSince = new Date().getFullYear() - startYear
        return yearsSince.toString()
      }
      return '0'
    }

    // Dynamic Data Instance (phone numbers, etc.)
    if (blockType === 'dynamicDataInstance') {
      const instance = node.fields?.instance

      // If populated (depth > 0)
      if (instance && typeof instance === 'object') {
        return instance.value || ''
      }

      // If just ID, you'll need to fetch it
      // For now, return empty or fetch from API
      return '[Dynamic Value]'
    }

    return '' // Unknown inline block
  }

  // ... rest of your existing code
}
\`\`\`

### Fetching Instance Data

For dynamic data instances to work, you need to fetch them with the post. Update your API call:

\`\`\`typescript
// In astro-poc/src/lib/api.ts
export async function getPostBySlug(slug: string): Promise<Post | null> {
  try {
    const response = await fetch(
      \`\${API_URL}/posts?where[slug][equals]=\${slug}&depth=2\` // Increased depth!
    )
    // ... rest
  } catch (error) {
    // ... error handling
  }
}
\`\`\`

**Note**: `depth=2` ensures inline block relationships are populated.

## Example: Seeding Initial Data

Create a script to add common phone numbers:

\`\`\`typescript
// scripts/seed-data-instances.ts
import { getPayload } from 'payload'
import config from '../src/payload.config'

async function seed() {
  const payload = await getPayload({ config })

  const phoneNumbers = [
    { name: 'Compare Power Phone', value: '1-866-580-8100' },
    { name: 'TXU Energy Phone', value: '1-866-961-1345' },
    { name: 'Reliant Energy Phone', value: '1-855-339-5971' },
    { name: 'Gexa Energy Phone', value: '1-866-961-9399' },
  ]

  for (const phone of phoneNumbers) {
    await payload.create({
      collection: 'richTextDataInstances',
      data: {
        name: phone.name,
        value: phone.value,
        category: 'phone',
      },
    })
  }

  console.log('✅ Seeded phone numbers')
  process.exit(0)
}

seed()
\`\`\`

Run: `./scripts/doppler-run.sh dev pnpm tsx scripts/seed-data-instances.ts`

## Testing

1. **Create instances** in admin
2. **Insert in content**: Edit a post and add a dynamic value
3. **View in admin**: Should see inline block preview
4. **Test Astro**: Build and check that values render correctly

## Benefits

✅ **Centralized management**: Update phone number once, changes everywhere
✅ **No code changes**: Editors manage values without developer help
✅ **Type-safe**: Dropdown selection prevents typos
✅ **Audit trail**: See when values were changed
✅ **Inline flow**: Numbers appear naturally in sentences

## Next Steps

1. Run `pnpm dev` to see new collection in admin
2. Create some test data instances
3. Try inserting them in a post
4. Update Astro lexical renderer
5. Test frontend rendering

The inline blocks are now available! Users can start using them immediately in the Payload admin.
