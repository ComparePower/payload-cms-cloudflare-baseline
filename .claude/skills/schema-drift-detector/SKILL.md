---
name: schema-drift-detector
description: Detect ComparePower API schema changes by comparing current API responses with expected schemas, identifying new/removed/changed fields, and auto-generating Payload field definitions. Use when monitoring API schemas, detecting field changes, updating collection schemas after API changes, generating Payload field configs, or maintaining schema synchronization.
allowed-tools: Read, Write, Bash, WebFetch
---

# Schema Drift Detector Skill

Monitor external API schemas and detect changes that require collection updates.

## What This Skill Does

This skill monitors ComparePower API endpoints for schema changes:
- Fetch current API responses
- Compare with expected schema definitions
- Detect new/removed/changed fields
- Auto-generate Payload field definitions
- Update collection schemas
- Generate migration reports

## When to Use This Skill

Use this skill when:
- Monitoring external API schemas
- Detecting field additions/removals
- Validating schema assumptions
- Generating Payload field configs
- Updating collections after API changes
- Maintaining schema documentation
- Creating migration scripts for schema changes

## Input/Output Contract

### Input
```typescript
interface DriftDetectionInput {
  apiEndpoint: string             // API URL to check
  expectedSchema: SchemaDefinition  // Current schema definition
  collectionName: string          // Target Payload collection
}
```

### Output
```typescript
interface DriftDetectionOutput {
  hasDrift: boolean               // True if changes detected
  newFields: FieldChange[]        // Added fields
  removedFields: FieldChange[]    // Removed fields
  changedFields: FieldChange[]    // Type/structure changes
  payloadFieldDefs: string        // Generated Payload field code
  migrationScript: string         // Update script
  report: string                  // Human-readable report
}
```

## Drift Detection Pipeline

### Phase 1: Fetch Current API Response

**Purpose**: Get latest API data to analyze

**Process**:
```typescript
import fetch from 'node-fetch'

async function fetchApiResponse(endpoint: string): Promise<any> {
  try {
    const response = await fetch(endpoint, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Schema-Drift-Detector/1.0'
      }
    })

    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    throw new Error(`Failed to fetch API: ${error.message}`)
  }
}
```

**Validation**:
- [ ] API returns 200 OK
- [ ] Response is valid JSON
- [ ] Data structure is object/array

### Phase 2: Analyze Response Structure

**Purpose**: Extract field names, types, and structure

**Process**:
```typescript
interface FieldAnalysis {
  name: string
  type: string
  isArray: boolean
  isNullable: boolean
  nested?: FieldAnalysis[]
  sampleValue: any
}

function analyzeStructure(
  data: any,
  prefix = ''
): FieldAnalysis[] {
  const fields: FieldAnalysis[] = []

  for (const [key, value] of Object.entries(data)) {
    const fieldName = prefix ? `${prefix}.${key}` : key

    if (value === null) {
      fields.push({
        name: fieldName,
        type: 'null',
        isArray: false,
        isNullable: true,
        sampleValue: null
      })
    } else if (Array.isArray(value)) {
      const itemType = value.length > 0 ? typeof value[0] : 'unknown'

      fields.push({
        name: fieldName,
        type: itemType,
        isArray: true,
        isNullable: false,
        sampleValue: value[0]
      })

      // Analyze nested array items
      if (value.length > 0 && typeof value[0] === 'object') {
        const nested = analyzeStructure(value[0], fieldName)
        fields.push(...nested)
      }
    } else if (typeof value === 'object') {
      // Nested object
      fields.push({
        name: fieldName,
        type: 'object',
        isArray: false,
        isNullable: false,
        nested: analyzeStructure(value, fieldName),
        sampleValue: value
      })
    } else {
      // Primitive value
      fields.push({
        name: fieldName,
        type: typeof value,
        isArray: false,
        isNullable: false,
        sampleValue: value
      })
    }
  }

  return fields
}
```

**Output**: Complete field inventory

**Validation**:
- [ ] All fields extracted
- [ ] Types detected correctly
- [ ] Nested structures analyzed

### Phase 3: Compare with Expected Schema

**Purpose**: Detect differences between current and expected

**Expected Schema Format**:
```typescript
interface SchemaDefinition {
  collectionName: string
  version: string
  lastUpdated: string
  fields: ExpectedField[]
}

interface ExpectedField {
  name: string
  type: string
  isArray: boolean
  required: boolean
  payloadType: string
}
```

