# Component Validation Report

**Date**: 2025-10-23
**Validation Script**: `scripts/validate-components.mjs`
**Source**: 157 MDX files, 49 unique components

---

## Executive Summary

Validation of all MDX components against their TypeScript interfaces has been completed. This report identifies critical issues that must be resolved before migration.

### Overall Results

| Metric | Count | Percentage |
|--------|-------|------------|
| **Total Components** | 49 | 100% |
| **Components Found** | 34 | 69% |
| **Components Not Found** | 11 | 22% |
| **Text Patterns** | 4 | 8% |
| **Total Usages** | 2,130 | - |
| **Valid Usages** | 612 | 29% |
| **Invalid Usages** | 1,518 | 71% |
| **Critical Errors** | 39 | - |
| **Warnings** | 6,098 | - |

### Status

🔴 **MIGRATION BLOCKED** - Critical errors must be resolved before proceeding.

---

## Critical Errors (MUST FIX)

### 1. FaqRankMath - Missing Required Prop: `questions`

**Component**: `src/components/legacy/wp-kadence-rm/FaqRankMath.astro`
**Interface**:
```typescript
interface Props {
  questions: FaqQuestion[];  // REQUIRED
  title?: string;
  showNumbers?: boolean;
}
```

**Issue**: 28 instances missing required `questions` prop

**Affected Files**:
1. `comparisons/txu-energy-vs-reliant/index.mdx`
2. `texas-electricity-energy-companies/bkv-energy/index.mdx`
3. `texas-electricity-energy-companies/chariot-energy/index.mdx`
4. `texas-electricity-energy-companies/cirro-energy-plans-electricity-rates/index.mdx`
5. `texas-electricity-energy-companies/direct-energy-plans-electricity-rates/index.mdx`
6. `texas-electricity-energy-companies/energy-texas/index.mdx` (2 instances)
7. `texas-electricity-energy-companies/gexa-energy-plans-electricity-rates/index.mdx`
8. `texas-electricity-energy-companies/good-charlie/index.mdx`
9. `texas-electricity-energy-companies/green-mountain-energy-plans-electricity-rates/index.mdx`
10. `texas-electricity-energy-companies/octopus-energy/index.mdx` (5 instances)
11. `texas-electricity-energy-companies/ohm-connect/index.mdx`
12. `texas-electricity-energy-companies/onpoint-energy/index.mdx`
13. `texas-electricity-energy-companies/payless-power/index.mdx`
14. `texas-electricity-energy-companies/revolution-energy/index.mdx`
15. `texas-electricity-energy-companies/shell-energy/index.mdx`
16. `texas-electricity-energy-companies/tesla-electric/index.mdx`
17. `texas-electricity-energy-companies/texas-electricity-energy-companies/index.mdx`
18. `texas-electricity-energy-companies/top-energy-companies/index.mdx`
19. `texas-electricity-energy-companies/trieagle-energy-plans-electricity-rates/index.mdx`
20. `texas-electricity-energy-companies/txu-energy-vs-reliant/index.mdx`
21. `texas-electricity-energy-companies/v247-power/index.mdx`
22. `texas-electricity-energy-companies/value-power/index.mdx`
23. `top-energy-companies/index.mdx`

**Proposed Solutions**:
- **Option A**: Fix source MDX files to include `questions` prop
- **Option B**: Make `questions` optional in component interface
- **Option C**: Create EditorBlock placeholder during migration with note for authors
- **Recommended**: Option C - Create placeholder block, allow authors to populate FAQ data post-migration

---

### 2. Missing Components - Legacy WordPress Blocks

**Issue**: 11 components referenced in MDX but don't exist in Astro project

**Components Not Found**:
1. `WpBlock59853` - WordPress legacy block
2. `WpBlock60549` - WordPress legacy block
3. `WpBlock61154` - WordPress legacy block
4. `WpBlock61258` - WordPress legacy block
5. `WpBlock61260` - WordPress legacy block
6. `WpBlock61277` - WordPress legacy block
7. `WpBlock75232` - WordPress legacy block
8. `WpBlock77727` - WordPress legacy block
9. `WpBlock81492` - WordPress legacy block
10. `WpBlock84548` - WordPress legacy block
11. `WpBlock94368` - WordPress legacy block

**Analysis**: These are legacy WordPress block IDs that were never migrated to Astro components.

**Proposed Solution**:
- Create generic `EditorBlock` with fields:
  - `componentType`: "WpBlockLegacy"
  - `wpBlockId`: Store the original ID (e.g., "59853")
  - `editorNotes`: "Legacy WordPress block - requires manual conversion"
  - `originalMarkup`: Store the original MDX for reference

**Impact**: Low - These are likely custom WP blocks that need manual review anyway

---

## Warnings (Non-Blocking)

### Phone Number Components - Unknown `name` Prop

