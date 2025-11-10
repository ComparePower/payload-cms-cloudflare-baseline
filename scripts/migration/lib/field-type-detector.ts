/**
 * Field Type Detector
 *
 * Analyzes frontmatter field values across multiple MDX files to intelligently
 * suggest Payload field types for unmapped fields.
 *
 * Detects:
 * - Date fields (ISO strings, YYYY-MM-DD patterns)
 * - Boolean fields (true/false, 1/0)
 * - Number fields (integers, floats)
 * - Relationship fields (slug patterns matching team members, categories, etc.)
 * - Upload fields (file paths with image/media extensions)
 * - Text fields (default fallback)
 *
 * Used by interactive field mapper to provide smart defaults during prompts.
 */

import fs from 'fs/promises'
import path from 'path'
import matter from 'gray-matter'

export interface FieldAnalysis {
  fieldName: string
  suggestedType: 'text' | 'number' | 'checkbox' | 'date' | 'relationship' | 'upload'
  confidence: number // 0-1 score
  exampleValues: any[]
  fileCount: number
  patterns: {
    hasDatePattern: boolean
    hasBooleanPattern: boolean
    hasNumberPattern: boolean
    hasSlugPattern: boolean
    hasUploadPathPattern: boolean
    isArray: boolean
  }
  relationshipHints?: {
    suggestedCollection?: string // e.g., "team", "categories", "tags"
    reason?: string
  }
}

/**
 * Analyze a single field across all MDX files
 *
 * @param fieldName - Name of the frontmatter field to analyze
 * @param mdxFiles - Array of absolute paths to MDX files
 * @returns Field analysis with suggested type
 */
export async function analyzeField(
  fieldName: string,
  mdxFiles: string[]
): Promise<FieldAnalysis> {
  const values: any[] = []
  let fileCount = 0

  // Collect all values for this field
  for (const filePath of mdxFiles) {
    try {
      const fileContent = await fs.readFile(filePath, 'utf-8')
      const { data: frontmatter } = matter(fileContent)

      if (fieldName in frontmatter && frontmatter[fieldName] !== undefined) {
        values.push(frontmatter[fieldName])
        fileCount++
      }
    } catch (error) {
      // Skip unreadable files
      continue
    }
  }

  // If no values found, default to text
  if (values.length === 0) {
    return {
      fieldName,
      suggestedType: 'text',
      confidence: 0,
      exampleValues: [],
      fileCount: 0,
      patterns: {
        hasDatePattern: false,
        hasBooleanPattern: false,
        hasNumberPattern: false,
        hasSlugPattern: false,
        hasUploadPathPattern: false,
        isArray: false,
      },
    }
  }

  // Analyze patterns
  const patterns = analyzePatterns(values)

  // Determine suggested type and confidence
  const { suggestedType, confidence, relationshipHints } = determineSuggestedType(
    fieldName,
    values,
    patterns
  )

  // Get diverse example values (up to 5)
  const exampleValues = getExampleValues(values, 5)

  return {
    fieldName,
    suggestedType,
    confidence,
    exampleValues,
    fileCount,
    patterns,
    relationshipHints,
  }
}

/**
 * Analyze patterns in field values
 */
function analyzePatterns(values: any[]): FieldAnalysis['patterns'] {
  let hasDatePattern = false
  let hasBooleanPattern = false
  let hasNumberPattern = false
  let hasSlugPattern = false
  let hasUploadPathPattern = false
  let isArray = false

  // Sample up to 50 values for pattern detection
  const sampleSize = Math.min(values.length, 50)
  const sample = values.slice(0, sampleSize)

  for (const value of sample) {
    // Check if array
    if (Array.isArray(value)) {
      isArray = true
      // Analyze array elements
      for (const item of value) {
        if (typeof item === 'string') {
          if (isDateString(item)) hasDatePattern = true
          if (isSlugString(item)) hasSlugPattern = true
          if (isUploadPath(item)) hasUploadPathPattern = true
        }
      }
    } else {
      // Single value analysis
      if (typeof value === 'boolean') {
        hasBooleanPattern = true
      } else if (typeof value === 'number') {
        hasNumberPattern = true
      } else if (typeof value === 'string') {
        if (isBooleanString(value)) hasBooleanPattern = true
        if (isDateString(value)) hasDatePattern = true
        if (isSlugString(value)) hasSlugPattern = true
        if (isUploadPath(value)) hasUploadPathPattern = true
        if (isNumericString(value)) hasNumberPattern = true
      }
    }
  }

  return {
    hasDatePattern,
    hasBooleanPattern,
    hasNumberPattern,
    hasSlugPattern,
    hasUploadPathPattern,
    isArray,
  }
}

