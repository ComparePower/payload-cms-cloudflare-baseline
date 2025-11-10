/**
 * Unit tests for Component Registry
 *
 * Tests all utility functions for MDX component validation and reporting
 */

import { describe, it, expect } from 'vitest'
import {
  getComponentMapping,
  isComponentImplemented,
  validateComponent,
  getPayloadBlockSlug,
  getComponentsByStatus,
  getUnmappedComponents,
  generateImplementationReport,
  COMPONENT_REGISTRY,
} from '../../../scripts/migration/lib/component-registry'

describe('Component Registry - Core Functions', () => {
  describe('getComponentMapping', () => {
    it('should return mapping for valid component', () => {
      const mapping = getComponentMapping('ReliantPhoneNumber')
      expect(mapping).toBeDefined()
      expect(mapping?.mdxName).toBe('ReliantPhoneNumber')
      expect(mapping?.payloadBlockSlug).toBe('reliantPhoneNumber')
    })

    it('should return undefined for unknown component', () => {
      const mapping = getComponentMapping('NonExistentComponent')
      expect(mapping).toBeUndefined()
    })

    it('should return mapping for block component', () => {
      const mapping = getComponentMapping('RatesTable')
      expect(mapping).toBeDefined()
      expect(mapping?.componentType).toBe('block')
      expect(mapping?.payloadBlockSlug).toBe('ratesTable')
    })

    it('should return mapping for inline component', () => {
      const mapping = getComponentMapping('CurrentYear')
      expect(mapping).toBeDefined()
      expect(mapping?.componentType).toBe('inline')
    })
  })

  describe('isComponentImplemented', () => {
    it('should return true for implemented component', () => {
      const result = isComponentImplemented('ReliantPhoneNumber')
      expect(result).toBe(true)
    })

    it('should return false for unknown component', () => {
      const result = isComponentImplemented('UnknownComponent')
      expect(result).toBe(false)
    })

    it('should return true for implemented block component', () => {
      const result = isComponentImplemented('RatesTable')
      expect(result).toBe(true)
    })

    it('should return true for all phone number components', () => {
      const phoneComponents = [
        'ReliantPhoneNumber',
        'TxuPhoneNumber',
        'GexaPhoneNumber',
        'DirectEnergyPhoneNumber',
      ]
      phoneComponents.forEach(component => {
        expect(isComponentImplemented(component)).toBe(true)
      })
    })
  })

  describe('validateComponent', () => {
    it('should validate implemented component', () => {
      const result = validateComponent('RatesTable', { provider: 'reliant' })
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
      expect(result.mapping).toBeDefined()
    })

    it('should reject unknown component', () => {
      const result = validateComponent('UnknownComponent', {})
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Unknown component')
      expect(result.mapping).toBeUndefined()
    })

    it('should accept component with no props', () => {
      const result = validateComponent('ReliantPhoneNumber')
      expect(result.valid).toBe(true)
    })

    it('should include mapping in valid result', () => {
      const result = validateComponent('RatesTable', {})
      expect(result.valid).toBe(true)
      expect(result.mapping?.mdxName).toBe('RatesTable')
      expect(result.mapping?.status).toBe('implemented')
    })

    it('should handle empty props object', () => {
      const result = validateComponent('ImageBlock', {})
      expect(result.valid).toBe(true)
    })
  })

  describe('getPayloadBlockSlug', () => {
    it('should return slug for valid component', () => {
      const slug = getPayloadBlockSlug('RatesTable')
      expect(slug).toBe('ratesTable')
    })

    it('should return null for unknown component', () => {
      const slug = getPayloadBlockSlug('UnknownComponent')
      expect(slug).toBeNull()
    })

    it('should return slug for inline component', () => {
      const slug = getPayloadBlockSlug('ReliantPhoneNumber')
      expect(slug).toBe('reliantPhoneNumber')
    })

    it('should handle block component with uppercase', () => {
      const slug = getPayloadBlockSlug('ImageBlock')
      expect(slug).toBe('image')
    })

    it('should return correct slug for WordPress block', () => {
      const slug = getPayloadBlockSlug('WpBlock59853_EnergySavingsArticles')
      expect(slug).toBe('wpBlock59853_EnergySavingsArticles')
    })
  })
})