**Affected Components** (19 total):
- AmigoPhoneNumber (4 warnings)
- CirroEnergyPhoneNumber (8 warnings)
- ConstellationPhoneNumber (4 warnings)
- DirectEnergyPhoneNumber (8 warnings)
- DiscountPowerPhoneNumber (4 warnings)
- FlagshipPhoneNumber (4 warnings)
- FourChangePhoneNumber (8 warnings)
- FrontierPhoneNumber (16 warnings)
- FrontierPhoneNumberLinkRc (4 warnings)
- GexaPhoneNumber (4 warnings)
- GreenMountainPhoneNumber (4 warnings)
- JustPhoneNumber (4 warnings)
- NewPowerPhoneNumber (4 warnings)
- PaylessPowerPhoneNumber (4 warnings)
- PulsePowerPhoneNumber (4 warnings)
- ReliantPhoneNumber (6 warnings)
- TaraEnergyPhoneNumber (4 warnings)
- TxuPhoneNumber (8 warnings)

**Issue**: Components receive `name="provider-phone-number"` prop but TypeScript interface only defines `providerName?: string`

**Example**:
```mdx
<AmigoPhoneNumber name="amigo-phone-number" />
```

**Expected**:
```mdx
<AmigoPhoneNumber providerName="Amigo Energy" />
```

**Impact**: Medium - Components still render, but `name` prop is unused

**Proposed Solution**:
- **Option A**: Update all MDX files to use correct prop name
- **Option B**: Update component interfaces to accept `name` prop
- **Option C**: Ignore - Migration will map to `DynamicDataInstanceSimple` anyway
- **Recommended**: Option C - These will be replaced with inline blocks during migration

---

### RatesTable - Unknown Props

**Component**: `src/components/legacy/wp-shortcodes/RatesTable.astro`
**Total Warnings**: 384

**Issue**: Component receives many props not defined in TypeScript interface

**Common Unknown Props**:
- `class` (styling)
- Various data-related props

**Impact**: Low - Component likely handles these dynamically

**Proposed Solution**: Review component implementation, add props to interface if needed, or ignore if handled dynamically

---

### TocRankMath - Unknown Props

**Component**: `src/components/legacy/wp-kadence-rm/TocRankMath.astro`
**Total Warnings**: 1,614

**Issue**: Component receives props not in TypeScript interface

**Impact**: Low - ToC components often auto-generate from content

**Proposed Solution**: Create EditorBlock placeholder - Astro will handle ToC generation on frontend

---

### ZipcodeSearchbar - Unknown Props

**Component**: `src/components/legacy/wp-shortcodes/ZipcodeSearchbar.astro`
**Total Warnings**: 3,646

**Issue**: Component receives props not defined in interface

**Impact**: Low - CTA component likely has flexible props

**Proposed Solution**: Create EditorBlock with all props preserved in JSON for frontend rendering

---

### Components Without TypeScript Interfaces

**Affected**:
1. **AdvisorPostsTabs** - No props interface found
2. **AvgTexasResidentialRate** - No props interface found
3. **ComparepowerReviewCount** - No props interface found
4. **RhythmEnergyPhone** - No props interface found
5. **ZipcodeSearchbar** - No props interface found

**Impact**: Medium - Cannot validate props

**Proposed Solution**:
- Review component source files
- Add TypeScript interfaces
- Or create EditorBlocks with flexible props

---

## Successfully Validated Components

### ✅ Zero Issues (9 components)

1. **AdvisorPostsTabs** - 2 usages, all valid
2. **CurrentYearDirect** - 2 usages, all valid
3. **HelpMeChoose** - 2 usages, all valid
4. **LowestRateDisplay** - 100 usages, all valid (most used!)
5. **PopularCitiesList** - 124 usages, all valid
6. **PopularZipcodes** - 128 usages, all valid
7. **ProviderCard** - 74 usages, all valid
8. **ProvidersPhoneTable** - 178 usages, all valid
9. **VcBasicGrid** - 2 usages, all valid

**Total Valid Usages**: 612 (29% of all usages)

These components are ready for migration with zero issues.

---

## Component Categories & Migration Strategy

### Category 1: Phone Numbers (19 components)

**Status**: ⚠️ Warnings only (unused `name` prop)

**Migration Strategy**:
- Map to existing `DynamicDataInstanceSimple` inline blocks
- Create 19 RichTextDataInstance entries (one per provider)
- Replace all `<*PhoneNumber />` tags with inline block references

**Example**:
```mdx
<!-- Before -->
<AmigoPhoneNumber name="amigo-phone-number" />

<!-- After (in Lexical JSON) -->
{
  "type": "inlineBlock",
  "blockType": "dynamicDataInstanceSimple",
  "category": "phone",
  "instance": "amigo-phone-number",
  "enablePhoneLink": true
}
```

---

### Category 2: Text Patterns (4 components)

**Status**: ✅ Skipped (not components, just text replacements)

