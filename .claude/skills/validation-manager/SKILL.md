---
name: validation-manager
description: Manage custom validators in src/utilities/validators/ including field validators (email, phone, URL, text, number, slug) and rich-text validators (heading hierarchy, accessibility, links). Create new validators, update existing ones, apply to collection hooks, generate test cases, and document validator usage.
allowed-tools: Read, Write, Bash
---

# Validation Manager Skill

Manage custom validators for Payload collections and fields.

## What This Skill Does

This skill manages the validation system in `src/utilities/validators/`:
- Create new field validators
- Update existing validators
- Apply validators to collection hooks
- Generate validator test cases
- Document validator usage
- Ensure validation consistency

## When to Use This Skill

Use this skill when:
- Creating a new validator (email, phone, custom format)
- Updating validator logic
- Applying validation to collection fields
- Generating validator test cases
- Documenting validation rules
- Fixing validation bugs
- Adding validation to migration scripts

## Input/Output Contract

### Input
```typescript
interface ValidatorInput {
  type: 'field' | 'richText'      // Validator type
  name: string                     // Validator name
  logic?: string                   // Validation logic (for new validators)
  collection?: string              // Target collection (for hooks)
}
```

### Output
```typescript
interface ValidatorOutput {
  validatorPath: string            // Path to validator file
  testPath: string                 // Path to test file
  hookCode?: string                // Collection hook code
  documentation: string            // Usage documentation
}
```

## Current Validators

### Field Validators (`src/utilities/validators/field-validators.ts`)

#### 1. `validateEmail`
```typescript
export function validateEmail(
  email: string | undefined | null,
  required = false
): ValidationResult {
  if (!email || email.trim() === '') {
    if (required) return { valid: false, error: 'Email is required' }
    return { valid: true, value: undefined }
  }

  const cleaned = email.trim().replace(/\s+/g, '')
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (!emailRegex.test(cleaned)) {
    return { valid: false, error: `Invalid email format: "${email}"` }
  }

  return { valid: true, value: cleaned.toLowerCase() }
}
```

**Usage**:
- Email field validation
- Contact form emails
- User registration