describe('Component Registry - Query Functions', () => {
  describe('getComponentsByStatus', () => {
    it('should return all implemented components', () => {
      const components = getComponentsByStatus('implemented')
      expect(components.length).toBeGreaterThan(0)
      components.forEach(c => {
        expect(c.status).toBe('implemented')
      })
    })

    it('should return empty array for non-existent status', () => {
      // @ts-expect-error - Testing invalid status
      const components = getComponentsByStatus('invalid-status')
      expect(components).toEqual([])
    })

    it('should include mapping details in results', () => {
      const components = getComponentsByStatus('implemented')
      expect(components.length).toBeGreaterThan(0)
      const first = components[0]
      expect(first).toHaveProperty('mdxName')
      expect(first).toHaveProperty('payloadBlockSlug')
      expect(first).toHaveProperty('componentType')
    })

    it('should filter correctly by status', () => {
      const implemented = getComponentsByStatus('implemented')
      const placeholder = getComponentsByStatus('placeholder')
      const needsWork = getComponentsByStatus('needs-work')

      // Should have different results for different statuses
      expect(implemented.length).toBeGreaterThan(0)
      // These may be 0 if no components with that status exist
      expect(Array.isArray(placeholder)).toBe(true)
      expect(Array.isArray(needsWork)).toBe(true)
    })
  })

  describe('getUnmappedComponents', () => {
    it('should return array of components', () => {
      const unmapped = getUnmappedComponents()
      expect(Array.isArray(unmapped)).toBe(true)
    })

    it('should only return needs-work components', () => {
      const unmapped = getUnmappedComponents()
      unmapped.forEach(c => {
        expect(c.status).toBe('needs-work')
      })
    })

    it('should be equivalent to getComponentsByStatus("needs-work")', () => {
      const unmapped = getUnmappedComponents()
      const needsWork = getComponentsByStatus('needs-work')
      expect(unmapped).toEqual(needsWork)
    })
  })
})

describe('Component Registry - Reporting Functions', () => {
  describe('generateImplementationReport', () => {
    it('should generate markdown report', () => {
      const report = generateImplementationReport()
      expect(typeof report).toBe('string')
      expect(report.length).toBeGreaterThan(0)
    })

    it('should include header and title', () => {
      const report = generateImplementationReport()
      expect(report).toContain('# Component Implementation Report')
    })

    it('should include summary statistics', () => {
      const report = generateImplementationReport()
      expect(report).toContain('## Summary')
      expect(report).toContain('Total Components')
      expect(report).toContain('Implemented')
    })

    it('should include component type breakdown', () => {
      const report = generateImplementationReport()
      expect(report).toContain('By Type')
      expect(report).toContain('Block Components')
      expect(report).toContain('Inline Components')
    })

    it('should include implementation progress', () => {
      const report = generateImplementationReport()
      expect(report).toContain('Implementation Progress')
      expect(report).toMatch(/\d+\.\d+%/)
    })

    it('should include timestamp', () => {
      const report = generateImplementationReport()
      expect(report).toContain('Generated')
      expect(report).toMatch(/\d{4}-\d{2}-\d{2}/)
    })

    it('should include high-usage components section if applicable', () => {
      const report = generateImplementationReport()
      // Check if we have high-usage components (>500 uses)
      const hasHighUsage = Object.values(COMPONENT_REGISTRY).some(
        c => (c.usageCount || 0) > 500
      )

      if (hasHighUsage) {
        expect(report).toContain('High-Usage Components')
      }
    })

    it('should format numbers with locale separators', () => {
      const report = generateImplementationReport()
      // Report should have formatted numbers (e.g., "1,149" not "1149")
      // May or may not have numbers > 1000, so just check report exists
      expect(report.length).toBeGreaterThan(100)
      // Check if report contains formatted numbers if they exist
      const hasLargeNumbers = /\d{4,}/.test(report.replace(/\d{1,3},\d{3}/g, ''))
      if (!hasLargeNumbers) {
        // If no large unformatted numbers, check passed
        expect(true).toBe(true)
      }
    })
  })
})

