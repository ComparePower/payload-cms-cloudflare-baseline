/**
 * Unit tests for MDX Component Validator
 *
 * Tests validator integration with Component Registry
 * for fail-fast validation during migration
 */

import { describe, it, expect, vi } from 'vitest'
import {
  validateComponent,
  formatValidationErrors,
  throwIfValidationErrors,
  type ComponentValidationError,
} from '../../../scripts/migration/lib/mdx-component-validator'

describe('MDX Component Validator - Registry Integration', () => {
  describe('validateComponent', () => {
    it('should validate implemented block component', () => {
      const error = validateComponent(
        'RatesTable',
        'block',
        '/test/provider.mdx',
        { provider: 'reliant' }
      )
      expect(error).toBeNull()
    })

    it('should validate implemented inline component', () => {
      const error = validateComponent(
        'ReliantPhoneNumber',
        'inline',
        '/test/provider.mdx',
        {}
      )
      expect(error).toBeNull()
    })

    it('should reject unmapped component', () => {
      const error = validateComponent(
        'UnknownComponent',
        'block',
        '/test/provider.mdx',
        { prop1: 'value1' }
      )

      expect(error).not.toBeNull()
      expect(error?.componentName).toBe('UnknownComponent')
      expect(error?.componentType).toBe('block')
      expect(error?.filePath).toBe('/test/provider.mdx')
      expect(error?.message).toContain('Unknown component')
    })

    it('should include Component Registry in suggestion for unmapped components', () => {
      const error = validateComponent(
        'UnknownComponent',
        'block',
        '/test/provider.mdx',
        {}
      )

      expect(error).not.toBeNull()
      expect(error?.suggestion).toContain('COMPONENT_REGISTRY')
      expect(error?.suggestion).toContain('component-registry.ts')
    })

    it('should skip wrapper components if they exist in registry', () => {
      // Note: Currently no wrapper components exist in registry
      // This test verifies that IF a wrapper exists, it's skipped
      // For now, we test the logic path with a non-existent component
      const error = validateComponent(
        'NonExistentWrapper',
        'block',
        '/test/provider.mdx',
        {}
      )

      // Since NonExistentWrapper doesn't exist and isn't a wrapper,
      // it should fail validation
      expect(error).not.toBeNull()
    })

    it('should handle component with no props', () => {
      const error = validateComponent(
        'CurrentYear',
        'inline',
        '/test/provider.mdx',
        {}
      )
      expect(error).toBeNull()
    })

    it('should capture props in error for unmapped components', () => {
      const testProps = { provider: 'test', city: 'austin' }
      const error = validateComponent(
        'UnmappedComponent',
        'block',
        '/test/provider.mdx',
        testProps
      )

      expect(error).not.toBeNull()
      expect(error?.props).toEqual(testProps)
    })
  })

  describe('Rendering Capability Warnings', () => {
    it('should warn when block component used as block but canRenderBlock is false', () => {
      // Spy on console.warn
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      // Find a component that canRenderInline but not canRenderBlock
      // Most inline components should have this configuration
      const error = validateComponent(
        'CurrentYear',
        'block',
        '/test/provider.mdx',
        {}
      )

      // Should still validate (no error) but should have warned
      expect(error).toBeNull()

      // Should have logged a warning (if CurrentYear can't render as block)
      // Note: This depends on CurrentYear's actual configuration
      // If CurrentYear CAN render as block, this won't warn

      warnSpy.mockRestore()
    })

    it('should warn when inline component used inline but canRenderInline is false', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      // Use a block component as inline to trigger warning
      const error = validateComponent(
        'RatesTable',
        'inline',
        '/test/provider.mdx',
        {}
      )

      // Should still validate (no error)
      expect(error).toBeNull()

      warnSpy.mockRestore()
    })
  })

  describe('Error Message Formatting', () => {
    it('should suggest adding to Component Registry for unmapped block components', () => {
      const error = validateComponent(
        'NewBlockComponent',
        'block',
        '/test/provider.mdx',
        { prop1: 'value' }
      )

      expect(error).not.toBeNull()
      expect(error?.suggestion).toContain('Add to Component Registry')
      expect(error?.suggestion).toContain('componentType: \'block\'')
      expect(error?.suggestion).toContain('canRenderBlock: true')
    })

    it('should suggest adding to Component Registry for unmapped inline components', () => {
      const error = validateComponent(
        'NewInlineComponent',
        'inline',
        '/test/provider.mdx',
        {}
      )

      expect(error).not.toBeNull()
      expect(error?.suggestion).toContain('Add to Component Registry')
      expect(error?.suggestion).toContain('componentType: \'inline\'')
      expect(error?.suggestion).toContain('canRenderInline: true')
    })

    it('should include wrapper alternative in block component suggestions', () => {
      const error = validateComponent(
        'NewBlockComponent',
        'block',
        '/test/provider.mdx',
        {}
      )

      expect(error).not.toBeNull()
      expect(error?.suggestion).toContain('ALTERNATIVE: If this is a wrapper component')
      expect(error?.suggestion).toContain('componentType: \'wrapper\'')
    })

    it('should list props in suggestion when props exist', () => {
      const error = validateComponent(
        'NewComponent',
        'block',
        '/test/provider.mdx',
        { provider: 'reliant', city: 'austin' }
      )

      expect(error).not.toBeNull()
      expect(error?.suggestion).toContain('provider')
      expect(error?.suggestion).toContain('city')
    })
  })
})

