# Unmapped MDX Components Analysis

**Issue**: [#2 - Robust MDX Importer (CRITICAL)](https://github.com/ComparePower/cp-cms-payload-cms-mongo/issues/2)

**Created**: 2025-10-27

**Purpose**: Categorize all unmapped MDX components found in Astro source files to determine implementation strategy.

---

## Executive Summary

**Total Unmapped Components Analyzed**: 11

**Categorization Results**:
- **BLOCK (HTML)**: 8 components (requires individual Payload block definitions)
- **STUB (Empty)**: 3 components (can be safely removed or marked as deprecated)
- **INLINE (Simple Value)**: 0 components found

**Critical Finding**: ALL analyzed components with actual content are BLOCK-level components that output HTML structures, not simple inline values. None can use the "Dynamic Value" catch-all approach.

---

## Component Categorization

### Category 1: BLOCK - HTML Output (8 components)

These components output structured HTML and require individual Payload block definitions.

#### 1. EiaMonth
- **Usage Count**: 885 occurrences
- **File**: `src/components/wp-shortcodes/EiaMonth.astro`
- **Output**:
  ```html
  <div class="eiamonth-container">
    Updated February 2025
  </div>
  ```
- **Analysis**: Simple HTML container with static date text
- **Payload Implementation**: Create `EiaMonthBlock` with optional `date` field
- **Priority**: HIGH (885 uses)

#### 2. EiaRatesChart
- **Usage Count**: 885 occurrences
- **File**: `src/components/wp-shortcodes/EiaRatesChart.astro`
- **Output**: Image component with alt text and styling
- **Analysis**: Renders static image of Texas electricity rates chart
- **Payload Implementation**: Create `EiaRatesChartBlock` with `image`, `alt`, `width` fields
- **Priority**: HIGH (885 uses)

#### 3. WpBlock60290_AvgTexasResidentialRate
- **Usage Count**: 882 occurrences
- **File**: `src/components/legacy/wp-blocks/WpBlock60290_AvgTexasResidentialRate.astro`
- **Output**:
  ```html
  <div class="avg-texas-residential-rate">
    <p>
      The average residential electricity rate in Texas is <strong>12.8¢/kWh</strong>,
      <span class="percent-off">4.5%</span> less than the U.S. average.
    </p>
  </div>
  ```
- **Analysis**: HTML paragraph with dynamic rate data (currently hardcoded, has client-side script for updates)
- **Payload Implementation**: Create `AvgTexasResidentialRateBlock` with fields:
  - `rate: string` (e.g., "12.8¢/kWh")
  - `percentOff: string` (e.g., "4.5%")
  - Or link to `RichTextDataInstances` for dynamic data
- **Priority**: HIGH (882 uses)

#### 4. WpBlock60291_AvgTexasCommercialRate
- **Usage Count**: 882 occurrences
- **File**: `src/components/wp-blocks/WpBlock60291_AvgTexasCommercialRate.astro`
- **Output**: Similar to WpBlock60290, but for commercial rates
  ```html
  <div class="avg-texas-commercial-rate">
    <p>
      The average Texas business electricity rate is <strong>8.5¢/kWh</strong>,
      <span class="percent-off">12.3%</span> less than the U.S. average.
    </p>
  </div>
  ```
- **Analysis**: Commercial rate variant with same structure as residential
- **Payload Implementation**: Create `AvgTexasCommercialRateBlock` with same fields as 60290
- **Priority**: HIGH (882 uses)

#### 5. WpBlock66341_CityPageFaqNonRm
- **Usage Count**: 882 occurrences
- **File**: `src/components/wp-blocks/WpBlock66341_CityPageFaqNonRm.astro`
- **Output**: Full FAQ section with multiple Q&A items
  ```html
  <div class="city-page-faq-non-rm">
    <div class="faq-container">
      <h2 class="faq-title"><span class="city-name">City Name</span> FAQs</h2>
      <div class="faq-item">
        <h3 class="faq-question">Who has the cheapest <span class="city-name">City Name</span> electricity rates?</h3>
        <div class="faq-answer"><p>...</p></div>
      </div>
      <!-- More FAQ items -->
    </div>
  </div>
  ```
- **Analysis**: Complex HTML structure with multiple FAQ entries, uses dynamic city name replacement
- **Payload Implementation**:
  - Option A: Create `CityPageFaqBlock` with `cityName` field and hardcoded FAQ content
  - Option B: Use existing `FaqRankMathBlock` and extend with city context
- **Priority**: HIGH (882 uses)
- **Note**: May overlap with existing `FaqRankMathBlock` functionality

#### 6. WpBlock93267_HoustonDirectLink
- **Usage Count**: 882 occurrences
- **File**: `src/components/wp-blocks/WpBlock93267_HoustonDirectLink.astro`
- **Output**: Call-to-action box with link
  ```html
  <div class="houston-direct-link">
    <a href="https://orders.comparepower.com/?tdsp_duns=957877905">
      <div class="info-box">
        <div class="info-box-media">
          <img src="/images/comparepower-icon.png" alt="ComparePower" />
        </div>
        <div class="info-box-content">
          <div class="info-box-title"><strong>Power Your Home For Less</strong></div>
          <p class="info-box-text">Find Houston's Best Energy Deals</p>
          <span class="info-box-cta">Compare Rates Now →</span>
        </div>
      </div>
    </a>
  </div>
  ```
- **Analysis**: Rich CTA component with icon, title, description, and link
- **Payload Implementation**: Create `HoustonDirectLinkBlock` with fields:
  - `url: string`
  - `title: string`
  - `description: string`
  - `ctaText: string`
  - `iconUrl: string`
- **Priority**: HIGH (882 uses)

#### 7. ShopperApprovedReviewsFeed
- **Usage Count**: 21 occurrences
- **File**: `src/components/wp-shortcodes/ShopperApprovedReviewsFeed.astro`
- **Output**: Third-party review widget with external script
  ```html
  <div class="shopper-approved-reviews-feed">
    <script type="text/javascript">
      var sa_review_count = 20;
      var sa_date_format = 'F j, Y';
      // ... external script loader
    </script>
    <div id="shopper_review_page">
      <div id="review_header"></div>
      <div id="merchant_page"></div>
      <div id="review_image">...</div>
    </div>
  </div>
  ```
- **Analysis**: Third-party widget integration, loads external JavaScript
- **Payload Implementation**: Create `ShopperApprovedReviewsBlock` with fields:
  - `reviewCount: number` (default: 20)
  - `dateFormat: string` (default: 'F j, Y')
  - Or hardcode values and just render the widget
- **Priority**: MEDIUM (21 uses)
- **Security Note**: External script injection - may need CSP considerations

#### 8. UsageBasedPricingVideo
- **Usage Count**: 21 occurrences
- **File**: `src/components/wp-shortcodes/UsageBasedPricingVideo.astro`
- **Output**: Wistia video player component
  ```html
  <div class="video-container">
    {title && <h3 class="video-title">{title}</h3>}
    <WistiaPlayerOfficial mediaId="l4ugpqv7hb" />
    {caption && <p class="video-caption">{caption}</p>}
  </div>
  ```
- **Analysis**: Video player wrapper with optional title and caption
- **Payload Implementation**: Create `UsageBasedPricingVideoBlock` with fields:
  - `mediaId: string` (default: "l4ugpqv7hb")
  - `title: string` (optional)
  - `caption: string` (optional)
- **Priority**: MEDIUM (21 uses)

---

### Category 2: STUB - Empty Placeholders (3 components)

These components are empty stubs marked with TODO comments.

#### 1. WpBlock60549_Unknown
- **Usage Count**: 882 occurrences (⚠️ HIGH despite being empty!)
- **File**: `src/components/wp-blocks/WpBlock60549_Unknown.astro`
- **Content**: `{/* TODO: Implement or remove WpBlock60549_Unknown */}`
- **Analysis**: Empty stub component, no functionality
- **Recommendation**:
  - **CRITICAL**: Check source MDX files to see what this component was supposed to do
  - If truly unused, remove from MDX files during migration
  - If has purpose, needs investigation of original WordPress block ID 60549
- **Priority**: CRITICAL (882 uses of empty component!)

#### 2. WpBlock75232_EnergySavingsArticlesCopy
- **Usage Count**: 882 occurrences (⚠️ HIGH despite being empty!)
- **File**: `src/components/wp-blocks/WpBlock75232_EnergySavingsArticlesCopy.astro`
- **Content**: `{/* TODO: Implement or remove WpBlock75232_EnergySavingsArticlesCopy */}`
- **Analysis**: Empty stub, likely duplicate of existing `WpBlock59853_EnergySavingsArticlesBlock`
- **Recommendation**:
  - Compare with `WpBlock59853_EnergySavingsArticlesBlock` (already mapped)
  - Likely can be aliased to existing block or removed
- **Priority**: HIGH (investigate relationship to WpBlock59853)

#### 3. WpBlock80371_Unknown
- **Usage Count**: 882 occurrences (⚠️ HIGH despite being empty!)
- **File**: `src/components/wp-blocks/WpBlock80371_Unknown.astro`
- **Content**: `{/* TODO: Implement or remove */}`
- **Analysis**: Empty stub component
- **Recommendation**: Investigate original WordPress block ID 80371, or remove from MDX
- **Priority**: CRITICAL (882 uses!)

---

## Implementation Strategy

### Phase 1: Handle Empty Stubs (URGENT)

**Problem**: 3 components with 2,646 combined uses are EMPTY STUBS. This is a critical data integrity issue.

**Action Required**:
1. Search source MDX files for actual usage of these components
2. Check if they contain any props or children
3. Options:
   - If truly empty → Remove from MDX during migration (log as skipped)
   - If aliased → Map to existing blocks (e.g., WpBlock75232 → WpBlock59853)
   - If unknown → Fail migration with detailed error requiring investigation

**Command to investigate**:
```bash
cd /Users/brad/_CODE_DEV_PROJECTS/cp-content-site-astro
grep -r "WpBlock60549" src/content --include="*.mdx" | head -5
grep -r "WpBlock75232" src/content --include="*.mdx" | head -5
grep -r "WpBlock80371" src/content --include="*.mdx" | head -5
```

### Phase 2: Create High-Priority Blocks (8 components, 5,895 uses)

**Implementation Order** (by usage count):
1. ✅ EiaMonth (885) - Simple block, good starting point
2. ✅ EiaRatesChart (885) - Image block
3. ✅ WpBlock60290_AvgTexasResidentialRate (882) - Dynamic data block
4. ✅ WpBlock60291_AvgTexasCommercialRate (882) - Similar to above
5. ✅ WpBlock66341_CityPageFaqNonRm (882) - Complex FAQ structure
6. ✅ WpBlock93267_HoustonDirectLink (882) - CTA block
7. ⏳ ShopperApprovedReviewsFeed (21) - External widget
8. ⏳ UsageBasedPricingVideo (21) - Video player

**Estimated Time**: 1-2 hours per block × 8 blocks = 8-16 hours

### Phase 3: Update Validator

Update `mdx-component-validator.ts`:
```typescript
function getValidBlockTypes(): Set<string> {
  // ... existing code ...

  // Add new blocks
  blockTypes.add('EiaMonth')
  blockTypes.add('EiaRatesChart')
  blockTypes.add('WpBlock60290_AvgTexasResidentialRate')
  blockTypes.add('WpBlock60291_AvgTexasCommercialRate')
  blockTypes.add('WpBlock66341_CityPageFaqNonRm')
  blockTypes.add('WpBlock93267_HoustonDirectLink')
  blockTypes.add('ShopperApprovedReviewsFeed')
  blockTypes.add('UsageBasedPricingVideo')

  return blockTypes
}
```

### Phase 4: Update MDX Parser

Update `mdx-to-payload-blocks.ts` to handle new block types:
- Add to block-level component detection
- Map props to block fields
- Test with sample files

### Phase 5: Verification

Run validator on all MDX files:
```bash
./scripts/doppler-run.sh dev pnpm tsx migration/scripts/validate-components.mjs
```

---

## Key Findings

1. **No Inline Components**: Unlike initial hypothesis, NONE of the unmapped components are simple inline values. All output structured HTML.

2. **Empty Stubs Are Critical Issue**: 3 components with 2,646 combined uses are EMPTY. This needs immediate investigation.

3. **Dynamic Data Pattern**: Components like WpBlock60290/60291 contain hardcoded values with client-side script updates. Should these:
   - Use `RichTextDataInstances` for truly dynamic data?
   - Remain as static blocks with editable fields?
   - Both options available?

4. **External Dependencies**:
   - ShopperApprovedReviewsFeed loads external script
   - UsageBasedPricingVideo depends on `WistiaPlayerOfficial` component

5. **Potential Duplicates**:
   - WpBlock75232_EnergySavingsArticlesCopy may duplicate WpBlock59853_EnergySavingsArticlesBlock
   - WpBlock66341_CityPageFaqNonRm may overlap with existing `FaqRankMathBlock`

---

## Questions for User

### 1. Empty Stub Components
**Question**: What should we do with the 3 empty stub components (WpBlock60549, WpBlock75232, WpBlock80371) that have 2,646 combined uses?

**Options**:
- A) Investigate original WordPress blocks to understand their purpose
- B) Remove from MDX during migration (replace with empty richText block)
- C) Fail migration and require manual review of each usage

