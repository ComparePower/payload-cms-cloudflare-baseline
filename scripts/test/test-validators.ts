#!/usr/bin/env tsx
/**
 * Test Validation Utilities
 *
 * Demonstrates field and rich text validators in action.
 */

import {
  validateEmail,
  validatePhone,
  validateUrl,
  validateText,
  validateNumber,
  validateSlug,
  validateRichTextContent,
  formatValidationResult
} from '../../src/utilities/validators'

console.log('🧪 Testing Validation Utilities\n')
console.log('='.repeat(60))

// ============================================
// FIELD VALIDATORS
// ============================================

console.log('\n📧 EMAIL VALIDATION\n')

const emailTests = [
  'user@example.com',
  'user@ example.com ',  // Whitespace
  'USER@EXAMPLE.COM',    // Uppercase
  'invalid',             // Invalid
  '',                    // Empty
]

emailTests.forEach(email => {
  const result = validateEmail(email)
  console.log(`  Input: "${email}"`)
  console.log(`  Result: ${result.valid ? '✅' : '❌'} ${result.valid ? result.value : result.error}`)
  console.log('')
})

console.log('='.repeat(60))
console.log('\n📞 PHONE VALIDATION\n')

const phoneTests = [
  ['1234567890', false],
  ['1234567890', true],   // With formatting
  ['(123) 456-7890', false],
  ['123-456-7890', false],
  ['123', false],          // Invalid
]

phoneTests.forEach(([phone, format]) => {
  const result = validatePhone(phone as string, false, format as boolean)
  console.log(`  Input: "${phone}" ${format ? '(format)' : ''}`)
  console.log(`  Result: ${result.valid ? '✅' : '❌'} ${result.valid ? result.value : result.error}`)
  console.log('')
})

console.log('='.repeat(60))
console.log('\n🔗 URL VALIDATION\n')

const urlTests = [
  ['https://example.com ', false, false],
  ['http://example.com', false, false],
  ['http://example.com', true, false],   // Require HTTPS
  ['/about', false, true],                // Relative
  ['not-a-url', false, false],
]

urlTests.forEach(([url, requireHttps, allowRelative]) => {
  const result = validateUrl(url as string, false, requireHttps as boolean, allowRelative as boolean)
  const flags = [
    requireHttps && 'requireHttps',
    allowRelative && 'allowRelative'
  ].filter(Boolean).join(', ')
  console.log(`  Input: "${url}" ${flags ? `(${flags})` : ''}`)
  console.log(`  Result: ${result.valid ? '✅' : '❌'} ${result.valid ? result.value : result.error}`)
  console.log('')
})

console.log('='.repeat(60))
console.log('\n📝 TEXT VALIDATION\n')

const textTests = [
  ['  Hello   World  ', false],
  ['  Hello   World  ', true],  // Normalize whitespace
  ['Test', false, 3],            // Max length
]

textTests.forEach(([text, normalize, maxLength]) => {
  const result = validateText(text as string, false, normalize as boolean, maxLength as number)
  const flags = [
    normalize && 'normalize',
    maxLength && `max=${maxLength}`
  ].filter(Boolean).join(', ')
  console.log(`  Input: "${text}" ${flags ? `(${flags})` : ''}`)
  console.log(`  Result: ${result.valid ? '✅' : '❌'} ${result.valid ? result.value : result.error}`)
  console.log('')
})

console.log('='.repeat(60))
console.log('\n🔢 NUMBER VALIDATION\n')

const numberTests = [
  ['42', undefined, undefined],
  ['42.5', 0, 100],
  ['150', 0, 100],     // Out of range
  ['not-a-number', undefined, undefined],
]

numberTests.forEach(([value, min, max]) => {
  const result = validateNumber(value as string, false, min as number, max as number)
  const range = min !== undefined && max !== undefined ? `(${min}-${max})` : ''
  console.log(`  Input: "${value}" ${range}`)
  console.log(`  Result: ${result.valid ? '✅' : '❌'} ${result.valid ? result.value : result.error}`)
  console.log('')
})

console.log('='.repeat(60))
console.log('\n🔗 SLUG VALIDATION\n')