**Components**:
1. `%currentyear%` → CurrentYear inline block
2. `%sep%` → SiteSeparator inline block (need to create)
3. `%sitename%` → SiteName inline block (need to create)
4. `%title%` → PageTitle inline block (need to create)

**Migration Strategy**: Simple find/replace with inline block references

---

### Category 3: Complex Interactive Components (15 components)

**Status**: ⚠️ Many warnings, 28 critical errors (FaqRankMath)

**Components**:
- RatesTable, ZipcodeSearchbar, TocRankMath, FaqRankMath, HelpMeChoose
- ProviderCard, ProvidersPhoneTable, AdvisorPostsTabs, VcBasicGrid
- AvgTexasResidentialRate, ComparepowerReviewCount, LowestRateDisplay
- PopularCitiesList, PopularZipcodes, CurrentYearDirect

**Migration Strategy**:
- Create EditorBlock definitions for each
- Store component type and all original props as JSON
- Let Astro frontend handle rendering
- Add editor notes for components needing manual work (FaqRankMath)

---

### Category 4: Legacy WordPress Blocks (11 components)

**Status**: 🔴 Critical - Components don't exist

**Migration Strategy**:
- Create generic `EditorBlock` with:
  - `componentType`: "WpBlockLegacy"
  - `wpBlockId`: Original WordPress block ID
  - `editorNotes`: "Requires manual conversion"
  - `originalMarkup`: Full original MDX markup

---

## Recommended Action Plan

### Phase 1: Fix Critical Errors (HIGH PRIORITY)

1. **FaqRankMath Decision**:
   - [ ] Review 28 affected files
   - [ ] Decide: Fix source files OR create placeholder blocks
   - [ ] If placeholder: Create EditorBlock with note for authors
   - [ ] Document which files need FAQ data added

2. **Legacy WpBlocks**:
   - [ ] Find all usages in MDX files
   - [ ] Identify what these blocks were supposed to do
   - [ ] Create migration strategy for each
   - [ ] Document manual conversion needs

### Phase 2: Create Payload Block Definitions (MEDIUM PRIORITY)

1. **Generate Block Configs**:
   - [ ] Build `generate-payload-config.mjs` script
   - [ ] Generate TypeScript block definitions for all 34 components
   - [ ] Generate collection config with all blocks
   - [ ] Integrate into Payload project

2. **Create Missing Inline Blocks**:
   - [ ] SiteSeparator (for `%sep%`)
   - [ ] SiteName (for `%sitename%`)
   - [ ] PageTitle (for `%title%`)

3. **Create RichTextDataInstances**:
   - [ ] 19 provider phone numbers
   - [ ] Test inline block rendering

### Phase 3: Address Warnings (LOW PRIORITY)

1. **Phone Component Props**:
   - Decision: Ignore - will be replaced during migration

2. **Missing TypeScript Interfaces**:
   - [ ] Add interfaces to components if time permits
   - [ ] Or rely on EditorBlock flexibility

3. **RatesTable/TocRankMath/ZipcodeSearchbar**:
   - [ ] Review component implementations
   - [ ] Confirm props are handled dynamically
   - [ ] Document expected props in EditorBlock notes

### Phase 4: Proceed with Migration

Once critical errors are resolved:
- [ ] Run `prepare-seed-data.mjs`
- [ ] Test on 5 sample entries
- [ ] Review generated Lexical JSON
- [ ] Execute full migration
- [ ] Verify all 157 entries

---

## Files Generated

This validation produced:

1. **component-validation.json** (67KB)
   - Full validation results for all 49 components
   - All 2,130 usages with errors
   - File paths for every issue

2. **component-props.json** (3KB)
   - TypeScript interfaces for 34 found components
   - Required vs optional props
   - Type definitions

3. **validation-output.log** (complete terminal output)
   - Human-readable validation log
   - Summary statistics

---

## Next Steps

**Immediate**:
1. Review this report with stakeholders
2. Decide on FaqRankMath strategy
3. Document legacy WpBlock requirements
4. Create issue tracking system

**Then**:
1. Build `generate-payload-config.mjs` to auto-generate blocks
2. Build `prepare-seed-data.mjs` to convert MDX → Lexical
3. Build `seed-database.mjs` to populate Payload
4. Test on fresh Payload instance

---

## Questions for Discussion

1. **FaqRankMath**: Should we fix 28 source files or create placeholder blocks?

2. **Legacy WpBlocks**: What were these blocks originally? Do we need to recreate functionality?

3. **Phone Component Warnings**: Acceptable to ignore since we're replacing with inline blocks?

4. **TypeScript Interfaces**: Should we add missing interfaces to components, or rely on EditorBlock flexibility?

5. **Migration Priority**: Should we migrate only fully-valid components first, or migrate all with placeholders?

---

**Validation Complete** ✅
**Next**: Address critical errors → Generate Payload configs → Prepare seed data → Migrate
