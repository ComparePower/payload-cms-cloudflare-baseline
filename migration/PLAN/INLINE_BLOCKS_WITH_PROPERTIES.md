# Inline Blocks with Properties - Complete Guide

## Yes! Inline Blocks Can Have Properties

Inline blocks in Payload can have any type of field - text, numbers, selects, relationships, etc.

## Examples We've Implemented

### 1. Dynamic Data Instance (Relationship + Select Filter)

**Has TWO properties:**
1. **Category** - Select dropdown to filter by type
2. **Instance** - Relationship to choose specific value

```typescript
fields: [
  {
    name: 'category',
    type: 'select',
    defaultValue: 'phone',
    options: [
      { label: 'Phone Number', value: 'phone' },
      { label: 'Email', value: 'email' },
      { label: 'Address', value: 'address' },
    ],
  },
  {
    name: 'instance',
    type: 'relationship',
    relationTo: 'richTextDataInstances',
    filterOptions: ({ data }) => {
      // Dropdown only shows items matching category!
      if (data?.category) {
        return { category: { equals: data.category } }
      }
      return {}
    },
  },
]
```

**User Experience:**
1. Editor clicks "Dynamic Value" button in text
2. First dropdown appears: "Type" → selects "Phone Number"
3. Second dropdown appears: "Select Value" → shows ONLY phone numbers
4. Selects "TXU Energy Phone"
5. Phone number appears inline in text

### 2. Years Since (Number Property)

**Has ONE property:**
- **Year** - Number input with validation

```typescript
fields: [
  {
    name: 'year',
    type: 'number',
    required: true,
    validate: (value) => {
      const currentYear = new Date().getFullYear()
      if (value > currentYear) return 'Year cannot be in the future'
      return true
    },
  },
]
```

**User Experience:**
1. Editor clicks "Years Since" button
2. Number input appears
3. Types "2015"
4. Text shows "10 years" (calculated dynamically)

### 3. Current Year & Current Month (No Properties)

These have **no properties** - they're pure functions:

```typescript
fields: []  // No configuration needed!
```

## Other Property Types You Could Use

### Text Input
```typescript
{
  name: 'customText',
  type: 'text',
  label: 'Custom Text',
}
```

### Textarea
```typescript
{
  name: 'description',
  type: 'textarea',
  maxLength: 200,
}
```

### Checkbox
```typescript
{
  name: 'showIcon',
  type: 'checkbox',
  label: 'Show Icon',
  defaultValue: true,
}
```

### Date
```typescript
{
  name: 'eventDate',
  type: 'date',
}
```

### Select (Multiple Options)
```typescript
{
  name: 'style',
  type: 'select',
  options: [
    { label: 'Bold', value: 'bold' },
    { label: 'Italic', value: 'italic' },
    { label: 'Underline', value: 'underline' },
  ],
}
```

### Radio
```typescript
{
  name: 'alignment',
  type: 'radio',
  options: [
    { label: 'Left', value: 'left' },
    { label: 'Center', value: 'center' },
    { label: 'Right', value: 'right' },
  ],
}
```

## Real-World Examples

### Example 1: Provider Contact Info

```typescript
export const ProviderContact: Block = {
  slug: 'providerContact',
  labels: { singular: 'Provider Contact', plural: 'Provider Contacts' },
  fields: [
    {
      name: 'provider',
      type: 'select',
      options: [
        { label: 'TXU Energy', value: 'txu' },
        { label: 'Reliant Energy', value: 'reliant' },
        { label: 'Gexa Energy', value: 'gexa' },
      ],
    },
    {
      name: 'contactType',
      type: 'select',
      options: [
        { label: 'Phone', value: 'phone' },
        { label: 'Email', value: 'email' },
        { label: 'Website', value: 'website' },
      ],
    },
  ],
}
```

**Usage:** "Contact TXU Energy at [Provider Contact: TXU → Phone]"
**Renders:** "Contact TXU Energy at 1-866-961-1345"

### Example 2: Rate Display

```typescript
export const RateDisplay: Block = {
  slug: 'rateDisplay',
  fields: [
    {
      name: 'rateType',
      type: 'select',
      options: [
        { label: 'Lowest Rate', value: 'lowest' },
        { label: 'Average Rate', value: 'average' },
        { label: 'Highest Rate', value: 'highest' },
      ],
    },
    {
      name: 'zipcode',
      type: 'text',
      admin: {
        condition: (data) => data.useCustomZipcode === true,
      },
    },
    {
      name: 'useCustomZipcode',
      type: 'checkbox',
      label: 'Custom ZIP code?',
    },
  ],
}
```

**Usage:** "The lowest rate in your area is [Rate Display: Lowest → 77002]"
**Renders:** "The lowest rate in your area is 8.5¢/kWh"

### Example 3: Promotion Countdown

```typescript
export const PromoCountdown: Block = {
  slug: 'promoCountdown',
  fields: [
    {
      name: 'promoEndDate',
      type: 'date',
      required: true,
    },
    {
      name: 'format',
      type: 'radio',
      options: [
        { label: 'Days Remaining', value: 'days' },
        { label: 'Full Countdown', value: 'full' },  // "X days, Y hours, Z minutes"
      ],
    },
  ],
}
```

**Usage:** "This offer expires in [Promo Countdown: 2025-12-31 → Days]"
**Renders:** "This offer expires in 23 days"

## How the UI Works

### Step-by-Step User Experience:

1. **Editor is typing:** "Call TXU Energy at "

2. **Clicks "+" button** (or types "/")

3. **Selects "Dynamic Value"** from dropdown

4. **Property 1 appears:** "Type" dropdown
   - Selects "Phone Number"

5. **Property 2 appears:** "Select Value" dropdown
   - Shows ONLY phone numbers (filtered!)
   - Selects "TXU Energy Phone"

6. **Inline block inserted:** Gray pill appears in text
   Text now reads: "Call TXU Energy at `[TXU Energy Phone]`"

7. **Click to edit:** Can click the pill to change selection

8. **Frontend:** Renders as actual phone number

## Benefits

✅ **Editors control values** - No hardcoded data
✅ **Type-safe** - Dropdowns prevent typos
✅ **Centralized** - Update once, changes everywhere
✅ **Conditional fields** - Show/hide based on other selections
✅ **Validation** - Prevent invalid data
✅ **Filtered options** - Only show relevant choices

## Migration Strategy

For our 462 inline components:

**Simple Components → Inline Blocks:**
- `<CurrentYearDirect />` → `currentYear` inline block
- `<CurrentMonthDirect />` → `currentMonth` inline block
- `<TxuPhoneNumber />` → `dynamicDataInstance` (category: phone, instance: TXU)

**Complex Components → Text for now:**
- `<LowestRateDisplay zipcode="77002" />` → "[Lowest Rate: 77002]"
- Can be converted to proper inline block later

## Summary

**Yes, inline blocks can have properties!** In fact, they can have:
- ✅ Single properties (like `YearsSince`)
- ✅ Multiple properties (like `DynamicDataInstance`)
- ✅ Conditional properties (show/hide based on other fields)
- ✅ Filtered dropdowns (like category filtering)
- ✅ Any field type Payload supports

The `DynamicDataInstance` block we've implemented is a perfect example - it has a **category selector** that **filters the phone number dropdown** based on what you choose!