const slugTests = [
  ['hello-world', false],
  ['hello-world', true],   // Auto-generate
  ['Hello World!', false],
  ['Hello World!', true],  // Auto-generate
]

slugTests.forEach(([slug, autoGenerate]) => {
  const result = validateSlug(slug as string, false, autoGenerate as boolean)
  console.log(`  Input: "${slug}" ${autoGenerate ? '(auto-generate)' : ''}`)
  console.log(`  Result: ${result.valid ? '✅' : '❌'} ${result.valid ? result.value : result.error}`)
  if (result.warnings) {
    result.warnings.forEach(w => console.log(`  Warning: ${w}`))
  }
  console.log('')
})

// ============================================
// RICH TEXT VALIDATORS
// ============================================

console.log('='.repeat(60))
console.log('\n📚 RICH TEXT VALIDATION\n')

// Test case 1: Good hierarchy
console.log('Test 1: Good Hierarchy')
console.log('-'.repeat(60))

const goodHierarchy = {
  root: {
    type: 'root',
    children: [
      {
        type: 'heading',
        tag: 'h1',
        children: [{ type: 'text', text: 'Main Title' }]
      },
      {
        type: 'paragraph',
        children: [{ type: 'text', text: 'Introduction paragraph' }]
      },
      {
        type: 'heading',
        tag: 'h2',
        children: [{ type: 'text', text: 'Section 1' }]
      },
      {
        type: 'heading',
        tag: 'h3',
        children: [{ type: 'text', text: 'Subsection 1.1' }]
      },
      {
        type: 'heading',
        tag: 'h2',
        children: [{ type: 'text', text: 'Section 2' }]
      },
    ]
  }
}

const result1 = validateRichTextContent(goodHierarchy)
console.log(formatValidationResult(result1))

// Test case 2: Skipped heading levels
console.log('\nTest 2: Skipped Heading Levels')
console.log('-'.repeat(60))

const skippedLevels = {
  root: {
    type: 'root',
    children: [
      {
        type: 'heading',
        tag: 'h1',
        children: [{ type: 'text', text: 'Main Title' }]
      },
      {
        type: 'heading',
        tag: 'h2',
        children: [{ type: 'text', text: 'Section 1' }]
      },
      {
        type: 'heading',
        tag: 'h4',  // Skip H3!
        children: [{ type: 'text', text: 'Subsection' }]
      },
    ]
  }
}

const result2 = validateRichTextContent(skippedLevels)
console.log(formatValidationResult(result2))

// Test case 3: Multiple H1s
console.log('\nTest 3: Multiple H1 Headings')
console.log('-'.repeat(60))

const multipleH1s = {
  root: {
    type: 'root',
    children: [
      {
        type: 'heading',
        tag: 'h1',
        children: [{ type: 'text', text: 'First Title' }]
      },
      {
        type: 'paragraph',
        children: [{ type: 'text', text: 'Some content' }]
      },
      {
        type: 'heading',
        tag: 'h1',  // Second H1!
        children: [{ type: 'text', text: 'Second Title' }]
      },
    ]
  }
}

const result3 = validateRichTextContent(multipleH1s)
console.log(formatValidationResult(result3))

// Test case 4: Generic link text
console.log('\nTest 4: Link Accessibility Issues')
console.log('-'.repeat(60))

const badLinks = {
  root: {
    type: 'root',
    children: [
      {
        type: 'paragraph',
        children: [
          { type: 'text', text: 'For more information, ' },
          {
            type: 'link',
            url: 'https://example.com',
            children: [{ type: 'text', text: 'click here' }]
          },
          { type: 'text', text: '.' }
        ]
      },
      {
        type: 'paragraph',
        children: [
          { type: 'text', text: 'Read the docs ' },
          {
            type: 'link',
            url: 'https://example.com',
            children: [{ type: 'text', text: 'here' }]
          },
        ]
      }
    ]
  }
}

const result4 = validateRichTextContent(badLinks)
console.log(formatValidationResult(result4))

console.log('\n' + '='.repeat(60))
console.log('✅ All validator tests complete!\n')