**Comparison Logic**:
```typescript
interface SchemaDrift {
  newFields: FieldChange[]
  removedFields: FieldChange[]
  changedFields: FieldChange[]
}

function compareSchemas(
  current: FieldAnalysis[],
  expected: ExpectedField[]
): SchemaDrift {
  const currentMap = new Map(current.map(f => [f.name, f]))
  const expectedMap = new Map(expected.map(f => [f.name, f]))

  const newFields: FieldChange[] = []
  const removedFields: FieldChange[] = []
  const changedFields: FieldChange[] = []

  // Detect new fields
  for (const field of current) {
    if (!expectedMap.has(field.name)) {
      newFields.push({
        name: field.name,
        action: 'added',
        currentType: field.type,
        isArray: field.isArray,
        sampleValue: field.sampleValue
      })
    }
  }

  // Detect removed fields
  for (const field of expected) {
    if (!currentMap.has(field.name)) {
      removedFields.push({
        name: field.name,
        action: 'removed',
        expectedType: field.type,
        payloadType: field.payloadType
      })
    }
  }

  // Detect changed fields
  for (const field of current) {
    const expectedField = expectedMap.get(field.name)

    if (expectedField) {
      if (field.type !== expectedField.type) {
        changedFields.push({
          name: field.name,
          action: 'type_changed',
          expectedType: expectedField.type,
          currentType: field.type,
          sampleValue: field.sampleValue
        })
      }

      if (field.isArray !== expectedField.isArray) {
        changedFields.push({
          name: field.name,
          action: 'array_changed',
          wasArray: expectedField.isArray,
          isArray: field.isArray
        })
      }
    }
  }

  return { newFields, removedFields, changedFields }
}
```

**Validation**:
- [ ] All new fields detected
- [ ] All removed fields detected
- [ ] Type changes detected
- [ ] Array/scalar changes detected

### Phase 4: Generate Payload Field Definitions

**Purpose**: Auto-generate Payload field configurations for new fields

**Type Mapping**:

| API Type | Payload Type | Notes |
|----------|-------------|-------|
| `string` | `text` | Default |
| `string` (URL) | `text` | With validation |
| `string` (email) | `email` | Email field |
| `number` | `number` | Direct mapping |
| `boolean` | `checkbox` | Direct mapping |
| `object` | `group` | Nested fields |
| `array<string>` | `array` | Text subfield |
| `array<object>` | `array` | Group subfields |

**Code Generation**:
```typescript
function generatePayloadField(
  field: FieldChange
): string {
  const { name, currentType, isArray, sampleValue } = field

  // Detect special types
  if (typeof sampleValue === 'string') {
    if (sampleValue.startsWith('http')) {
      return `{
  name: '${name}',
  type: 'text',
  required: false,
  validate: validateUrl
}`
    }

    if (sampleValue.includes('@')) {
      return `{
  name: '${name}',
  type: 'email',
  required: false
}`
    }
  }

  // Array field
  if (isArray) {
    const itemType = currentType

    if (itemType === 'object') {
      return `{
  name: '${name}',
  type: 'array',
  fields: [
    // TODO: Define nested fields
  ]
}`
    }

    return `{
  name: '${name}',
  type: 'array',
  fields: [
    {
      name: 'value',
      type: '${mapType(itemType)}'
    }
  ]
}`
  }

  // Object field (group)
  if (currentType === 'object') {
    return `{
  name: '${name}',
  type: 'group',
  fields: [
    // TODO: Define nested fields
  ]
}`
  }

  // Primitive field
  return `{
  name: '${name}',
  type: '${mapType(currentType)}',
  required: false
}`
}

function mapType(jsType: string): string {
  switch (jsType) {
    case 'string': return 'text'
    case 'number': return 'number'
    case 'boolean': return 'checkbox'
    default: return 'text'
  }
}
```

**Output**: TypeScript field definitions

**Validation**:
- [ ] Valid Payload field types
- [ ] Proper field structure
- [ ] Required TODO comments for nested fields

### Phase 5: Generate Migration Script

**Purpose**: Create script to update collection schema