**Recommendation**: Option A (investigate), then decide per component

### 2. Dynamic Data Strategy
**Question**: For components with dynamic data (avg rates, city names), should we:

**Options**:
- A) Create editable fields in block definition (static content, manual updates)
- B) Link to `RichTextDataInstances` collection (dynamic, single source of truth)
- C) Hybrid (block has fields, optional override via data instance)

**Recommendation**: Option B for truly global data (avg rates), Option A for page-specific data (city names in FAQ)

### 3. FAQ Block Consolidation
**Question**: `WpBlock66341_CityPageFaqNonRm` outputs similar structure to existing `FaqRankMathBlock`. Should we:

**Options**:
- A) Create separate block type (preserve exact WordPress structure)
- B) Map to existing `FaqRankMathBlock` with city context field
- C) Merge both into new unified FAQ block

**Recommendation**: Option A for now (preserve structure), consider Option C in future refactor

---

## Next Steps

1. **URGENT**: Investigate empty stub components (grep MDX files for usage)
2. **HIGH**: Create Payload block definitions for 8 HTML components
3. **MEDIUM**: Update validator to recognize new blocks
4. **MEDIUM**: Update MDX parser to extract new block types
5. **LOW**: Test with sample MDX files
6. **LOW**: Run full migration with fail-fast validation

---

## Related Files

- Validator: `/scripts/migration/lib/mdx-component-validator.ts`
- Parser: `/scripts/migration/lib/mdx-to-payload-blocks.ts`
- Block Registry: `/src/lexical/blocks/index.ts`
- Migration Script: `/migration/scripts/seed-with-payload-api.mjs`

---

**Status**: Analysis Complete - Awaiting User Decision on Implementation Strategy

**Last Updated**: 2025-10-27
