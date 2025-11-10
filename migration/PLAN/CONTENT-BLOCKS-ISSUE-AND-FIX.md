# Content Blocks Issue & Fix Plan

**Date**: 2025-10-22
**Status**: Critical Issue Identified
**Priority**: High

---

## The Problem

### Current State (BROKEN)

The MDX content migration is **NOT properly splitting components into separate blocks**. Instead:

```json
{
  "contentBlocks": [{
    "blockType": "richText",
    "content": {
      "root": {
        "children": [{
          "text": "&#x3C;WpBlock61260_EzAuthorBoxCopy /> Is Your Electricity Plan... <LowestRateDisplay utilityId={3} /> more text..."
        }]
      }
    }
  }]
}
```

**Components are embedded as escaped HTML text** in a single richText block!

### What It Should Be

```json
{
  "contentBlocks": [
    {
      "blockType": "richText",
      "content": {"root": {"children": [{"text": "Text before component"}]}}
    },
    {
      "blockType": "WpBlock61260_EzAuthorBoxCopy",
      "fields": {}
    },
    {
      "blockType": "richText",
      "content": {"root": {"children": [{"text": "Is Your Electricity Plan..."}]}}
    },
    {
      "blockType": "LowestRateDisplay",
      "fields": {
        "utilityId": "3",
        "pricingBasedOn": "1000"
      }
    },
    {
      "blockType": "richText",
      "content": {"root": {"children": [{"text": "more text..."}]}}
    }
  ]
}
```

**Each component is a separate block**, allowing:
- ✅ Proper rendering in Astro frontend
- ✅ Placeholders in Payload admin
- ✅ Content editing around components
- ✅ Reordering blocks in admin

---

## Why This Matters

### Impact on Frontend (Astro)

**Current**: All components show as escaped HTML text - completely broken
**Fixed**: Components render as proper Astro components with styling

### Impact on Admin (Payload)

**Current**: Editors see component tags as plain text in rich text editor
**Fixed**: Editors see component placeholders they can move/edit around

### Impact on Content Structure

**Current**: Cannot reorder components or text blocks
**Fixed**: Full block-based editor with drag-and-drop

---

## Root Cause

The migration scripts created:
- ✅ Component catalog (60 components discovered)
- ✅ Payload block type definitions
- ❌ **NO MDX→Lexical converter that splits at component boundaries**

The content was imported as-is with component tags treated as text.

---

## The Solution

### 1. MDX Parser & Splitter ✅ CREATED

**File**: `scripts/migration/lib/mdx-to-payload-blocks.ts`

**What it does**:
1. Parses MDX using remark/unified
2. Identifies component boundaries
3. Splits content at each component
4. Converts markdown sections to Lexical JSON
5. Extracts component props
6. Returns array of content blocks

**Example**:
```typescript
const mdx = `
Some text here.

<LowestRateDisplay utilityId={3} pricingBasedOn={1000} />

More text after.
`

const result = await parseMDXToBlocks(mdx)
// Returns:
// contentBlocks: [
//   {blockType: 'richText', content: {Lexical JSON}},
//   {blockType: 'LowestRateDisplay', fields: {utilityId: 3, pricingBasedOn: 1000}},
//   {blockType: 'richText', content: {Lexical JSON}}
// ]
```

### 2. Content Re-Migration Script (TODO)

**File**: `scripts/migration/reimport-content-blocks.ts`

**What it needs to do**:
1. Read all MDX files from source
2. For each file:
   - Parse frontmatter
   - Parse body with `mdx-to-payload-blocks.ts`
   - Update existing Payload document
   - Replace `contentBlocks` array
