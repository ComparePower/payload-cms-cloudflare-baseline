# MDX Component → Payload Block Mapping

## Analysis Summary

**Total Unique Components**: 49
**Total Entries**: 157
**Entries with Images**: 93 (124 with hero images)

---

## Component Categories

### 1. Text Replacement Patterns → Inline Blocks

These are simple text substitutions that can map to existing Payload inline blocks:

| MDX Pattern | Payload Inline Block | Status |
|------------|---------------------|---------|
| `%currentyear%` | CurrentYear | ✅ Exists |
| `<CurrentYearDirect />` | CurrentYear | ✅ Exists |
| `%sep%` | SiteSeparator | ⚠️ Need to create |
| `%sitename%` | SiteName | ⚠️ Need to create |
| `%title%` | PageTitle | ⚠️ Need to create |

**Action**: Create 3 new inline blocks for SEO patterns

---

### 2. Phone Number Components → Dynamic Data Inline Blocks

All phone number components should map to existing DynamicDataInstanceSimple blocks:

| MDX Component | Map To | Notes |
|--------------|--------|-------|
| `<AmigoPhoneNumber />` | Dynamic Value (Simple) | Link to Amigo Energy instance |
| `<CirroEnergyPhoneNumber />` | Dynamic Value (Simple) | Link to Cirro Energy instance |
| `<ConstellationPhoneNumber />` | Dynamic Value (Simple) | Link to Constellation instance |
| `<DirectEnergyPhoneNumber />` | Dynamic Value (Simple) | Link to Direct Energy instance |
| `<DiscountPowerPhoneNumber />` | Dynamic Value (Simple) | Link to Discount Power instance |
| `<FlagshipPhoneNumber />` | Dynamic Value (Simple) | Link to Flagship instance |
| `<FourChangePhoneNumber />` | Dynamic Value (Simple) | Link to 4Change instance |
| `<FrontierPhoneNumber />` | Dynamic Value (Simple) | Link to Frontier instance |
| `<FrontierPhoneNumberLinkRc />` | Dynamic Value (Simple) | Link to Frontier instance |
| `<GexaPhoneNumber />` | Dynamic Value (Simple) | Link to Gexa instance |
| `<GreenMountainPhoneNumber />` | Dynamic Value (Simple) | Link to Green Mountain instance |
| `<JustPhoneNumber />` | Dynamic Value (Simple) | Link to Just Energy instance |
| `<NewPowerPhoneNumber />` | Dynamic Value (Simple) | Link to New Power instance |
| `<PaylessPowerPhoneNumber />` | Dynamic Value (Simple) | Link to Payless Power instance |
| `<PulsePowerPhoneNumber />` | Dynamic Value (Simple) | Link to Pulse Power instance |
| `<ReliantPhoneNumber />` | Dynamic Value (Simple) | Link to Reliant instance |
| `<RhythmEnergyPhone />` | Dynamic Value (Simple) | Link to Rhythm instance |
| `<TaraEnergyPhoneNumber />` | Dynamic Value (Simple) | Link to Tara Energy instance |
| `<TxuPhoneNumber />` | Dynamic Value (Simple) | Link to TXU instance |

**Action**:
1. Create RichTextDataInstances for all providers
2. During migration, replace phone components with inline blocks referencing correct instance

---

### 3. Interactive/Data Components → Editor Blocks

These require custom Payload blocks with placeholders/notes:

| MDX Component | Payload Block | Implementation |
|--------------|---------------|----------------|
| `<RatesTable ... />` | EditorBlock | Note: "RATES TABLE - provider={id}, utility={id}" |
| `<ZipcodeSearchbar ... />` | EditorBlock | Note: "CTA: ZIPCODE SEARCH - text={...}" |
| `<TocRankMath ... />` | EditorBlock | Note: "TABLE OF CONTENTS (auto-generate on frontend)" |
| `<FaqRankMath ... />` | EditorBlock | Note: "FAQ SCHEMA (convert to FAQ block)" |
| `<HelpMeChoose />` | EditorBlock | Note: "INTERACTIVE: Help Me Choose tool" |
| `<ProviderCard ... />` | EditorBlock | Note: "PROVIDER CARD - provider={...}" |
| `<ProvidersPhoneTable />` | EditorBlock | Note: "PROVIDERS PHONE TABLE" |
| `<AdvisorPostsTabs />` | EditorBlock | Note: "ADVISORS TAB COMPONENT" |
| `<VcBasicGrid>` | EditorBlock | Note: "VISUAL COMPOSER GRID (legacy WP)" |

**Action**: Create generic "EditorBlock" with fields:
- `componentType`: string (e.g., "RatesTable")
- `originalProps`: json (store all original props)
- `editorNotes`: richText (instructions for authors)

---

### 4. Dynamic Data Components → Editor Blocks

| MDX Component | Purpose | Implementation |
|--------------|---------|----------------|
| `<AvgTexasResidentialRate />` | Display current avg rate | EditorBlock - Astro handles on frontend |
| `<ComparepowerReviewCount />` | Display review count | EditorBlock - Astro handles on frontend |
| `<LowestRateDisplay />` | Show lowest available rate | EditorBlock - Astro handles on frontend |
| `<PopularCitiesList />` | List of popular cities | EditorBlock - Standard Astro component |
| `<PopularZipcodes />` | List of popular zipcodes | EditorBlock - Standard Astro component |

**Action**: Create EditorBlocks that preserve component type and props for Astro to render

---

### 5. Legacy WordPress Blocks → Editor Blocks

| Component | Notes |
|-----------|-------|
| `<WpBlock59853>` through `<WpBlock94368>` | Legacy WP blocks - store as EditorBlocks with IDs for reference |

**Action**: Store with original WP block ID for future reference/migration

---

## Migration Strategy by Component Type

### Phase 1: Simple Replacements
1. Text patterns (`%currentyear%`, etc.) → Inline blocks
2. Standard markdown (headers, lists, links, etc.) → Lexical native

### Phase 2: Phone Numbers
1. Create all provider phone number instances in RichTextDataInstances
2. Replace `<*PhoneNumber />` → DynamicDataInstanceSimple inline blocks

### Phase 3: Complex Components
1. Parse component props to JSON
2. Create EditorBlock entries with:
   - Component type
   - Original props
   - Clear notes for authors

### Phase 4: Verification
1. Check all components mapped
2. Generate report of unmapped components
3. Manual review of EditorBlocks

---

## Payload Blocks to Create

### New Inline Blocks
```typescript
- SiteSeparator: Block  // For %sep%
- SiteName: Block       // For %sitename%
- PageTitle: Block      // For %title%
```

### New Editor Block
```typescript
EditorBlock: Block {
  fields: [
    {
      name: 'componentType',
      type: 'select',
      options: ['RatesTable', 'ZipcodeSearchbar', 'TocRankMath', ...]
    },
    {
      name: 'originalProps',
      type: 'json'
    },
    {
      name: 'editorNotes',
      type: 'richText'
    },
    {
      name: 'wpBlockId',
      type: 'text'  // For legacy WP blocks
    }
  ]
}
```

---

## Success Metrics

- [ ] All 49 components mapped or documented
- [ ] Phone numbers converted to dynamic inline blocks
- [ ] Interactive components preserved as EditorBlocks
- [ ] Zero data loss
- [ ] Clear notes for all unmapped functionality

---

## Next Steps

1. Create the 3 new inline blocks (SiteSeparator, SiteName, PageTitle)
2. Create EditorBlock block definition
3. Create provider phone number instances (19 providers)
4. Build migration script with component replacement logic
5. Test migration on 5 sample entries
6. Review and refine
7. Execute full migration