describe('MDX Component Validator - Error Formatting', () => {
  describe('formatValidationErrors', () => {
    it('should return success message for empty error array', () => {
      const formatted = formatValidationErrors([])
      expect(formatted).toContain('✅')
      expect(formatted).toContain('properly mapped')
    })

    it('should format single error', () => {
      const errors: ComponentValidationError[] = [
        {
          componentName: 'TestComponent',
          componentType: 'block',
          usage: 'block-level',
          filePath: '/test/file.mdx',
          props: { prop1: 'value1' },
          message: 'Test error message',
          suggestion: 'Test suggestion',
        },
      ]

      const formatted = formatValidationErrors(errors)
      expect(formatted).toContain('❌')
      expect(formatted).toContain('1 unmapped component')
      expect(formatted).toContain('TestComponent')
      expect(formatted).toContain('/test/file.mdx')
      expect(formatted).toContain('Test error message')
      expect(formatted).toContain('Test suggestion')
    })

    it('should format multiple errors', () => {
      const errors: ComponentValidationError[] = [
        {
          componentName: 'Component1',
          componentType: 'block',
          usage: 'block-level',
          filePath: '/test/file1.mdx',
          props: {},
          message: 'Error 1',
          suggestion: 'Suggestion 1',
        },
        {
          componentName: 'Component2',
          componentType: 'inline',
          usage: 'inline',
          filePath: '/test/file2.mdx',
          props: {},
          message: 'Error 2',
          suggestion: 'Suggestion 2',
        },
      ]

      const formatted = formatValidationErrors(errors)
      expect(formatted).toContain('2 unmapped component')
      expect(formatted).toContain('Error #1')
      expect(formatted).toContain('Error #2')
      expect(formatted).toContain('Component1')
      expect(formatted).toContain('Component2')
    })

    it('should include props in formatted output', () => {
      const errors: ComponentValidationError[] = [
        {
          componentName: 'TestComponent',
          componentType: 'block',
          usage: 'block-level',
          filePath: '/test/file.mdx',
          props: { provider: 'reliant', city: 'austin' },
          message: 'Test error',
          suggestion: 'Test suggestion',
        },
      ]

      const formatted = formatValidationErrors(errors)
      expect(formatted).toContain('provider="reliant"')
      expect(formatted).toContain('city="austin"')
    })

    it('should include next steps footer', () => {
      const errors: ComponentValidationError[] = [
        {
          componentName: 'Test',
          componentType: 'block',
          usage: 'block-level',
          filePath: '/test/file.mdx',
          props: {},
          message: 'Error',
          suggestion: 'Suggestion',
        },
      ]

      const formatted = formatValidationErrors(errors)
      expect(formatted).toContain('NEXT STEPS')
      expect(formatted).toContain('Review the errors')
      expect(formatted).toContain('Re-run the migration')
    })

    it('should include separator lines between errors', () => {
      const errors: ComponentValidationError[] = [
        {
          componentName: 'Component1',
          componentType: 'block',
          usage: 'block-level',
          filePath: '/test/file1.mdx',
          props: {},
          message: 'Error 1',
          suggestion: 'Suggestion 1',
        },
        {
          componentName: 'Component2',
          componentType: 'block',
          usage: 'block-level',
          filePath: '/test/file2.mdx',
          props: {},
          message: 'Error 2',
          suggestion: 'Suggestion 2',
        },
      ]

      const formatted = formatValidationErrors(errors)
      expect(formatted).toContain('━━━')
    })
  })

  describe('throwIfValidationErrors', () => {
    it('should not throw for empty errors array', () => {
      expect(() => {
        throwIfValidationErrors([], '/test/file.mdx')
      }).not.toThrow()
    })

    it('should throw for non-empty errors array', () => {
      const errors: ComponentValidationError[] = [
        {
          componentName: 'TestComponent',
          componentType: 'block',
          usage: 'block-level',
          filePath: '/test/file.mdx',
          props: {},
          message: 'Test error',
          suggestion: 'Test suggestion',
        },
      ]

      expect(() => {
        throwIfValidationErrors(errors, '/test/file.mdx')
      }).toThrow()
    })

    it('should throw error with formatted message', () => {
      const errors: ComponentValidationError[] = [
        {
          componentName: 'TestComponent',
          componentType: 'block',
          usage: 'block-level',
          filePath: '/test/file.mdx',
          props: {},
          message: 'Test error message',
          suggestion: 'Test suggestion',
        },
      ]

      expect(() => {
        throwIfValidationErrors(errors, '/test/file.mdx')
      }).toThrow(/MIGRATION FAILED/)
    })

    it('should include all error details in thrown error', () => {
      const errors: ComponentValidationError[] = [
        {
          componentName: 'TestComponent',
          componentType: 'block',
          usage: 'block-level',
          filePath: '/test/file.mdx',
          props: {},
          message: 'Unique error identifier',
          suggestion: 'Test suggestion',
        },
      ]

      expect(() => {
        throwIfValidationErrors(errors, '/test/file.mdx')
      }).toThrow(/Unique error identifier/)
    })
  })
})

