# Playwright E2E Tests for Inline Blocks

This directory contains Playwright test scripts that were created to verify the inline blocks functionality in the Payload CMS + Astro setup.

## Test Scripts

### Core Functionality Tests

#### `playwright-full-test.mjs`
**Purpose:** Comprehensive end-to-end test that verifies the complete inline blocks workflow.

**What it tests:**
- Login to Payload admin
- Navigate to demo document
- Verify inline blocks render in Payload editor
- Verify inline blocks render on Astro frontend
- Check that dynamic values (phone numbers, etc.) display correctly

**Screenshots:**
- `test-backend.png` - Payload editor view
- `test-frontend.png` - Astro frontend view

**Usage:**
```bash
node tests/playwright/playwright-full-test.mjs
```

---

### Custom Label Component Tests

These tests were created during the iterative development of custom label components for inline blocks.

#### `playwright-test-label.mjs`
**Purpose:** Test the custom label component that shows category and value information.

**What it tests:**
- Verifies custom label component renders
- Checks if category and value data are displayed
- Initial test for "Category: Value" display format

**Screenshots:**
- `payload-label-test.png`

---

#### `playwright-test-tooltip.mjs`
**Purpose:** Test native browser tooltip (`title` attribute) approach.

**What it tests:**
- Verifies "Dynamic Value" text displays
- Attempts to verify browser tooltip (failed - tooltips don't render in screenshots)

**Screenshots:**
- `payload-tooltip-test.png`

**Note:** This approach was abandoned because native browser tooltips:
- Don't appear in screenshots
- Are OS/browser-dependent
- Can't be styled or verified programmatically

---

#### `playwright-test-custom-tooltip.mjs`
**Purpose:** Test custom React tooltip component with absolute positioning.

**What it tests:**
- Hover over "Dynamic Value" element
- Verify custom tooltip appears in DOM
- Check tooltip shows correct data format (Category: Name → Value)

**Screenshots:**
- `custom-tooltip-hover.png` - Shows black custom tooltip with data

**Success:** This approach worked! Custom tooltips:
- Render in the DOM (show in screenshots)
- Can be styled with CSS
- Can be programmatically verified
- Show correct data: "Phone Number: TXU Energy Phone → 1-866-961-1345"

---

#### `playwright-hover-tooltip.mjs`
**Purpose:** Enhanced tooltip hover test with detailed verification.

**What it tests:**
- Hover interaction
- Tooltip visibility
- Tooltip content accuracy
- Multiple hover states

**Screenshots:**
- `tooltip-hover.png`

---

#### `playwright-final-tooltip-test.mjs`
**Purpose:** Final verification of tooltip functionality before moving to inline display.

**What it tests:**
- Login flow
- Navigate to demo
- Find "Dynamic Value" element
- Hover to show tooltip
- Verify tooltip contains "Phone Number"
- Extract and log tooltip text

**Screenshots:**
- `final-tooltip.png`

**Usage:**
```bash
node tests/playwright/playwright-final-tooltip-test.mjs
```

---

#### `playwright-test-inline-display.mjs`
**Purpose:** Test the inline display variant that shows actual value in the chip.

**What it tests:**
- Verifies "Dynamic Value" (tooltip version) still exists
- Verifies "Dynamic Value (Inline)" shows actual phone number "1-866-961-1345"
- Checks slash menu shows both options
- Takes screenshots for visual verification

**Screenshots:**
- `inline-blocks-comparison.png` - Shows both variants
- `slash-menu.png` - Shows both options in slash menu

**Success:** Confirmed that:
- Original tooltip version still works
- New inline version shows actual value in chip
- Both appear in slash menu for editors to choose

**Usage:**
```bash
node tests/playwright/playwright-test-inline-display.mjs
```

---

### Debugging Tests

#### `playwright-check-console-logs.mjs`
**Purpose:** Debug console errors during custom label component development.

**What it tests:**
- Captures browser console logs
- Captures console errors
- Helps diagnose React component issues

**Screenshots:**
- `payload-console-debug.png`

**Used to diagnose:** "e is not a function" error in early label component attempts.

---

#### `playwright-dump-all.mjs`
**Purpose:** Comprehensive data dump for debugging props and state.

**What it tests:**
- Dumps entire page state
- Logs all available data
- Helps understand component prop structure

---

## Screenshots

All test screenshots are stored in `test-results/screenshots/`:

### Login & Navigation
- `payload-login.png` - Payload admin login page
- `payload-demos-list.png` - Demos collection list

### Editor Views
- `payload-demo-editor.png` - Demo document editor with inline blocks
- `test-backend.png` - Backend verification

### Frontend Views
- `astro-demo-page.png` - Astro frontend rendering
- `test-frontend.png` - Frontend verification

### Custom Label Development
- `payload-label-test.png` - Early label component test
- `payload-tooltip-test.png` - Native tooltip attempt (failed)
- `custom-tooltip-hover.png` - Custom React tooltip (success!)
- `tooltip-hover.png` - Tooltip hover state
- `final-tooltip.png` - Final tooltip verification
- `inline-blocks-comparison.png` - Both variants side-by-side
- `slash-menu.png` - Slash menu showing both options

### Debugging
- `payload-console-debug.png` - Console error debugging

---

## Test Configuration

### Credentials
Tests use the following admin credentials:
- **Email:** `brad@comparepower.com`
- **Password:** `deh2xjt1CHW_dmd.gxj`

### URLs
- **Payload Admin:** `http://localhost:3001/admin`
- **Astro Frontend:** `http://localhost:4321`
- **Test Document:** `http://localhost:3001/admin/collections/demos/68f9fd88445a4165b55c7ebb`

### Browser Mode
All tests run in **headed mode** (`headless: false`) for visual verification during development.

---

## Development Timeline

1. **Initial Setup** - Basic inline blocks working but showing generic "Dynamic Value"
2. **Custom Label Attempt 1** - Used `useFormFields` hook, got "e is not a function" error
3. **Custom Label Attempt 2** - Showed "Other: Not Selected", data not rendering
4. **Native Tooltip Attempt** - Used `title` attribute, couldn't verify in screenshots
5. **Custom React Tooltip** - SUCCESS! Built custom tooltip component with React state
6. **Inline Display Variant** - Created second variant showing value directly in chip
7. **Smart Value Handling** - Added logic to handle different value scenarios

---

## Key Learnings

### Payload Inline Block Type
Payload CMS saves inline blocks with `type: 'inlineBlock'` (not `type: 'block'`). This was critical for frontend rendering.

### Custom Label Components
Custom label components work via:
- `admin.components.Label` in block configuration
- `useFormFields` hook to access form data
- `'use client'` directive for React client components

### Data Access Pattern
```typescript
const field = useFormFields(([fields]) => {
  const paths = ['fieldName', 'fields.fieldName', props.path?.replace('._components', '.fieldName')]
  for (const path of paths) {
    if (fields[path]) return fields[path]
  }
  return null
})
```

### Why Original Attempts Failed
Early attempts to show "Category: Value" in the chip failed because:
- ✅ Data was being fetched correctly via `useFormFields`
- ✅ API calls were working
- ❌ Data was put in `title` attribute instead of rendered content
- ❌ Hardcoded "Dynamic Value" text was rendered instead of actual data

**The fix:**
```typescript
// WRONG:
return <span title={tooltip}>Dynamic Value</span>

// CORRECT:
return <span>{displayValue}</span>
```

### Browser vs Custom Tooltips
- **Browser tooltips (`title` attribute):** Don't render in screenshots, can't be styled or verified
- **Custom React tooltips:** Render in DOM, show in screenshots, fully controllable

---

## Running Tests

### Prerequisites
```bash
# Install Playwright
pnpm install -D playwright

# Or use the playwright-skill if available
```

### Start Servers
```bash
# Terminal 1 - Payload CMS
pnpm dev

# Terminal 2 - Astro frontend
cd astro-poc && pnpm dev
```

### Run Tests
```bash
# Full end-to-end test
node tests/playwright/playwright-full-test.mjs

# Test inline display variant
node tests/playwright/playwright-test-inline-display.mjs

# Test custom tooltip
node tests/playwright/playwright-test-custom-tooltip.mjs

# Final tooltip verification
node tests/playwright/playwright-final-tooltip-test.mjs
```

---

## Future Improvements

- Convert to proper Playwright Test framework with `@playwright/test`
- Add automated assertions instead of manual screenshot verification
- Create test fixtures for login and navigation
- Add CI/CD integration
- Test different data categories (email, address, other)
- Test edge cases (missing data, API errors, etc.)

---

## Related Documentation

- **Inline Blocks Implementation:** `src/lexical/inlineBlocks/README.md` (if exists)
- **Lexical Renderer:** `astro-poc/src/lib/lexical-renderer.ts`
- **Custom Labels:**
  - `src/lexical/inlineBlocks/DynamicValueLabel.tsx` (tooltip version)
  - `src/lexical/inlineBlocks/DynamicValueInlineLabel.tsx` (inline version)
