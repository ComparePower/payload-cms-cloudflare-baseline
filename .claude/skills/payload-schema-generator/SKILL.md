---
name: payload-schema-generator
description: Generate Payload CMS collection schemas from frontmatter analysis and field discovery. Scans MDX files, extracts unique fields, maps field types, generates TypeScript CollectionConfig with proper configuration (trash, versions, access control). Use when creating new collections, analyzing content structure, defining Payload field configurations, mapping MDX frontmatter to Payload schemas, or scaffolding collection files.
allowed-tools: Read, Write, Bash
---

# Payload Schema Generator Skill

Generate complete Payload CollectionConfig files from MDX content analysis.

## What This Skill Does

This skill automates the process of creating Payload collection schemas:
- Scan all MDX files in a directory
- Extract all unique frontmatter fields
- Analyze field types and patterns
- Map field types to Payload field configurations
- Generate TypeScript CollectionConfig file
- Add required configurations (trash, versions, access)
- Set up proper TypeScript types

## When to Use This Skill

Use this skill when:
- Creating a new Payload collection from existing content
- Migrating content with unknown schema
- Analyzing field usage across multiple files
- Generating CollectionConfig boilerplate
- Mapping MDX frontmatter to Payload fields
- Updating collection schemas after content changes

## Input/Output Contract

### Input
```typescript
interface SchemaGeneratorInput {
  collectionName: string        // e.g., "providers", "electricity-rates"
  mdxDirectory: string          // Path to MDX files
  singularLabel?: string        // e.g., "Provider" (defaults to camelCase)
  pluralLabel?: string          // e.g., "Providers" (defaults to collectionName)
}
```

### Output
```typescript
interface SchemaGeneratorOutput {
  collectionConfig: string      // TypeScript code for CollectionConfig
  fieldMappings: FieldMapping[]  // How frontmatter → Payload fields
  warnings: string[]            // Type ambiguities or edge cases
  outputPath: string            // Where file was written
}
```

## Schema Generation Pipeline

### Phase 1: Field Discovery

**Purpose**: Scan all MDX files and collect unique frontmatter fields

**Process**:
```typescript
import matter from 'gray-matter'
import fs from 'fs'
import path from 'path'

async function discoverFields(directory: string): Promise<FieldDiscovery> {
  const fields = new Map<string, FieldInfo>()
  const files = glob.sync(`${directory}/**/*.mdx`)

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8')
    const { data: frontmatter } = matter(content)

    for (const [key, value] of Object.entries(frontmatter)) {
      if (!fields.has(key)) {
        fields.set(key, {
          name: key,
          types: new Set(),
          required: 0,
          total: 0,
          samples: []
        })
      }

      const fieldInfo = fields.get(key)!
      fieldInfo.total++
      fieldInfo.types.add(typeof value)

      if (value !== null && value !== undefined && value !== '') {
        fieldInfo.required++
      }

      if (fieldInfo.samples.length < 3) {
        fieldInfo.samples.push(value)
      }
    }
  }

  return {
    fields: Array.from(fields.values()),
    totalFiles: files.length
  }
}
```

**Output**: Complete field inventory with:
- Field names
- Observed types
- Required frequency (percentage)
- Sample values

**Validation**:
- [ ] All MDX files parsed
- [ ] All frontmatter fields collected
- [ ] Type analysis complete
- [ ] Sample values captured

### Phase 2: Type Mapping

**Purpose**: Map JavaScript types to Payload field types

**Type Mapping Table**:

| Frontmatter Type | Payload Field Type | Notes |
|-----------------|-------------------|-------|
| `string` | `text` | Default for short strings |
| `string` (long) | `textarea` | If avg length >200 chars |
| `string` (URL) | `text` | With URL validation |
| `string` (email) | `email` | If matches email pattern |
| `string` (slug) | `text` | With unique + index |
| `boolean` | `checkbox` | Direct mapping |
| `number` | `number` | Direct mapping |
| `Date` / ISO string | `date` | Direct mapping |
| `array<string>` | `array` | With text subfield |
| `array<object>` | `array` | With group subfields |
| `object` | `group` | Nested fields |

**Field Name Mapping**:

| Frontmatter Field | Payload Field | Group | Notes |
|------------------|---------------|-------|-------|
| `seo_title` | `seo.title` | `seo` | Nested in group |
| `meta_description` | `seo.metaDescription` | `seo` | Nested in group |
| `wp_slug` | `wordpressSlug` | - | camelCase |
| `wp_post_id` | `wpPostId` | - | camelCase |
| `updated_date` | `updatedDate` | - | camelCase |
| `publish_date` | `publishedAt` | - | Semantic naming |
| `hero_heading_1` | `hero.headingLine1` | `hero` | Nested in group |

**Code Example**:
```typescript
function mapFieldType(fieldInfo: FieldInfo): PayloadField {
  const { name, types, required, samples } = fieldInfo

  // Detect URL pattern
  if (types.has('string') && samples.every(s => s?.startsWith('http'))) {
    return {
      name: camelCase(name),
      type: 'text',
      required: required / total > 0.9,
      validate: 'validateUrl'
    }
  }

  // Detect email pattern
  if (types.has('string') && name.includes('email')) {
    return {
      name: camelCase(name),
      type: 'email',
      required: required / total > 0.9
    }
  }

  // Detect slug
  if (name === 'slug') {
    return {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true
    }
  }

  // Detect long text (textarea)
  if (types.has('string')) {
    const avgLength = samples.reduce((sum, s) => sum + (s?.length || 0), 0) / samples.length
    if (avgLength > 200) {
      return {
        name: camelCase(name),
        type: 'textarea',
        required: required / total > 0.9
      }
    }
  }

  // Default mappings
  if (types.has('boolean')) {
    return { name: camelCase(name), type: 'checkbox' }
  }

  if (types.has('number')) {
    return { name: camelCase(name), type: 'number', required: required / total > 0.9 }
  }

  if (types.has('object') && Array.isArray(samples[0])) {
    return {
      name: camelCase(name),
      type: 'array',
      fields: [/* analyze array items */]
    }
  }

  // Default: text field
  return {
    name: camelCase(name),
    type: 'text',
    required: required / total > 0.9
  }
}
```

**Validation**:
- [ ] All field types mapped
- [ ] Required fields identified
- [ ] Nested fields grouped correctly
- [ ] Special fields (slug, email, URL) detected

### Phase 3: Group Organization

**Purpose**: Organize related fields into groups

**Common Groups**:

1. **SEO Group**:
```typescript
{
  name: 'seo',
  type: 'group',
  fields: [
    { name: 'title', type: 'text' },
    { name: 'metaDescription', type: 'textarea' },
    { name: 'keywords', type: 'text' }
  ]
}
```

2. **Hero Group**:
```typescript
{
  name: 'hero',
  type: 'group',
  fields: [
    { name: 'headingLine1', type: 'text' },
    { name: 'headingLine2', type: 'text' },
    { name: 'ctaText', type: 'text' },
    { name: 'ctaUrl', type: 'text' }
  ]
}
```

3. **WordPress Migration Group**:
```typescript
{
  name: 'wordpress',
  type: 'group',
  fields: [
    { name: 'slug', type: 'text' },
    { name: 'postId', type: 'number' },
    { name: 'categories', type: 'text' }
  ]
}
```

**Grouping Logic**:
```typescript
function groupFields(fields: PayloadField[]): PayloadField[] {
  const grouped: PayloadField[] = []
  const groups = new Map<string, PayloadField[]>()

  for (const field of fields) {
    // Detect group prefix
    const match = field.name.match(/^(seo|hero|wp|wordpress|meta)(.+)$/)

    if (match) {
      const groupName = match[1] === 'wp' ? 'wordpress' : match[1]
      const fieldName = camelCase(match[2])

      if (!groups.has(groupName)) {
        groups.set(groupName, [])
      }

      groups.get(groupName)!.push({
        ...field,
        name: fieldName
      })
    } else {
      grouped.push(field)
    }
  }

  // Add group fields
  for (const [groupName, groupFields] of groups) {
    grouped.push({
      name: groupName,
      type: 'group',
      fields: groupFields
    })
  }

  return grouped
}
```

**Validation**:
- [ ] Related fields grouped
- [ ] Group naming consistent
- [ ] No orphaned fields

### Phase 4: Generate TypeScript Code

**Purpose**: Create complete CollectionConfig TypeScript file