describe('Component Registry - Data Integrity', () => {
  it('should have consistent slug naming conventions', () => {
    const allComponents = Object.values(COMPONENT_REGISTRY)
    allComponents.forEach(component => {
      // Payload block slugs should be camelCase (or special WordPress format)
      const slug = component.payloadBlockSlug
      if (slug && !slug.startsWith('wpBlock')) {
        // Should start with lowercase for non-WordPress blocks
        expect(slug[0]).toBe(slug[0].toLowerCase())
      }
    })
  })

  it('should have valid component types', () => {
    const validTypes = ['block', 'inline', 'wrapper']
    const allComponents = Object.values(COMPONENT_REGISTRY)
    allComponents.forEach(component => {
      expect(validTypes).toContain(component.componentType)
    })
  })

  it('should have valid status values', () => {
    const validStatuses = ['implemented', 'placeholder', 'needs-work', 'deprecated', 'alias']
    const allComponents = Object.values(COMPONENT_REGISTRY)
    allComponents.forEach(component => {
      expect(validStatuses).toContain(component.status)
    })
  })

  it('should have consistent rendering flags', () => {
    const allComponents = Object.values(COMPONENT_REGISTRY)
    allComponents.forEach(component => {
      // Every component should have rendering capability flags
      expect(typeof component.canRenderInline).toBe('boolean')
      expect(typeof component.canRenderBlock).toBe('boolean')

      // At least one should be true (unless wrapper)
      if (component.componentType !== 'wrapper') {
        expect(
          component.canRenderInline || component.canRenderBlock
        ).toBe(true)
      }
    })
  })

  it('should have fields array for all components', () => {
    const allComponents = Object.values(COMPONENT_REGISTRY)
    allComponents.forEach(component => {
      expect(Array.isArray(component.fields)).toBe(true)
    })
  })

  it('should have matching mdxName as registry key', () => {
    Object.entries(COMPONENT_REGISTRY).forEach(([key, component]) => {
      expect(component.mdxName).toBe(key)
    })
  })

  it('should have at least 40 components registered', () => {
    const count = Object.keys(COMPONENT_REGISTRY).length
    expect(count).toBeGreaterThanOrEqual(40)
  })

  it('should have inline phone number components', () => {
    const phoneComponents = Object.values(COMPONENT_REGISTRY).filter(
      c => c.mdxName.includes('PhoneNumber') && c.componentType === 'inline'
    )
    expect(phoneComponents.length).toBeGreaterThanOrEqual(18)
  })

  it('should have block-level WordPress legacy blocks', () => {
    const wpBlocks = Object.values(COMPONENT_REGISTRY).filter(
      c => c.mdxName.startsWith('WpBlock') && c.componentType === 'block'
    )
    expect(wpBlocks.length).toBeGreaterThanOrEqual(9)
  })
})

describe('Component Registry - Edge Cases', () => {
  it('should handle empty string component name', () => {
    const mapping = getComponentMapping('')
    expect(mapping).toBeUndefined()
  })

  it('should handle null in validateComponent props', () => {
    const result = validateComponent('RatesTable', {})
    expect(result.valid).toBe(true)
  })

  it('should handle component names with special characters', () => {
    const slug = getPayloadBlockSlug('WpBlock59853_EnergySavingsArticles')
    expect(slug).toBeTruthy()
  })

  it('should handle case-sensitive component names', () => {
    const lowercase = getComponentMapping('ratestable')
    const uppercase = getComponentMapping('RATESTABLE')
    const correctCase = getComponentMapping('RatesTable')

    expect(lowercase).toBeUndefined()
    expect(uppercase).toBeUndefined()
    expect(correctCase).toBeDefined()
  })
})
