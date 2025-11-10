# Content Migration Plan: Keystatic → Payload CMS

## Overview
Migrating content from Keystatic/Astro Content Collections to Payload CMS with full MDX conversion, hierarchy preservation, and component mapping.

## Source
`/Users/brad/_CODE_DEV_PROJECTS/cp-content-site-astro/src/content/front-end/`

## Target
Payload CMS (MongoDB) via REST API

---

## Phase 1: Providers Collection Migration

### Current Status
- [ ] Analysis Complete
- [ ] Component Mapping Complete
- [ ] Migration Script Ready
- [ ] Test Migration Executed
- [ ] Issues Documented
- [ ] Full Migration Executed
- [ ] Verification Complete

### Structure Understanding

**Hierarchy Rules:**
1. Any folder with `index.mdx` = Collection entry
2. Nested folders with `index.mdx` = Child entries (relationships)
3. `images/` folders = Ignored for hierarchy
4. Deepest non-image folder = Final level

**Example Structure:**
```
providers/
├── index.mdx                                    → Root entry (parent: null)
├── comparisons/
│   ├── index.mdx                               → Child entry (parent: providers)
│   └── reliant-vs-direct-energy/
│       ├── index.mdx                           → Grandchild (parent: comparisons)
│       ├── heroImage.png
│       └── images/                             → Contains referenced images
├── top-energy-companies/
│   ├── index.mdx                               → Child entry (parent: providers)
│   └── best-companies-for-low-usage/
│       └── index.mdx                           → Grandchild
└── texas-electricity-energy-companies/
    └── txu-energy-plans-electricity-rates/
        └── index.mdx                           → Deep nesting

```

### Content Format

**Frontmatter Fields:**
- `title`: Post title
- `wp_slug`: URL slug
- `wp_post_id`: Legacy WordPress ID
- `seo_title`: SEO title (may contain inline components like `%currentyear%`)
- `seo_meta_desc`: Meta description
- `target_keyword`: SEO keyword
- `draft`: Boolean
- `pubDate`: Published date
- `updatedDate`: Updated date
- `wp_author`: Author name
- `cp_hero_heading_line_1`: Hero heading line 1
- `cp_hero_heading_line_2`: Hero heading line 2
- `cp_hero_cta_text`: CTA button text
- `post_author_team_member_is`: Array of author IDs
- `post_editor_team_member_is`: Array of editor IDs
- `post_checker_team_member_is`: Array of checker IDs

**MDX Components Found:**
- `<TocRankMath>` - Table of contents
- `<ZipcodeSearchbar>` - Zip code search form
- `<RatesTable>` - Electricity rates table
- `<CurrentYearDirect />` - Inline year component (in frontmatter)
- `%currentyear%` - Text replacement pattern

**Image Handling:**
- `heroImage.png` - Featured/hero image
- `images/*` - Referenced in MDX content

---

## Migration Strategy

### 1. Analysis Phase ✅
- [x] Scan all `index.mdx` files in providers
- [x] Build hierarchy tree (parent/child relationships)
- [x] Extract all MDX components used
- [x] Identify all image references
- [x] Count total entries

### 2. Component Validation Phase (NEW - CRITICAL)
- [ ] For each unique component found:
  1. [ ] Locate component in Astro project (`/Users/brad/_CODE_DEV_PROJECTS/cp-content-site-astro/src/components/`)
  2. [ ] Extract TypeScript interface/props definition
  3. [ ] Validate component exists (ERROR if not found)
  4. [ ] Parse all component usages in MDX files
  5. [ ] Validate props against TypeScript interface:
     - [ ] Check for missing required props
     - [ ] Check for invalid/unsupported props
     - [ ] Check for type mismatches
     - [ ] Check for malformed/unescaped props
  6. [ ] Generate validation report with:
     - [ ] Component name
     - [ ] Expected props (from TS interface)
     - [ ] All usages with props
     - [ ] Errors/issues per usage
- [ ] Create Payload block definitions with fields matching component props
- [ ] Report all validation errors for review

**Critical**: This ensures data quality and type safety before migration!

### 3. Component Mapping
- [ ] Map `<TocRankMath>` → Payload block
- [ ] Map `<ZipcodeSearchbar>` → Payload block
- [ ] Map `<RatesTable>` → Payload block
- [ ] Map `<CurrentYearDirect />` → Payload inline block
- [ ] Map `%currentyear%` → Payload inline block
- [ ] Create unmapped component placeholders

### 3. Migration Execution
- [ ] Convert MDX → Lexical JSON (Payload converter)
- [ ] Upload images to Payload Media
- [ ] Create/link team member relationships
- [ ] Build parent/child entry relationships
- [ ] Preserve URL slugs
- [ ] Maintain SEO metadata

### 4. Verification
- [ ] Check all entries created
- [ ] Verify hierarchy relationships
- [ ] Confirm images uploaded/linked
- [ ] Test rendered output
- [ ] Compare with source

---

## File Structure

```
migration/
├── 00-MIGRATION-PLAN.md                (This file)
├── 01-providers-analysis.json          (Analysis results)
├── 02-component-mapping.md             (Component → Payload mapping)
├── 03-component-validation.md          (Validation report)
├── 04-issues.json                      (Tracked issues)
├── 05-migration-log.md                 (Execution log)
├── scripts/
│   ├── analyze-providers.mjs           (Structure analysis) ✅
│   ├── validate-components.mjs         (Component validation) 🆕
│   ├── migrate-providers.mjs           (Main migration)
│   └── verify-migration.mjs            (Post-migration checks)
└── data/
    ├── providers-tree.json             (Hierarchy tree) ✅
    ├── components-found.json           (All components) ✅
    ├── component-validation.json       (Validation results) 🆕
    ├── component-props.json            (Component interfaces) 🆕
    └── images-map.json                 (Image references)
```

---

## Success Criteria

- ✅ All `index.mdx` files converted to Payload entries
- ✅ Parent/child relationships preserved
- ✅ All images uploaded and linked
- ✅ MDX components mapped or documented
- ✅ SEO metadata intact
- ✅ URL slugs match source
- ✅ Zero data loss
- ✅ All issues documented

---

## Next Steps

1. ✅ Run analysis script
2. ✅ Review findings
3. ✅ Map components
4. ✅ Run component validation (finds Astro components, validates props, reports errors)
5. ✅ Create comprehensive seeding architecture
6. ⏭️ Review validation errors and decide on fixes
7. ⏭️ Generate Payload block definitions from component props
8. ⏭️ Prepare seed data (MDX → Lexical conversion)
9. ⏭️ Execute test seeding on fresh Payload instance (5 entries)
10. ⏭️ Execute full database seeding (157 entries)
11. ⏭️ Verify and document

**Architecture**: See [SEEDING-ARCHITECTURE.md](./SEEDING-ARCHITECTURE.md) for complete system design

**Next Action**: Review [03-component-validation-report.md](./03-component-validation-report.md) and address critical errors