**Template**:
```typescript
import type { CollectionConfig } from 'payload'

export const ${CollectionName}: CollectionConfig = {
  slug: '${collectionSlug}',
  labels: {
    singular: '${singularLabel}',
    plural: '${pluralLabel}'
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'status', 'publishedAt']
  },
  access: {
    read: () => true,  // Public read
    create: adminOnly,
    update: adminOnly,
    delete: adminOnly
  },
  versions: {
    drafts: true,
    maxPerDoc: 50
  },
  trash: true,  // Soft-delete with deletedAt field
  fields: [
    ${generatedFields}
  ]
}
```

**Code Generation**:
```typescript
function generateCollectionConfig(
  collectionName: string,
  fields: PayloadField[]
): string {
  const pascalName = pascalCase(collectionName)
  const kebabName = kebabCase(collectionName)

  const fieldCode = fields.map(field => generateFieldCode(field)).join(',\n    ')

  return `import type { CollectionConfig } from 'payload'
import { adminOnly } from '@/access/adminOnly'

export const ${pascalName}: CollectionConfig = {
  slug: '${kebabName}',
  labels: {
    singular: '${pascalName.replace(/s$/, '')}',
    plural: '${pascalName}'
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'status', 'publishedAt']
  },
  access: {
    read: () => true,
    create: adminOnly,
    update: adminOnly,
    delete: adminOnly
  },
  versions: {
    drafts: true,
    maxPerDoc: 50
  },
  trash: true,
  fields: [
    ${fieldCode}
  ]
}
`
}

function generateFieldCode(field: PayloadField, indent = 2): string {
  const spaces = ' '.repeat(indent)

  if (field.type === 'group') {
    const nestedFields = field.fields!
      .map(f => generateFieldCode(f, indent + 2))
      .join(',\n')

    return `${spaces}{
${spaces}  name: '${field.name}',
${spaces}  type: 'group',
${spaces}  fields: [
${nestedFields}
${spaces}  ]
${spaces}}`
  }

  let code = `${spaces}{\n${spaces}  name: '${field.name}',\n${spaces}  type: '${field.type}'`

  if (field.required) {
    code += `,\n${spaces}  required: true`
  }

  if (field.unique) {
    code += `,\n${spaces}  unique: true`
  }

  if (field.index) {
    code += `,\n${spaces}  index: true`
  }

  if (field.validate) {
    code += `,\n${spaces}  validate: ${field.validate}`
  }

  code += `\n${spaces}}`

  return code
}
```

**Validation**:
- [ ] TypeScript compiles without errors
- [ ] All fields included
- [ ] Proper imports added
- [ ] Access control configured

### Phase 5: Write File

**Purpose**: Write generated code to correct location

**File Path Pattern**:
```
src/collections/${CollectionName}/index.ts
```

**Process**:
```typescript
async function writeCollectionConfig(
  collectionName: string,
  code: string
): Promise<string> {
  const pascalName = pascalCase(collectionName)
  const dirPath = path.join(process.cwd(), 'src', 'collections', pascalName)
  const filePath = path.join(dirPath, 'index.ts')

  // Create directory if needed
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }

  // Write file
  fs.writeFileSync(filePath, code, 'utf-8')

  return filePath
}
```

**Validation**:
- [ ] Directory created
- [ ] File written
- [ ] File readable

## Example Generation

### Input MDX Files

**File 1: `providers/4change-energy.mdx`**
```yaml
---
title: 4Change Energy Review
slug: 4change-energy
status: published
publish_date: 2023-01-15
seo_title: 4Change Energy Plans & Rates
meta_description: Compare 4Change Energy electricity plans and rates.
wp_slug: 4change-energy-review
wp_post_id: 12345
---
```

**File 2: `providers/amigo-energy.mdx`**
```yaml
---
title: Amigo Energy Review
slug: amigo-energy
status: draft
publish_date: 2023-02-20
seo_title: Amigo Energy Texas Electricity
---
```

### Field Discovery Results

```typescript
{
  fields: [
    { name: 'title', types: ['string'], required: 2, total: 2 },
    { name: 'slug', types: ['string'], required: 2, total: 2 },
    { name: 'status', types: ['string'], required: 2, total: 2 },
    { name: 'publish_date', types: ['string'], required: 2, total: 2 },
    { name: 'seo_title', types: ['string'], required: 2, total: 2 },
    { name: 'meta_description', types: ['string'], required: 1, total: 2 },
    { name: 'wp_slug', types: ['string'], required: 1, total: 2 },
    { name: 'wp_post_id', types: ['number'], required: 1, total: 2 }
  ],
  totalFiles: 2
}
```