/**
 * Determine suggested type and confidence based on patterns
 */
function determineSuggestedType(
  fieldName: string,
  values: any[],
  patterns: FieldAnalysis['patterns']
): {
  suggestedType: FieldAnalysis['suggestedType']
  confidence: number
  relationshipHints?: FieldAnalysis['relationshipHints']
} {
  const lowerFieldName = fieldName.toLowerCase()

  // High confidence patterns (95%+)

  // Date fields
  if (patterns.hasDatePattern && !patterns.hasBooleanPattern && !patterns.hasNumberPattern) {
    const dateConfidence = calculatePatternConfidence(values, isDateString)
    if (dateConfidence > 0.8) {
      return { suggestedType: 'date', confidence: Math.min(dateConfidence, 0.95) }
    }
  }

  // Boolean fields
  if (patterns.hasBooleanPattern && !patterns.hasDatePattern && !patterns.hasSlugPattern) {
    const boolConfidence = calculatePatternConfidence(values, (v) =>
      typeof v === 'boolean' || isBooleanString(v)
    )
    if (boolConfidence > 0.8) {
      return { suggestedType: 'checkbox', confidence: Math.min(boolConfidence, 0.95) }
    }
  }

  // Number fields
  if (patterns.hasNumberPattern && !patterns.hasBooleanPattern && !patterns.hasSlugPattern) {
    const numConfidence = calculatePatternConfidence(values, (v) =>
      typeof v === 'number' || isNumericString(v)
    )
    if (numConfidence > 0.8) {
      return { suggestedType: 'number', confidence: Math.min(numConfidence, 0.95) }
    }
  }

  // Upload fields (image/media paths)
  if (patterns.hasUploadPathPattern) {
    const uploadConfidence = calculatePatternConfidence(values, isUploadPath)
    if (uploadConfidence > 0.7) {
      return { suggestedType: 'upload', confidence: Math.min(uploadConfidence, 0.90) }
    }
  }

  // Medium confidence patterns (70-90%)

  // Relationship fields - detected by naming patterns + slug patterns
  if (patterns.hasSlugPattern || patterns.isArray) {
    const relationshipHints = detectRelationshipHints(fieldName, values)
    if (relationshipHints) {
      return {
        suggestedType: 'relationship',
        confidence: 0.75,
        relationshipHints,
      }
    }
  }

  // Field name-based suggestions (60-70% confidence)

  // Editorial team relationships
  if (lowerFieldName.includes('team') && lowerFieldName.includes('member')) {
    return {
      suggestedType: 'relationship',
      confidence: 0.65,
      relationshipHints: {
        suggestedCollection: 'team',
        reason: 'Field name contains "team" and "member"',
      },
    }
  }

  // Author/editor relationships
  if (
    lowerFieldName.includes('author') ||
    lowerFieldName.includes('editor') ||
    lowerFieldName.includes('writer') ||
    lowerFieldName.includes('reviewer')
  ) {
    return {
      suggestedType: 'relationship',
      confidence: 0.65,
      relationshipHints: {
        suggestedCollection: 'team',
        reason: `Field name suggests editorial team member (${fieldName})`,
      },
    }
  }

  // Category/tag relationships
  if (lowerFieldName.includes('categor') || lowerFieldName.includes('tag')) {
    const collection = lowerFieldName.includes('categor') ? 'categories' : 'tags'
    return {
      suggestedType: 'relationship',
      confidence: 0.70,
      relationshipHints: {
        suggestedCollection: collection,
        reason: `Field name suggests ${collection} relationship`,
      },
    }
  }

  // Image/media fields
  if (
    lowerFieldName.includes('image') ||
    lowerFieldName.includes('media') ||
    lowerFieldName.includes('photo') ||
    lowerFieldName.includes('picture')
  ) {
    return { suggestedType: 'upload', confidence: 0.60 }
  }

  // Date fields by name
  if (lowerFieldName.includes('date') || lowerFieldName.includes('time')) {
    return { suggestedType: 'date', confidence: 0.60 }
  }

  // Low confidence - default to text
  return { suggestedType: 'text', confidence: 0.50 }
}

/**
 * Detect relationship hints from field name and values
 */
