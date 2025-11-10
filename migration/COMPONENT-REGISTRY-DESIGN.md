# Component Registry Design - Type-Safe MDX ↔ Payload Mapping

**Related Issue**: [#2 - Robust MDX Importer (CRITICAL)](https://github.com/ComparePower/cp-cms-payload-cms-mongo/issues/2)

**Purpose**: Create a centralized, type-safe registry that tracks all MDX components, their Payload CMS mappings, implementation status, and provides utilities for both migration and rendering.

---

## Overview

The Component Registry serves as the **single source of truth** for all MDX component mappings in the migration pipeline. It addresses the critical issue of unmapped components causing raw MDX text to appear in migrated content.

### Key Benefits

✅ **Type-Safe** - TypeScript interfaces ensure correctness
✅ **Self-Documenting** - Generate reports automatically
✅ **Migration Validation** - Fail-fast on unmapped components
✅ **Rendering Engine** - Map Payload blocks back to Astro components
✅ **Progress Tracking** - See what's implemented, what needs work
✅ **Prevents Regressions** - Can't use unmapped components

---

## Architecture

### Type Definitions

```typescript
export type ComponentStatus =
  | 'implemented'      // Fully implemented with Payload block
  | 'placeholder'      // Has block definition but no frontend component
  | 'needs-work'       // Stub or incomplete implementation
  | 'deprecated'       // Should be removed from MDX
  | 'alias'            // Maps to another component

export type ComponentType =
  | 'block'           // Block-level component (standalone)
  | 'inline'          // Inline component (within text)
  | 'wrapper'         // Structural wrapper (stripped during parsing)

export interface ComponentField {
  name: string
  type: 'string' | 'number' | 'boolean' | 'relationship' | 'richText' | 'image' | 'array'
  required?: boolean
  description?: string
  defaultValue?: any
}

export interface ComponentMapping {
  // === SOURCE (MDX/Astro) ===
  mdxName: string                      // e.g., "ReliantPhoneNumber"
  astroComponentPath?: string          // e.g., "src/components/phone/ReliantPhoneNumber.astro"
  usageCount?: number                  // How many times used in source MDX

  // === TARGET (Payload) ===
  payloadBlockSlug: string             // e.g., "reliantPhoneNumber"
  payloadBlockPath?: string            // e.g., "src/lexical/blocks/ReliantPhoneNumberBlock.ts"
  payloadInterfaceName?: string        // e.g., "ReliantPhoneNumberBlockType"

  // === METADATA ===
  componentType: ComponentType
  status: ComponentStatus
  fields: ComponentField[]

  // === IMPLEMENTATION TRACKING ===
  notes?: string                       // General notes
  todos?: string[]                     // What needs to be done
  aliasOf?: string                     // If alias, what component does it map to

  // === RENDERING CAPABILITIES ===
  canRenderInline: boolean            // Can be used within text
  canRenderBlock: boolean             // Can be used as standalone block
  requiresDataInstance?: boolean      // Needs RichTextDataInstance relationship

  // === WORDPRESS LEGACY ===
  wpBlockId?: number                  // Original WordPress block ID
  wpBlockName?: string                // Original WordPress block name
}
```

### Registry Structure

```typescript
export const COMPONENT_REGISTRY: Record<string, ComponentMapping> = {
  'ComponentName': {
    mdxName: 'ComponentName',
    payloadBlockSlug: 'componentName',
    componentType: 'block' | 'inline' | 'wrapper',
    status: 'implemented' | 'needs-work' | 'deprecated' | 'alias',
    fields: [...],
    // ... other properties
  }
}
```

---

## Utility Functions

### Core Functions

#### `getComponentMapping(mdxName: string): ComponentMapping | undefined`
Get component mapping by MDX name.

```typescript
const mapping = getComponentMapping('ReliantPhoneNumber')
// Returns full ComponentMapping object
```

#### `isComponentImplemented(mdxName: string): boolean`
Check if component is fully implemented.

```typescript
if (!isComponentImplemented('EiaMonth')) {
  throw new Error('Component not implemented')
}
```

#### `validateComponent(mdxName: string, props: Record<string, any>)`
Validate component during migration with detailed error messages.

```typescript
const result = validateComponent('RatesTable', { provider: 'reliant' })
if (!result.valid) {
  console.error(result.error)
  console.log('TODOs:', result.mapping?.todos)
}
```

#### `getPayloadBlockSlug(mdxName: string): string | null`
Get Payload block slug for MDX component (handles aliases).

```typescript
const slug = getPayloadBlockSlug('WpBlock75232_EnergySavingsArticlesCopy')
// Returns: 'wpBlock59853_EnergySavingsArticles' (resolved alias)
```

### Query Functions

#### `getComponentsByStatus(status: ComponentStatus): ComponentMapping[]`
Get all components with a specific status.

```typescript
const needsWork = getComponentsByStatus('needs-work')
// Returns array of unmapped components
```

#### `getUnmappedComponents(): ComponentMapping[]`
Get all components that need implementation.

```typescript
const unmapped = getUnmappedComponents()
console.log(`${unmapped.length} components need work`)
```

### Reporting Functions

#### `generateImplementationReport(): string`
Generate markdown report of implementation status.

```typescript
const report = generateImplementationReport()
fs.writeFileSync('migration/IMPLEMENTATION-REPORT.md', report)
```

---

## Integration Points

### 1. Migration Validation

**File**: `scripts/migration/lib/mdx-component-validator.ts`

```typescript
import { validateComponent, COMPONENT_REGISTRY } from './component-registry'

export function validateMDXComponent(
  componentName: string,
  props: Record<string, any>,
  filePath: string
): ComponentValidationError | null {
  const result = validateComponent(componentName, props)

  if (!result.valid) {
    return {
      componentName,
      filePath,
      props,
      message: result.error!,
      suggestion: result.mapping?.todos?.join('\n') || 'See component registry'
    }
  }

  return null
}
```

### 2. MDX Parser

**File**: `scripts/migration/lib/mdx-to-payload-blocks.ts`

```typescript
import { isComponentImplemented, getPayloadBlockSlug } from './component-registry'

// During MDX parsing
const componentName = node.name

if (!isComponentImplemented(componentName)) {
  throw new Error(`Unmapped component: ${componentName}`)
}

const payloadSlug = getPayloadBlockSlug(componentName)
```

### 3. Lexical-to-Astro Renderer

**File**: `src/lib/lexical-to-astro-renderer.ts` (to be created)

```typescript
import { getComponentMapping } from '@/scripts/migration/lib/component-registry'

function renderInlineBlock(node: LexicalInlineBlock) {
  const mapping = getComponentMapping(node.blockType)

  if (!mapping || !mapping.canRenderInline) {
    throw new Error(`Cannot render ${node.blockType} as inline`)
  }

  // Import Astro component dynamically
  const Component = await import(mapping.astroComponentPath!)
  return <Component {...node.fields} />
}
```

### 4. Pre-Migration Analysis

**File**: `migration/scripts/analyze-mdx-components.mjs`

```typescript
import { COMPONENT_REGISTRY, generateImplementationReport } from '../lib/component-registry'

// Scan all MDX files
const components = await scanMDXForComponents()

// Compare with registry
const missing = components.filter(c => !COMPONENT_REGISTRY[c.name])

console.log(`Found ${missing.length} components not in registry`)

// Generate report
const report = generateImplementationReport()
fs.writeFileSync('migration/IMPLEMENTATION-REPORT.md', report)
```

---

## Example Component Entries

### Implemented Inline Component

```typescript
'ReliantPhoneNumber': {
  mdxName: 'ReliantPhoneNumber',
  astroComponentPath: 'src/components/phone/ReliantPhoneNumber.astro',
  payloadBlockSlug: 'reliantPhoneNumber',
  payloadBlockPath: 'src/lexical/inlineBlocks.ts',
  componentType: 'inline',
  status: 'implemented',
  fields: [],
  canRenderInline: true,
  canRenderBlock: false,
  requiresDataInstance: true,
  notes: 'Displays Reliant Energy phone number from RichTextDataInstances'
}
```

### Implemented Block Component

```typescript
'RatesTable': {
  mdxName: 'RatesTable',
  astroComponentPath: 'src/components/tables/RatesTable.astro',
  payloadBlockSlug: 'ratesTable',
  payloadBlockPath: 'src/lexical/blocks/RatesTableBlock.ts',
  componentType: 'block',
  status: 'implemented',
  usageCount: 1149,
  fields: [
    { name: 'provider', type: 'string', required: false },
    { name: 'city', type: 'string', required: false }
  ],
  canRenderInline: false,
  canRenderBlock: true,
  notes: 'Displays electricity rates comparison table'
}
```

### Needs Work Component

```typescript
'EiaMonth': {
  mdxName: 'EiaMonth',
  astroComponentPath: 'src/components/wp-shortcodes/EiaMonth.astro',
  payloadBlockSlug: 'eiaMonth',
  componentType: 'block',
  status: 'needs-work',
  usageCount: 885,
  fields: [
    {
      name: 'date',
      type: 'string',
      required: false,
      description: 'Display date (e.g., "February 2025")',
      defaultValue: 'Current month'
    }
  ],
  canRenderInline: false,
  canRenderBlock: true,
  todos: [
    'Create Payload block definition at src/lexical/blocks/EiaMonthBlock.ts',
    'Add to CONTENT_BLOCKS array in src/lexical/blocks/index.ts',
    'Create Astro rendering component',
    'Test migration with sample MDX files'
  ],
  notes: 'Simple date display component - outputs: "Updated February 2025"'
}
```

### Deprecated/Empty Stub

```typescript
'WpBlock60549_Unknown': {
  mdxName: 'WpBlock60549_Unknown',
  astroComponentPath: 'src/components/wp-blocks/WpBlock60549_Unknown.astro',
  payloadBlockSlug: 'wpBlock60549_Unknown',
  componentType: 'block',
  status: 'deprecated',
  usageCount: 882,
  wpBlockId: 60549,
  fields: [],
  canRenderInline: false,
  canRenderBlock: false,
  todos: [
    'Investigate original WordPress block ID 60549',
    'Determine if should be removed or implemented',
    'Update migration to skip this component'
  ],
  notes: 'EMPTY STUB - component has no content. Used 882 times but renders nothing.'
}
```

### Alias Component

```typescript
'WpBlock75232_EnergySavingsArticlesCopy': {
  mdxName: 'WpBlock75232_EnergySavingsArticlesCopy',
  payloadBlockSlug: 'wpBlock59853_EnergySavingsArticles',
  componentType: 'block',
  status: 'alias',
  usageCount: 882,
  aliasOf: 'WpBlock59853_EnergySavingsArticles',
  wpBlockId: 75232,
  fields: [],
  canRenderInline: false,
  canRenderBlock: true,
  notes: 'Alias of WpBlock59853. Map to existing block during migration.'
}
```

### Wrapper Component (Stripped)

```typescript
'Section': {
  mdxName: 'Section',
  payloadBlockSlug: '', // Not mapped
  componentType: 'wrapper',
  status: 'implemented',
  usageCount: 6601,
  fields: [],
  canRenderInline: false,
  canRenderBlock: false,
  notes: 'Structural wrapper - stripped during MDX parsing, children extracted'
}
```

---

## Implementation Phases

### Phase 1: Core Registry (Week 1)

**Tasks**:
1. Create `scripts/migration/lib/component-registry.ts` with type definitions
2. Populate registry with all currently mapped components (23 blocks, 21 inline)
3. Add utility functions (getComponentMapping, isImplemented, validate, etc.)
4. Create unit tests for registry functions

**Deliverables**:
- `component-registry.ts` with 44+ component entries
- Test suite with 100% coverage
- Generated report showing current status

### Phase 2: Migration Integration (Week 2)

**Tasks**:
1. Update `mdx-component-validator.ts` to use registry
2. Update `mdx-to-payload-blocks.ts` to validate against registry
3. Add fail-fast validation to migration scripts
4. Create `analyze-mdx-components.mjs` to scan source files

**Deliverables**:
- Migration fails immediately on unmapped components
- Pre-migration analysis script that shows gaps
- Updated migration documentation

### Phase 3: Unmapped Components (Week 3)

**Tasks**:
1. Add all 11 unmapped components to registry with status='needs-work'
2. Prioritize by usage count (EiaMonth: 885, EiaRatesChart: 885, etc.)
3. Create Payload block definitions for high-priority components
4. Test migration with new blocks

**Deliverables**:
- 8 new Payload block definitions
- 3 deprecated components documented
- Migration succeeds on all source MDX files

### Phase 4: Rendering Engine (Week 4)

**Tasks**:
1. Create `lexical-to-astro-renderer.ts` utility
2. Implement component registry lookups for rendering
3. Build Astro integration for Lexical content
4. Add data instance resolution for dynamic components

**Deliverables**:
- Lexical-to-Astro renderer
- Round-trip capability: MDX → Payload → Astro
- Documentation and examples

---

## Maintenance Guidelines

### Adding New Components

When adding a new component to the system:

1. **Add to Registry First**
```typescript
'NewComponent': {
  mdxName: 'NewComponent',
  payloadBlockSlug: 'newComponent',
  componentType: 'block', // or 'inline'
  status: 'needs-work',
  fields: [],
  canRenderInline: false,
  canRenderBlock: true,
  todos: [
    'Create Payload block definition',
    'Create Astro rendering component',
    'Test migration'
  ]
}
```

2. **Create Payload Block Definition**
```bash
# File: src/lexical/blocks/NewComponentBlock.ts
```

3. **Update Status to 'implemented'**
```typescript
status: 'implemented',
payloadBlockPath: 'src/lexical/blocks/NewComponentBlock.ts',
```

4. **Generate Report**
```bash
pnpm tsx migration/scripts/generate-implementation-report.mjs
```

### Deprecating Components

1. **Update Status**
```typescript
status: 'deprecated',
todos: ['Remove from source MDX', 'Update migration to skip']
```

2. **Update Migration Script**
- Handle deprecated components gracefully
- Log warnings when encountered
- Replace with empty block or skip

### Creating Aliases

1. **Add Alias Entry**
```typescript
'ComponentAlias': {
  mdxName: 'ComponentAlias',
  payloadBlockSlug: 'originalComponent',
  status: 'alias',
  aliasOf: 'OriginalComponent',
  // ... other fields
}
```

2. **Update Parser**
- `getPayloadBlockSlug()` automatically resolves aliases

---

## Testing Strategy

### Unit Tests

```typescript
describe('Component Registry', () => {
  test('getComponentMapping returns correct mapping', () => {
    const mapping = getComponentMapping('ReliantPhoneNumber')
    expect(mapping?.status).toBe('implemented')
  })

  test('isComponentImplemented checks status', () => {
    expect(isComponentImplemented('ReliantPhoneNumber')).toBe(true)
    expect(isComponentImplemented('EiaMonth')).toBe(false)
  })

  test('validateComponent catches unmapped components', () => {
    const result = validateComponent('UnknownComponent', {})
    expect(result.valid).toBe(false)
    expect(result.error).toContain('Unknown component')
  })

  test('getPayloadBlockSlug resolves aliases', () => {
    const slug = getPayloadBlockSlug('WpBlock75232_EnergySavingsArticlesCopy')
    expect(slug).toBe('wpBlock59853_EnergySavingsArticles')
  })
})
```

### Integration Tests

```typescript
describe('Migration with Registry', () => {
  test('migration fails on unmapped component', async () => {
    const mdx = '<UnmappedComponent />'
    await expect(migrateMDX(mdx)).rejects.toThrow('Unmapped component')
  })

  test('migration succeeds with all mapped components', async () => {
    const mdx = '<RatesTable provider="reliant" />'
    const result = await migrateMDX(mdx)
    expect(result.success).toBe(true)
  })
})
```

---

## Report Generation

### Implementation Status Report

Run to see current progress:

```bash
pnpm tsx migration/scripts/generate-implementation-report.mjs
```

**Output**: `migration/IMPLEMENTATION-REPORT.md`

```markdown
# Component Implementation Report

## Summary
- **Total Components**: 55
- **Implemented**: 44
- **Needs Work**: 8
- **Deprecated**: 3
- **Aliases**: 1
- **Total MDX Usage**: 15,234

## Needs Work (8)
### EiaMonth
- **Usage**: 885 times
- **Type**: block
- **Payload Slug**: eiaMonth
- **TODOs**:
  - [ ] Create Payload block definition
  - [ ] Add to CONTENT_BLOCKS array
  - [ ] Create rendering component
  - [ ] Test migration

...
```

---

## Related Documentation

- [UNMAPPED-COMPONENTS-ANALYSIS.md](./UNMAPPED-COMPONENTS-ANALYSIS.md) - Initial analysis of unmapped components
- [MIGRATION-REPORT.md](./MIGRATION-REPORT.md) - Complete migration status
- [Issue #2: Robust MDX Importer](https://github.com/ComparePower/cp-cms-payload-cms-mongo/issues/2)

---

**Status**: Design Complete - Ready for Implementation

**Created**: 2025-10-27
**Last Updated**: 2025-10-27