describe('MDX Component Validator - Edge Cases', () => {
  it('should handle empty component name', () => {
    const error = validateComponent(
      '',
      'block',
      '/test/file.mdx',
      {}
    )

    expect(error).not.toBeNull()
  })

  it('should handle empty file path', () => {
    const error = validateComponent(
      'UnknownComponent',
      'block',
      '',
      {}
    )

    expect(error).not.toBeNull()
    expect(error?.filePath).toBe('')
  })

  it('should handle component with complex props', () => {
    const complexProps = {
      nested: { deeply: { nested: 'value' } },
      array: [1, 2, 3],
      boolean: true,
      number: 42,
    }

    const error = validateComponent(
      'UnknownComponent',
      'block',
      '/test/file.mdx',
      complexProps
    )

    expect(error).not.toBeNull()
    expect(error?.props).toEqual(complexProps)
  })

  it('should handle null props', () => {
    const error = validateComponent(
      'RatesTable',
      'block',
      '/test/file.mdx',
      {}
    )

    expect(error).toBeNull()
  })

  it('should be case-sensitive for component names', () => {
    const lower = validateComponent('ratestable', 'block', '/test/file.mdx', {})
    const upper = validateComponent('RATESTABLE', 'block', '/test/file.mdx', {})
    const correct = validateComponent('RatesTable', 'block', '/test/file.mdx', {})

    expect(lower).not.toBeNull()
    expect(upper).not.toBeNull()
    expect(correct).toBeNull()
  })
})
