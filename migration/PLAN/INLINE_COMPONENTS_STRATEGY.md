# Inline Components Migration Strategy

## Problem

We found **462 inline components** in MDX files that need to be converted to Payload inline blocks.

### Inline Components Found:
- `<LowestRateDisplay />` - 190 instances
- `<CurrentYearDirect />` - 148 instances
- `<CurrentMonthDirect />` - 58 instances
- `<Call />` - 6 instances
- Various phone number components (15 different types)

### Example Usage:
```markdown
The best rate in Texas is <LowestRateDisplay /> for <CurrentYearDirect />.

Call us at <TxuPhoneNumber /> for more information.
```

## Lexical Inline Block Structure

Inline blocks in Payload Lexical are represented as special nodes:

```json
{
  "type": "block",
  "version": 1,
  "fields": {
    "blockType": "currentYear",
    "id": "unique-id"
  }
}
```

## Migration Approach

### Option 1: Convert to Inline Blocks (Ideal but Complex)

**Pros:**
- ✅ Preserves exact inline component functionality
- ✅ Editors can update values centrally

**Cons:**
- ❌ Very complex - requires post-processing Lexical JSON
- ❌ Need to register all components as inline blocks
- ❌ Mapping component props to inline block fields

### Option 2: Convert to Text Placeholders (Practical for Migration)

**Pros:**
- ✅ Simple and fast
- ✅ Content is preserved
- ✅ Can be manually converted later

**Cons:**
- ❌ Loses dynamic functionality temporarily
- ❌ Manual work to re-add as inline blocks

### Option 3: Hybrid Approach (RECOMMENDED)

1. **For common dynamic components** (year, date, rates):
   - Convert to inline blocks
   - These are already registered in Payload

2. **For phone numbers**:
   - Convert to Dynamic Data Instance inline blocks
   - Create seed data for common phone numbers

3. **For complex components** (LowestRateDisplay, Call):
   - Convert to text placeholders for now
   - Document for manual conversion

## Implementation Plan

### Phase 1: Register Inline Blocks

Already done:
- ✅ CurrentYear
- ✅ YearsSince
- ✅ DynamicDataInstance

Need to add:
- CurrentYearDirect → Maps to `CurrentYear`
- CurrentMonthDirect → New `CurrentMonth` inline block
- All phone numbers → Use `DynamicDataInstance`

### Phase 2: Create Mapping

```typescript
const INLINE_COMPONENT_MAPPING = {
  // Direct mappings
  CurrentYearDirect: { inlineBlockType: 'currentYear' },
  CurrentMonthDirect: { inlineBlockType: 'currentMonth' },

  // Phone numbers → Dynamic instances
  TxuPhoneNumber: { inlineBlockType: 'dynamicDataInstance', instanceSlug: 'txu-phone' },
  ReliantPhoneNumber: { inlineBlockType: 'dynamicDataInstance', instanceSlug: 'reliant-phone' },
  // ... etc

  // Complex components → Text replacement for now
  LowestRateDisplay: { replaceWith: '[Lowest Rate]', note: 'Manual conversion needed' },
  Call: { replaceWith: (props) => `Call ${props.to}`, note: 'Convert to inline phone' },
}
```

### Phase 3: Update Parser

1. Track inline components during AST walk
2. Replace with placeholders in markdown
3. After converting to Lexical, inject inline block nodes
4. Or: Convert to text with notes for manual update

### Phase 4: Seed Data

Create `RichTextDataInstances` for:
- TXU Energy Phone: 1-866-961-1345
- Reliant Energy Phone: 1-855-339-5971
- Gexa Energy Phone: 1-866-961-9399
- Compare Power Phone: 1-866-580-8100
- ... all other providers

## Recommended Next Steps

1. **Create `CurrentMonth` inline block** (simple)
2. **Seed phone number data instances** (one-time task)
3. **Update parser to handle simple inline components** (CurrentYear, CurrentMonth, phone numbers)
4. **Convert complex inline components to text placeholders** (LowestRateDisplay, Call, RatesTable)
5. **Document which posts need manual inline block conversion**

## Decision Needed

Do you want to:
- **A)** Implement full inline block conversion for all components (complex, takes time)
- **B)** Convert simple components to inline blocks, others to text placeholders (faster)
- **C)** Convert everything to text for now, manual conversion later (fastest)

**Recommendation: Option B** - Best balance of functionality and speed.