#### 2. `validatePhone`
```typescript
export function validatePhone(
  phone: string | undefined | null,
  required = false
): ValidationResult {
  if (!phone || phone.trim() === '') {
    if (required) return { valid: false, error: 'Phone number is required' }
    return { valid: true, value: undefined }
  }

  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '')

  // US phone numbers: 10 or 11 digits (with country code)
  if (cleaned.length !== 10 && cleaned.length !== 11) {
    return {
      valid: false,
      error: `Invalid phone format: "${phone}". Must be 10 or 11 digits.`
    }
  }

  // Format as (XXX) XXX-XXXX
  const formatted = cleaned.length === 11
    ? `+${cleaned[0]} (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`
    : `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`

  return { valid: true, value: formatted }
}
```

**Usage**:
- Provider phone numbers
- Contact information
- Customer support lines

#### 3. `validateUrl`
```typescript
export function validateUrl(
  url: string | undefined | null,
  required = false
): ValidationResult {
  if (!url || url.trim() === '') {
    if (required) return { valid: false, error: 'URL is required' }
    return { valid: true, value: undefined }
  }

  const cleaned = url.trim()

  try {
    const parsed = new URL(cleaned)

    // Only allow http/https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return {
        valid: false,
        error: `Invalid protocol: "${parsed.protocol}". Must be http or https.`
      }
    }

    return { valid: true, value: cleaned }
  } catch {
    return {
      valid: false,
      error: `Invalid URL format: "${url}"`
    }
  }
}
```

**Usage**:
- Website URLs
- External links
- Provider websites

#### 4. `validateSlug`
```typescript
export function validateSlug(
  slug: string | undefined | null,
  required = false
): ValidationResult {
  if (!slug || slug.trim() === '') {
    if (required) return { valid: false, error: 'Slug is required' }
    return { valid: true, value: undefined }
  }

  const cleaned = slug.trim().toLowerCase()

  // Slug regex: lowercase letters, numbers, hyphens
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

  if (!slugRegex.test(cleaned)) {
    return {
      valid: false,
      error: `Invalid slug format: "${slug}". Must be lowercase letters, numbers, and hyphens.`
    }
  }

  return { valid: true, value: cleaned }
}
```

**Usage**:
- URL slugs
- Collection identifiers
- Route paths

#### 5. `validateText`
```typescript
export function validateText(
  text: string | undefined | null,
  options: {
    required?: boolean
    minLength?: number
    maxLength?: number
    pattern?: RegExp
  } = {}
): ValidationResult {
  const { required = false, minLength, maxLength, pattern } = options

  if (!text || text.trim() === '') {
    if (required) return { valid: false, error: 'Text is required' }
    return { valid: true, value: undefined }
  }

  const cleaned = text.trim()

  if (minLength && cleaned.length < minLength) {
    return {
      valid: false,
      error: `Text must be at least ${minLength} characters (got ${cleaned.length})`
    }
  }

  if (maxLength && cleaned.length > maxLength) {
    return {
      valid: false,
      error: `Text must be no more than ${maxLength} characters (got ${cleaned.length})`
    }
  }

  if (pattern && !pattern.test(cleaned)) {
    return {
      valid: false,
      error: `Text does not match required pattern`
    }
  }

  return { valid: true, value: cleaned }
}
```

**Usage**:
- Title fields
- Description fields
- Any text with constraints

#### 6. `validateNumber`
```typescript
export function validateNumber(
  value: number | string | undefined | null,
  options: {
    required?: boolean
    min?: number
    max?: number
    integer?: boolean
  } = {}
): ValidationResult {
  const { required = false, min, max, integer = false } = options

  if (value === null || value === undefined || value === '') {
    if (required) return { valid: false, error: 'Number is required' }
    return { valid: true, value: undefined }
  }

  const num = typeof value === 'string' ? parseFloat(value) : value

  if (isNaN(num)) {
    return { valid: false, error: `Invalid number: "${value}"` }
  }

  if (integer && !Number.isInteger(num)) {
    return { valid: false, error: `Must be an integer (got ${num})` }
  }

  if (min !== undefined && num < min) {
    return { valid: false, error: `Must be >= ${min} (got ${num})` }
  }

  if (max !== undefined && num > max) {
    return { valid: false, error: `Must be <= ${max} (got ${num})` }
  }

  return { valid: true, value: num }
}
```

**Usage**:
- Numeric IDs
- Rates and prices
- Counts and quantities

### Rich-Text Validators (`src/utilities/validators/rich-text-validators.ts`)

#### `validateRichTextContent`

**Purpose**: Validate Lexical JSON structure and content

**Checks**:
1. Heading hierarchy (no h3 before h2)
2. H1 limits (max 1 per document)
3. Link accessibility (descriptive text, no "click here")
4. Content length (min/max words)
5. Valid node structure

**Usage**:
```typescript
import { validateRichTextContent } from '@/utilities/validators/rich-text-validators'

const result = validateRichTextContent(lexicalJSON, {
  maxH1Count: 1,
  requireH1: true,
  minWords: 100,
  maxWords: 5000,
  checkLinkAccessibility: true
})

if (!result.valid) {
  console.error('Rich text validation failed:', result.errors)
}
```

**Example Hook**:
```typescript
import { createRichTextValidationHook } from '@/utilities/validators/rich-text-validators'

export const Providers: CollectionConfig = {
  slug: 'providers',
  hooks: {
    beforeValidate: [
      createRichTextValidationHook({
        maxH1Count: 1,
        requireH1: true,
        minWords: 100
      })
    ]
  },
  fields: [
    {
      name: 'content',
      type: 'richText',
      required: true
    }
  ]
}
```

## Creating New Validators

### Step 1: Define Validator Logic

**Template**:
```typescript
// src/utilities/validators/custom-validators.ts

export interface ValidationResult {
  valid: boolean
  error?: string
  value?: any
}

export function validateCustomField(
  value: any,
  required = false
): ValidationResult {
  // Handle empty values
  if (value === null || value === undefined || value === '') {
    if (required) {
      return { valid: false, error: 'Field is required' }
    }
    return { valid: true, value: undefined }
  }

  // Custom validation logic
  if (/* validation condition */) {
    return { valid: false, error: 'Validation failed' }
  }

  // Return cleaned/formatted value
  return { valid: true, value: cleanedValue }
}
```

### Step 2: Add Tests

**Template**:
```typescript
// src/utilities/validators/custom-validators.test.ts

import { describe, it, expect } from 'vitest'
import { validateCustomField } from './custom-validators'

describe('validateCustomField', () => {
  it('accepts valid values', () => {
    const result = validateCustomField('valid-value')
    expect(result.valid).toBe(true)
    expect(result.value).toBe('valid-value')
  })

  it('rejects invalid values', () => {
    const result = validateCustomField('invalid-value')
    expect(result.valid).toBe(false)
    expect(result.error).toContain('Validation failed')
  })

  it('handles empty values when required', () => {
    const result = validateCustomField(null, true)
    expect(result.valid).toBe(false)
    expect(result.error).toBe('Field is required')
  })

  it('accepts empty values when not required', () => {
    const result = validateCustomField(null, false)
    expect(result.valid).toBe(true)
    expect(result.value).toBeUndefined()
  })
})
```

### Step 3: Apply to Collection

**Hook Pattern**:
```typescript
import { validateCustomField } from '@/utilities/validators/custom-validators'
import type { CollectionBeforeValidateHook } from 'payload'

const validateCustomFieldHook: CollectionBeforeValidateHook = async ({
  data,
  req,
  operation
}) => {
  if (!data.customField) return data

  const result = validateCustomField(data.customField, true)

  if (!result.valid) {
    req.payload.logger.error(`Custom field validation failed: ${result.error}`)
    throw new Error(result.error)
  }

  // Update with cleaned value
  return {
    ...data,
    customField: result.value
  }
}

export const MyCollection: CollectionConfig = {
  slug: 'my-collection',
  hooks: {
    beforeValidate: [validateCustomFieldHook]
  },
  fields: [
    {
      name: 'customField',
      type: 'text',
      required: true
    }
  ]
}
```

### Step 4: Document Usage

**Template**:
```markdown
## validateCustomField

**Purpose**: Validate custom field format

**Parameters**:
- `value` (any) - Value to validate
- `required` (boolean) - Whether field is required

**Returns**: `ValidationResult`
- `valid` (boolean) - Whether validation passed
- `error` (string) - Error message if invalid
- `value` (any) - Cleaned/formatted value

**Example**:
\`\`\`typescript
const result = validateCustomField('test-value', true)
if (!result.valid) {
  console.error(result.error)
}
\`\`\`

**Usage in Collections**:
- MyCollection (customField)
- OtherCollection (otherField)
```

## Example: Creating Phone Number Validator with Extensions

### Validator Logic

```typescript
// src/utilities/validators/field-validators.ts

export function validatePhoneWithExtension(
  phone: string | undefined | null,
  required = false
): ValidationResult {
  if (!phone || phone.trim() === '') {
    if (required) return { valid: false, error: 'Phone number is required' }
    return { valid: true, value: undefined }
  }

  // Split phone and extension
  const parts = phone.split(/x|ext/i)
  const mainPhone = parts[0].trim()
  const extension = parts[1]?.trim()

  // Validate main phone
  const phoneResult = validatePhone(mainPhone, required)
  if (!phoneResult.valid) {
    return phoneResult
  }

  // Validate extension (digits only)
  if (extension) {
    const extDigits = extension.replace(/\D/g, '')
    if (extDigits.length === 0) {
      return {
        valid: false,
        error: 'Extension must contain digits'
      }
    }

    return {
      valid: true,
      value: `${phoneResult.value} ext. ${extDigits}`
    }
  }

  return phoneResult
}
```

### Tests

```typescript
// src/utilities/validators/field-validators.test.ts

describe('validatePhoneWithExtension', () => {
  it('accepts phone with extension', () => {
    const result = validatePhoneWithExtension('866-420-4567 x123')
    expect(result.valid).toBe(true)
    expect(result.value).toBe('(866) 420-4567 ext. 123')
  })

  it('accepts phone without extension', () => {
    const result = validatePhoneWithExtension('866-420-4567')
    expect(result.valid).toBe(true)
    expect(result.value).toBe('(866) 420-4567')
  })

  it('rejects invalid extension', () => {
    const result = validatePhoneWithExtension('866-420-4567 x abc')
    expect(result.valid).toBe(false)
    expect(result.error).toContain('Extension must contain digits')
  })
})
```

### Collection Hook

```typescript
// src/collections/Providers/index.ts

import { validatePhoneWithExtension } from '@/utilities/validators/field-validators'

const validateProviderPhoneHook: CollectionBeforeValidateHook = async ({
  data,
  req
}) => {
  if (!data.phone) return data

  const result = validatePhoneWithExtension(data.phone, true)

  if (!result.valid) {
    req.payload.logger.error(`Phone validation failed: ${result.error}`)
    throw new Error(result.error)
  }

  return {
    ...data,
    phone: result.value
  }
}

export const Providers: CollectionConfig = {
  slug: 'providers',
  hooks: {
    beforeValidate: [validateProviderPhoneHook]
  },
  fields: [
    {
      name: 'phone',
      type: 'text',
      required: true
    }
  ]
}
```

## Scripts Reference

### `scripts/test-validators.ts`

**Purpose**: Run validator test suite

**Usage**:
```bash
pnpm test src/utilities/validators
```

**Output**: Test results with coverage

### `scripts/apply-to-collection.ts`

**Purpose**: Generate hook code for applying validator

**Usage**:
```bash
pnpm tsx .claude/skills/validation-manager/scripts/apply-to-collection.ts \
  --validator validateEmail \
  --collection providers \
  --field email
```

**Output**: Hook code to paste into collection

## Validation Checklist

Before marking validator complete, verify:

- [ ] Validator logic implemented
- [ ] Handles null/undefined/empty values
- [ ] Required parameter works
- [ ] Cleans/formats value
- [ ] Returns ValidationResult
- [ ] Tests written (4+ cases)
- [ ] Tests passing
- [ ] Applied to collection hook (if needed)
- [ ] Documentation updated
- [ ] Usage examples provided

## Troubleshooting

### Issue: Validator Not Running

**Symptom**: Field accepts invalid values

**Causes**:
- Hook not registered
- Hook placed in wrong lifecycle
- Validation logic has bug

**Fix**:
1. Check `beforeValidate` hook is registered
2. Test validator function directly
3. Add logging to hook
4. Review Payload hook docs

### Issue: Tests Failing

**Symptom**: Validator tests don't pass

**Causes**:
- Test expectations wrong
- Validator logic has bug
- Test setup incorrect

**Fix**:
1. Run tests in isolation
2. Add console.log to validator
3. Check test data
4. Review error messages

### Issue: Wrong Value Saved

**Symptom**: Cleaned value not persisted

**Causes**:
- Not returning updated data from hook
- Hook in wrong lifecycle
- Validation happens too late

**Fix**:
1. Ensure hook returns data with cleaned value
2. Use `beforeValidate` not `afterChange`
3. Check Payload field sanitization

## Best Practices

1. **Test First**: Write tests before implementation
2. **Handle Edge Cases**: null, undefined, empty string, whitespace
3. **Clean Values**: Format/normalize before saving
4. **Clear Errors**: Provide actionable error messages
5. **Document Usage**: Show examples in code comments
6. **Reuse Validators**: Don't duplicate validation logic
7. **Log Failures**: Help debugging with clear logs

## Resources

- **Payload Hooks**: https://payloadcms.com/docs/hooks/overview
- **Payload Validation**: https://payloadcms.com/docs/fields/overview#validation
- **Vitest Testing**: https://vitest.dev/guide/

---

**Created**: 2025-10-24
**Version**: 1.0
**Use**: Ask "Add phone number validator" or "Update email validator"