**Script Template**:
```typescript
// Generated on ${date} by schema-drift-detector

import type { CollectionConfig } from 'payload'

/**
 * Schema Drift Report
 *
 * New Fields (${newFieldCount}):
${newFieldsList}
 *
 * Removed Fields (${removedFieldCount}):
${removedFieldsList}
 *
 * Changed Fields (${changedFieldCount}):
${changedFieldsList}
 */

// Add these fields to src/collections/${CollectionName}/index.ts:

const newFields = [
${generatedFieldDefs}
]

// Instructions:
// 1. Review generated field definitions
// 2. Update required/validation as needed
// 3. Add fields to collection config
// 4. Run dev server to verify
// 5. Update expected-schema.json
```

**Validation**:
- [ ] Valid TypeScript syntax
- [ ] Clear instructions
- [ ] All changes documented

### Phase 6: Update Expected Schema

**Purpose**: Update schema definition file for future comparisons

**Process**:
```typescript
async function updateExpectedSchema(
  schemaPath: string,
  drift: SchemaDrift
): Promise<void> {
  const schema: SchemaDefinition = JSON.parse(
    fs.readFileSync(schemaPath, 'utf-8')
  )

  // Add new fields
  for (const field of drift.newFields) {
    schema.fields.push({
      name: field.name,
      type: field.currentType!,
      isArray: field.isArray!,
      required: false,  // Default to optional
      payloadType: mapType(field.currentType!)
    })
  }

  // Remove removed fields
  schema.fields = schema.fields.filter(
    f => !drift.removedFields.some(rf => rf.name === f.name)
  )

  // Update changed fields
  for (const change of drift.changedFields) {
    const field = schema.fields.find(f => f.name === change.name)
    if (field && change.currentType) {
      field.type = change.currentType
      field.payloadType = mapType(change.currentType)
    }
  }

  // Update metadata
  schema.version = incrementVersion(schema.version)
  schema.lastUpdated = new Date().toISOString()

  // Write back
  fs.writeFileSync(
    schemaPath,
    JSON.stringify(schema, null, 2),
    'utf-8'
  )
}
```

**Validation**:
- [ ] Schema file updated
- [ ] Version incremented
- [ ] Timestamp updated

## Example Drift Detection

### API Endpoint
```
https://api.comparepower.com/v1/providers/4change-energy
```

### Current API Response
```json
{
  "id": "4change",
  "name": "4Change Energy",
  "phone": "866-420-4567",
  "website": "https://www.4changeenergy.com",
  "rating": 4.5,
  "reviewCount": 1234,
  "plans": [
    {
      "id": "plan-123",
      "name": "Fixed 12",
      "rate": 0.095
    }
  ],
  "serviceAreas": ["Houston", "Dallas"],
  "established": 2012,
  "isGreen": true,
  "email": "support@4changeenergy.com"  // NEW FIELD
}
```

### Expected Schema (Before)
```json
{
  "collectionName": "providers",
  "version": "1.0.0",
  "lastUpdated": "2025-10-01T00:00:00Z",
  "fields": [
    { "name": "id", "type": "string", "isArray": false, "required": true, "payloadType": "text" },
    { "name": "name", "type": "string", "isArray": false, "required": true, "payloadType": "text" },
    { "name": "phone", "type": "string", "isArray": false, "required": true, "payloadType": "text" },
    { "name": "website", "type": "string", "isArray": false, "required": false, "payloadType": "text" },
    { "name": "rating", "type": "number", "isArray": false, "required": false, "payloadType": "number" },
    { "name": "reviewCount", "type": "number", "isArray": false, "required": false, "payloadType": "number" }
  ]
}
```

### Detected Drift

**New Fields**:
- `email` (string) → Payload `email` field
- `established` (number) → Payload `number` field
- `isGreen` (boolean) → Payload `checkbox` field
- `serviceAreas` (array<string>) → Payload `array` field
- `plans` (array<object>) → Payload `array` with nested fields

**Generated Payload Fields**:
```typescript
{
  name: 'email',
  type: 'email',
  required: false
},
{
  name: 'established',
  type: 'number',
  required: false
},
{
  name: 'isGreen',
  type: 'checkbox',
  required: false
},
{
  name: 'serviceAreas',
  type: 'array',
  fields: [
    {
      name: 'value',
      type: 'text'
    }
  ]
},
{
  name: 'plans',
  type: 'array',
  fields: [
    {
      name: 'id',
      type: 'text'
    },
    {
      name: 'name',
      type: 'text'
    },
    {
      name: 'rate',
      type: 'number'
    }
  ]
}
```

### Drift Report