3. Handle images (see #3)
4. Log success/failures

**Pseudo-code**:
```typescript
for (const mdxFile of mdxFiles) {
  const { frontmatter, body } = parseMDX(mdxFile)
  const { contentBlocks, images } = await parseMDXToBlocks(body)

  // Upload images first
  const uploadedImages = await uploadImages(images)

  // Insert image blocks at correct positions
  insertImageBlocks(contentBlocks, uploadedImages)

  // Update Payload document
  await payload.update({
    collection: 'posts',
    where: { slug: frontmatter.slug },
    data: { contentBlocks }
  })
}
```

### 3. Image Migration (TODO)

**Challenge**: Images referenced in MDX need to be:
1. Uploaded to Payload Media collection
2. Deduplicated (don't upload same image twice)
3. Inserted as blocks at correct positions

**Solution**:
```typescript
// Track uploaded images
const uploadedImages = new Map<string, string>() // path → Payload ID

async function uploadImage(imagePath: string) {
  // Check if already uploaded
  if (uploadedImages.has(imagePath)) {
    return uploadedImages.get(imagePath)
  }

  // Find image file in source project
  const sourceImagePath = path.join(SOURCE_DIR, 'public', imagePath)

  if (!fs.existsSync(sourceImagePath)) {
    console.warn(`Image not found: ${sourceImagePath}`)
    return null
  }

  // Upload to Payload
  const media = await payload.create({
    collection: 'media',
    data: {
      alt: '', // Extract from MDX if available
    },
    filePath: sourceImagePath
  })

  // Cache for deduplication
  uploadedImages.set(imagePath, media.id)

  return media.id
}
```

### 4. Payload Admin Component Previews (TODO)

**Challenge**: Astro components can't render in Payload admin (which is React)

**Solution**: Create React placeholder components

**File**: `src/collections/Posts.ts` (modify)

Add custom admin components for each block type:

```typescript
import { Block } from 'payload/types'

const LowestRateDisplayBlock: Block = {
  slug: 'LowestRateDisplay',
  fields: [
    { name: 'utilityId', type: 'text' },
    { name: 'pricingBasedOn', type: 'text' },
    { name: 'priceUnit', type: 'text' }
  ],
  admin: {
    components: {
      // Custom React component for admin preview
      Label: () => {
        return <div style={{
          background: '#fff9e6',
          border: '2px solid #ffd966',
          padding: '1rem',
          borderRadius: '8px'
        }}>
          <strong>💰 Lowest Rate Display</strong>
          <p>Shows lowest electricity rate for utility</p>
        </div>
      }
    }
  }
}
```

This shows a styled placeholder in the admin that clearly indicates:
- Component type
- What it does
- Props can be edited

---

## Implementation Steps

### Phase 1: Test the Parser ✅
1. ✅ Create `mdx-to-payload-blocks.ts`
2. ⏳ Write unit tests
3. ⏳ Test with sample MDX files

### Phase 2: Image Migration
1. Create image upload/deduplication logic
2. Track uploaded images in cache file
3. Handle missing images gracefully

### Phase 3: Content Re-Migration
1. Create re-import script
2. Run on test environment first
3. Verify content blocks structure
4. Run on all 534 posts

### Phase 4: Admin Previews
1. Add admin preview components for top 10 components
2. Test in Payload admin
3. Verify editors can work with blocks

### Phase 5: Validation
1. Check all posts have proper block structure
2. Verify Astro frontend renders correctly
3. Test admin editing experience
4. Document any issues

---

## Testing Strategy

### Unit Tests
```typescript
describe('mdx-to-payload-blocks', () => {
  it('splits content at component boundaries', () => {
    const mdx = 'Text\n\n<Comp />\n\nMore text'
    const result = parseMDXToBlocks(mdx)
    expect(result.contentBlocks).toHaveLength(3)
    expect(result.contentBlocks[1].blockType).toBe('Comp')
  })

  it('extracts component props', () => {
    const mdx = '<Comp foo="bar" num={42} />'
    const result = parseMDXToBlocks(mdx)
    expect(result.contentBlocks[0].fields).toEqual({
      foo: 'bar',
      num: 42
    })
  })
})
```

### Integration Tests
- Import a sample post
- Check database structure
- Render in Astro
- Verify in admin

---

## Estimated Effort

- ✅ MDX Parser: **2 hours** (DONE)
- ⏳ Image Migration: **4 hours**
- ⏳ Re-Migration Script: **3 hours**
- ⏳ Testing & Fixes: **4 hours**
- ⏳ Admin Previews: **6 hours**

**Total**: ~19 hours of development work

---

## Current Status

- ✅ **Problem identified**: Content blocks not split properly
- ✅ **Root cause found**: No MDX→Lexical converter
- ✅ **Parser created**: `mdx-to-payload-blocks.ts`
- ⏳ **Testing needed**: Unit tests for parser
- ⏳ **Image migration**: Not started
- ⏳ **Re-import script**: Not started
- ⏳ **Admin previews**: Not started

---

## Next Immediate Steps

1. **Test the parser** with real MDX files
2. **Create image upload logic** with deduplication
3. **Build re-import script** to fix existing content
4. **Run migration** on test environment
5. **Verify** content renders correctly in Astro

---

## Questions to Resolve

1. **Source images location**: Where are images stored in source project?
2. **Image deduplication**: Use filename or content hash?
3. **Missing images**: How to handle broken image references?
4. **Backup strategy**: Should we backup DB before re-migration?
5. **Incremental vs full**: Re-import all posts or only fix broken ones?

---

**Last Updated**: 2025-10-22
**Next Review**: After parser testing
