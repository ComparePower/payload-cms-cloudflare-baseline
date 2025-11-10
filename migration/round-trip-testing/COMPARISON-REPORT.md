# Round-Trip MDX Import/Export Comparison Report

**Date**: 2025-10-26  
**Original**: Abilene Electricity Rates from Astro project  
**Test**: Round-trip through Payload CMS (import → export)

---

## ✅ SUCCESS: Fixed Payload API Block Pagination Issue

### Root Cause
**Payload's `find()` API was limiting contentBlocks array to 30 items** despite database containing all 35 blocks.

### Solution
Query MongoDB directly in export script to bypass Payload API pagination

### Results
- **Database**: 35 blocks ✅
- **Payload API (before fix)**: 30 blocks ❌
- **MongoDB direct (after fix)**: 35 blocks ✅
- **Export (after fix)**: 35 blocks ✅

---

## 📊 Export Statistics

- **Original file size**: 12K
- **Exported file size**: 13K (+8% larger)
- **Diff lines**: 268 lines
- **Content blocks exported**: 35/35 (100%)
- **Missing components**: 0 ✅
- **Last component verified**: `<WpBlock66341CityPageFaqNonRm />` ✅

---

## 📁 Files in this Directory

- `abilene-original.mdx` - Original source from Astro project
- `abilene-exported.mdx` - Exported after round-trip through Payload  
- `comparison-diff.txt` - Full unified diff (268 lines)
- `export-logs.txt` - Export script logs showing 35 blocks fetched
- `COMPARISON-REPORT.md` - This report

---

## 🎯 Known Issues to Fix

1. **Empty strings exporting as "true"** - Props like `zipcode=""` exporting as `zipcode="true"`
2. **Duplicate props being exported** - Both `buttonText` AND `buttontext` 
3. **Missing props in schemas** - `textRrTable` not in RatesTableBlock
4. **Section components removed** - Migration strips `<Section>` wrappers
5. **Default props being injected** - Props not in original being added

---

## 🔧 File Modified

- **`scripts/export-electricity-rate-to-mdx.mjs`**: Updated to query MongoDB directly