function detectRelationshipHints(
  fieldName: string,
  values: any[]
): FieldAnalysis['relationshipHints'] | undefined {
  const lowerFieldName = fieldName.toLowerCase()

  // Check if values are slug-like strings or arrays of slugs
  const hasSlugValues = values.some((v) => {
    if (typeof v === 'string') return isSlugString(v)
    if (Array.isArray(v)) return v.some((item) => typeof item === 'string' && isSlugString(item))
    return false
  })

  if (!hasSlugValues) return undefined

  // Suggest collection based on field name patterns
  if (lowerFieldName.includes('team') || lowerFieldName.includes('member')) {
    return {
      suggestedCollection: 'team',
      reason: 'Slug-like values + field name contains "team"',
    }
  }

  if (lowerFieldName.includes('author') || lowerFieldName.includes('editor')) {
    return {
      suggestedCollection: 'team',
      reason: 'Slug-like values + field name suggests editorial team',
    }
  }

  if (lowerFieldName.includes('categor')) {
    return {
      suggestedCollection: 'categories',
      reason: 'Slug-like values + field name contains "category"',
    }
  }

  if (lowerFieldName.includes('tag')) {
    return {
      suggestedCollection: 'tags',
      reason: 'Slug-like values + field name contains "tag"',
    }
  }

  // Generic relationship suggestion
  return {
    suggestedCollection: undefined,
    reason: 'Values appear to be slugs referencing another collection',
  }
}

/**
 * Calculate confidence score based on how many values match a pattern
 */
function calculatePatternConfidence(values: any[], predicate: (value: any) => boolean): number {
  if (values.length === 0) return 0

  let matches = 0
  for (const value of values) {
    if (Array.isArray(value)) {
      // For arrays, check if all elements match
      if (value.length > 0 && value.every(predicate)) {
        matches++
      }
    } else {
      if (predicate(value)) {
        matches++
      }
    }
  }

  return matches / values.length
}

/**
 * Get diverse example values (not all the same)
 */
function getExampleValues(values: any[], maxCount: number): any[] {
  const seen = new Set<string>()
  const examples: any[] = []

  for (const value of values) {
    const key = JSON.stringify(value)
    if (!seen.has(key)) {
      seen.add(key)
      examples.push(value)
      if (examples.length >= maxCount) break
    }
  }

  return examples
}

/**
 * Check if string is a date (ISO or YYYY-MM-DD)
 */
function isDateString(value: any): boolean {
  if (typeof value !== 'string') return false

  const str = value.trim()

  // ISO 8601 format
  if (str.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
    return !isNaN(Date.parse(str))
  }

  // YYYY-MM-DD format
  if (str.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return !isNaN(Date.parse(str + 'T00:00:00Z'))
  }

  return false
}

/**
 * Check if string is boolean-like
 */
function isBooleanString(value: any): boolean {
  if (typeof value !== 'string') return false
  const lower = value.toLowerCase().trim()
  return lower === 'true' || lower === 'false' || lower === '1' || lower === '0'
}

/**
 * Check if string is numeric
 */
function isNumericString(value: any): boolean {
  if (typeof value !== 'string') return false
  const num = Number(value.trim())
  return !isNaN(num) && isFinite(num)
}

/**
 * Check if string is a slug (kebab-case identifier)
 */
function isSlugString(value: any): boolean {
  if (typeof value !== 'string') return false
  // Slug pattern: lowercase letters, numbers, hyphens (no spaces, no special chars)
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(value.trim())
}

/**
 * Check if string is an upload/media file path
 */
function isUploadPath(value: any): boolean {
  if (typeof value !== 'string') return false

  const str = value.toLowerCase().trim()

  // Common upload patterns
  const uploadPatterns = [
    /^\/uploads\//,
    /^\/media\//,
    /^\/files\//,
    /^\/images\//,
    /^\/assets\//,
    /\.(jpg|jpeg|png|gif|svg|webp|pdf|doc|docx|zip)$/i,
  ]

  return uploadPatterns.some((pattern) => pattern.test(str))
}

/**
 * Analyze multiple unmapped fields across all MDX files
 *
 * @param unmappedFields - Array of field names to analyze
 * @param mdxFiles - Array of absolute paths to MDX files
 * @returns Map of field analyses
 */
export async function analyzeUnmappedFields(
  unmappedFields: string[],
  mdxFiles: string[]
): Promise<Map<string, FieldAnalysis>> {
  const analyses = new Map<string, FieldAnalysis>()

  console.log(`   Analyzing ${unmappedFields.length} field(s) across ${mdxFiles.length} file(s)...`)

  for (let i = 0; i < unmappedFields.length; i++) {
    const fieldName = unmappedFields[i]
    process.stdout.write(`   [${i + 1}/${unmappedFields.length}] Analyzing "${fieldName}"...\r`)
    const analysis = await analyzeField(fieldName, mdxFiles)
    analyses.set(fieldName, analysis)
  }

  console.log(`   ✓ Analysis complete for ${unmappedFields.length} field(s)` + ' '.repeat(30))

  return analyses
}