```
===========================================
SCHEMA DRIFT DETECTION REPORT
===========================================

API Endpoint: https://api.comparepower.com/v1/providers/4change-energy
Collection: providers
Timestamp: 2025-10-24T12:30:00Z

-------------------------------------------
SUMMARY
-------------------------------------------
New Fields: 5
Removed Fields: 0
Changed Fields: 0

Status: ⚠️  DRIFT DETECTED

-------------------------------------------
NEW FIELDS (5)
-------------------------------------------

1. email
   Type: string
   Array: false
   Sample: "support@4changeenergy.com"
   Payload Type: email

2. established
   Type: number
   Array: false
   Sample: 2012
   Payload Type: number

3. isGreen
   Type: boolean
   Array: false
   Sample: true
   Payload Type: checkbox

4. serviceAreas
   Type: string[]
   Array: true
   Sample: ["Houston", "Dallas"]
   Payload Type: array

5. plans
   Type: object[]
   Array: true
   Sample: { id: "plan-123", name: "Fixed 12", rate: 0.095 }
   Payload Type: array (nested fields)

-------------------------------------------
REMOVED FIELDS (0)
-------------------------------------------
None

-------------------------------------------
CHANGED FIELDS (0)
-------------------------------------------
None

-------------------------------------------
ACTION REQUIRED
-------------------------------------------

1. Review generated field definitions in:
   .claude/skills/schema-drift-detector/generated-fields.ts

2. Update collection schema:
   src/collections/Providers/index.ts

3. Test changes:
   pnpm dev
   # Navigate to /admin/collections/providers

4. Update expected schema:
   .claude/skills/schema-drift-detector/expected-schemas/providers.json

===========================================
```

## Scripts Reference

### `scripts/detect-changes.ts`

**Purpose**: Compare API response with expected schema

**Usage**:
```bash
pnpm tsx .claude/skills/schema-drift-detector/scripts/detect-changes.ts \
  --api-endpoint "https://api.comparepower.com/v1/providers/4change-energy" \
  --expected-schema expected-schemas/providers.json \
  --collection providers
```

**Output**: Drift report + generated field definitions

### `scripts/update-collections.ts`

**Purpose**: Apply generated field definitions to collection

**Usage**:
```bash
pnpm tsx .claude/skills/schema-drift-detector/scripts/update-collections.ts \
  --collection providers \
  --fields generated-fields.ts
```

**Output**: Updated collection file

## Validation Checklist

Before marking drift detection complete, verify:

- [ ] API endpoint accessible
- [ ] Response parsed successfully
- [ ] All fields extracted
- [ ] Comparison with expected schema complete
- [ ] New fields identified
- [ ] Removed fields identified
- [ ] Changed fields identified
- [ ] Payload field definitions generated
- [ ] Migration script generated
- [ ] Drift report created
- [ ] Expected schema updated

## Troubleshooting

### Issue: API Unreachable

**Symptom**: Fetch fails with network error

**Causes**:
- API down
- Wrong endpoint URL
- Authentication required

**Fix**:
1. Verify API endpoint URL
2. Check API status
3. Add authentication headers if needed
4. Test with curl/Postman first

### Issue: Type Detection Incorrect

**Symptom**: Wrong Payload type generated

**Causes**:
- Sample value not representative
- Field has multiple types
- Null values

**Fix**:
1. Review sample values
2. Manually adjust generated field
3. Add validation logic
4. Update type mapping rules

### Issue: Nested Fields Not Detected

**Symptom**: Object/array structure not analyzed

**Causes**:
- Empty arrays
- Null nested objects
- Recursive structures

**Fix**:
1. Fetch multiple API responses
2. Analyze non-null samples
3. Manually define nested structure
4. Document known nested fields

## Best Practices

1. **Run Regularly**: Check for drift weekly or after API updates
2. **Version Expected Schemas**: Track schema evolution over time
3. **Review Generated Fields**: Don't blindly apply all changes
4. **Test Before Deploying**: Verify new fields work in dev
5. **Document API Changes**: Note why fields were added/removed
6. **Update Migration Scripts**: Keep historical migration records

## Resources

- **Payload Fields**: https://payloadcms.com/docs/fields/overview
- **JSON Schema**: https://json-schema.org/
- **API Versioning**: https://www.postman.com/api-platform/api-versioning/

---

**Created**: 2025-10-24
**Version**: 1.0
**Use**: Ask "Check if API schema changed"