### Generated CollectionConfig

```typescript
import type { CollectionConfig } from 'payload'
import { adminOnly } from '@/access/adminOnly'

export const Providers: CollectionConfig = {
  slug: 'providers',
  labels: {
    singular: 'Provider',
    plural: 'Providers'
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'status', 'publishedAt']
  },
  access: {
    read: () => true,
    create: adminOnly,
    update: adminOnly,
    delete: adminOnly
  },
  versions: {
    drafts: true,
    maxPerDoc: 50
  },
  trash: true,
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' }
      ]
    },
    {
      name: 'publishedAt',
      type: 'date',
      required: true
    },
    {
      name: 'seo',
      type: 'group',
      fields: [
        {
          name: 'title',
          type: 'text'
        },
        {
          name: 'metaDescription',
          type: 'textarea'
        }
      ]
    },
    {
      name: 'wordpress',
      type: 'group',
      fields: [
        {
          name: 'slug',
          type: 'text'
        },
        {
          name: 'postId',
          type: 'number'
        }
      ]
    }
  ]
}
```

## Scripts Reference

### `scripts/analyze-fields.ts`

**Purpose**: Scan MDX files and discover all fields

**Usage**:
```bash
pnpm tsx .claude/skills/payload-schema-generator/scripts/analyze-fields.ts \
  --directory /path/to/mdx/files \
  --output field-analysis.json
```

**Output**: JSON file with field discovery results

### `scripts/generate-schema.ts`

**Purpose**: Generate CollectionConfig from field analysis

**Usage**:
```bash
pnpm tsx .claude/skills/payload-schema-generator/scripts/generate-schema.ts \
  --input field-analysis.json \
  --collection providers \
  --output src/collections/Providers/index.ts
```

**Output**: TypeScript CollectionConfig file

## Validation Checklist

Before marking schema generation complete, verify:

- [ ] All MDX files scanned
- [ ] All frontmatter fields discovered
- [ ] Field types correctly mapped
- [ ] Related fields grouped
- [ ] Required fields identified correctly
- [ ] TypeScript code generated
- [ ] Code compiles without errors
- [ ] File written to correct location
- [ ] Access control configured (adminOnly)
- [ ] Soft-delete enabled (trash: true)
- [ ] Versioning enabled (versions: { drafts: true })
- [ ] Default columns set
- [ ] useAsTitle configured

## Troubleshooting

### Issue: Type Ambiguity

**Symptom**: Field has multiple types (string AND number)

**Cause**: Inconsistent data across files

**Fix**:
1. Review sample values
2. Choose dominant type
3. Add validation to enforce type
4. Document warning

### Issue: Missing Fields

**Symptom**: Not all fields discovered

**Cause**: Parse errors or incomplete file scan

**Fix**:
1. Check file glob pattern
2. Verify MDX files parse correctly
3. Review frontmatter syntax
4. Re-run analysis

### Issue: Generated Code Doesn't Compile

**Symptom**: TypeScript errors in generated file

**Cause**: Invalid field names or syntax

**Fix**:
1. Check field name camelCase conversion
2. Verify all field types are valid Payload types
3. Review generated code manually
4. Fix template issues

### Issue: Groups Not Created

**Symptom**: Related fields not grouped

**Cause**: Prefix detection failed

**Fix**:
1. Review grouping logic
2. Check field name patterns
3. Manually group fields if needed
4. Update grouping rules

## Best Practices

1. **Analyze All Files First**: Don't generate schema from partial data
2. **Review Sample Values**: Verify type detection is correct
3. **Test Compilation**: Ensure generated TypeScript compiles
4. **Check Required Fields**: Don't mark everything required
5. **Use Groups Wisely**: Group related fields for better UX
6. **Add Validation**: Use validators from `src/utilities/validators/`
7. **Document Decisions**: Comment unusual field mappings

## Resources

- **Payload Fields Documentation**: https://payloadcms.com/docs/fields/overview
- **CollectionConfig Type**: https://payloadcms.com/docs/configuration/collections
- **Access Control**: https://payloadcms.com/docs/access-control/overview

---

**Created**: 2025-10-24
**Version**: 1.0
**Use**: Ask "Generate Payload schema for [collection]"
