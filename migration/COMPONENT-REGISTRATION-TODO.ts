/**
 * COMPONENT REGISTRATION TODO
 *
 * This file contains all unregistered MDX components that need to be added
 * to the Component Registry before migration can proceed.
 *
 * Generated: 2025-10-27T16:32:26.744Z
 *
 * INSTRUCTIONS:
 * ------------
 * For each component below, decide:
 *
 * 1. Component Type:
 *    - 'block': Standalone block-level component (like RatesTable)
 *    - 'inline': Inline component within text (like ReliantPhoneNumber)
 *    - 'wrapper': Container removed during parsing (like Section, Figure)
 *
 * 2. Rendering Capabilities:
 *    - canRenderBlock: Can this component render as a standalone block?
 *    - canRenderInline: Can this component render inline within text?
 *
 * 3. Implementation Status:
 *    - 'implemented': Fully working Payload block/inline block exists
 *    - 'needs-work': Registered but implementation incomplete
 *    - 'placeholder': Registered but no implementation yet
 *
 * 4. Fields:
 *    - List all props this component accepts
 *    - Map to Payload field types (text, number, relationship, etc.)
 *
 * AFTER UPDATING:
 * --------------
 * Copy the completed entries to scripts/migration/lib/component-registry.ts
 * in the COMPONENT_REGISTRY object.
 *
 * Total unregistered: 54
 * Total usages affected: 17822
 */

import { type ComponentMapping } from '../../scripts/migration/lib/component-registry'

// ============================================================================
// UNREGISTERED COMPONENTS - NEED DECISIONS
// ============================================================================

export const UNREGISTERED_COMPONENTS: Record<string, ComponentMapping> = {

  // ──────────────────────────────────────────────────────────────────────────
  // Section
  // ──────────────────────────────────────────────────────────────────────────
  // Usage: 6601 times in 867 files
  // Props: title, headingLevel, id
  //
  // TODO: Decide component type and implementation strategy
  // [ ] Review actual usage in MDX files
  // [ ] Determine if this should be block/inline/wrapper
  // [ ] Create Payload block definition if needed
  // [ ] Map all props to Payload fields
  // [ ] Test rendering in admin UI
  //
  'Section': {
    status: 'needs-work', // TODO: Change to 'implemented' after creating block
    componentType: 'wrapper', // TODO: Verify - 'block' | 'inline' | 'wrapper'
    canRenderBlock: false, // TODO: Can this render as standalone block?
    canRenderInline: false, // TODO: Can this render inline in text?

    payloadBlockType: undefined, // TODO: Add block type if implementing
    // payloadBlockType: 'SectionBlock', // Example

    mdxUsageCount: 6601,

    fields: {
      // TODO: Map prop 'title' to Payload field type
      // 'title': { type: '???' },
      // TODO: Map prop 'headingLevel' to Payload field type
      // 'headingLevel': { type: '???' },
      // TODO: Map prop 'id' to Payload field type
      // 'id': { type: '???' },
    },

    todos: [
      // TODO: Add implementation tasks here, for example:
      // 'Create src/lexical/blocks/SectionBlock.ts',
      // 'Export from src/lexical/blocks/index.ts',
      // 'Add to payload.config.ts lexical editor config',
      // 'Test in admin UI',
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // Image
  // ──────────────────────────────────────────────────────────────────────────
  // Usage: 5292 times in 863 files
  // Props: src, alt
  //
  // TODO: Decide component type and implementation strategy
  // [ ] Review actual usage in MDX files
  // [ ] Determine if this should be block/inline/wrapper
  // [ ] Create Payload block definition if needed
  // [ ] Map all props to Payload fields
  // [ ] Test rendering in admin UI
  //
  'Image': {
    status: 'needs-work', // TODO: Change to 'implemented' after creating block
    componentType: 'inline', // TODO: Verify - 'block' | 'inline' | 'wrapper'
    canRenderBlock: false, // TODO: Can this render as standalone block?
    canRenderInline: true, // TODO: Can this render inline in text?

    payloadBlockType: undefined, // TODO: Add block type if implementing
    // payloadBlockType: 'ImageBlock', // Example

    mdxUsageCount: 5292,

    fields: {
      // TODO: Map prop 'src' to Payload field type
      // 'src': { type: '???' },
      // TODO: Map prop 'alt' to Payload field type
      // 'alt': { type: '???' },
    },

    todos: [
      // TODO: Add implementation tasks here, for example:
      // 'Create src/lexical/blocks/ImageBlock.ts',
      // 'Export from src/lexical/blocks/index.ts',
      // 'Add to payload.config.ts lexical editor config',
      // 'Test in admin UI',
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // EiaMonth
  // ──────────────────────────────────────────────────────────────────────────
  // Usage: 1774 times in 886 files
  // Props: name
  //
  // TODO: Decide component type and implementation strategy
  // [ ] Review actual usage in MDX files
  // [ ] Determine if this should be block/inline/wrapper
  // [ ] Create Payload block definition if needed
  // [ ] Map all props to Payload fields
  // [ ] Test rendering in admin UI
  //
  'EiaMonth': {
    status: 'needs-work', // TODO: Change to 'implemented' after creating block
    componentType: 'block', // TODO: Verify - 'block' | 'inline' | 'wrapper'
    canRenderBlock: true, // TODO: Can this render as standalone block?
    canRenderInline: false, // TODO: Can this render inline in text?

    payloadBlockType: undefined, // TODO: Add block type if implementing
    // payloadBlockType: 'EiaMonthBlock', // Example

    mdxUsageCount: 1774,

    fields: {
      // TODO: Map prop 'name' to Payload field type
      // 'name': { type: '???' },
    },

    todos: [
      // TODO: Add implementation tasks here, for example:
      // 'Create src/lexical/blocks/EiaMonthBlock.ts',
      // 'Export from src/lexical/blocks/index.ts',
      // 'Add to payload.config.ts lexical editor config',
      // 'Test in admin UI',
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // EiaRatesChart
  // ──────────────────────────────────────────────────────────────────────────
  // Usage: 1770 times in 885 files
  // Props: name
  //
  // TODO: Decide component type and implementation strategy
  // [ ] Review actual usage in MDX files
  // [ ] Determine if this should be block/inline/wrapper
  // [ ] Create Payload block definition if needed
  // [ ] Map all props to Payload fields
  // [ ] Test rendering in admin UI
  //
  'EiaRatesChart': {
    status: 'needs-work', // TODO: Change to 'implemented' after creating block
    componentType: 'block', // TODO: Verify - 'block' | 'inline' | 'wrapper'
    canRenderBlock: true, // TODO: Can this render as standalone block?
    canRenderInline: false, // TODO: Can this render inline in text?

    payloadBlockType: undefined, // TODO: Add block type if implementing
    // payloadBlockType: 'EiaRatesChartBlock', // Example

    mdxUsageCount: 1770,

    fields: {
      // TODO: Map prop 'name' to Payload field type
      // 'name': { type: '???' },
    },

    todos: [
      // TODO: Add implementation tasks here, for example:
      // 'Create src/lexical/blocks/EiaRatesChartBlock.ts',
      // 'Export from src/lexical/blocks/index.ts',
      // 'Add to payload.config.ts lexical editor config',
      // 'Test in admin UI',
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // WpBlock60290_AvgTexasResidentialRate
  // ──────────────────────────────────────────────────────────────────────────
  // Usage: 1764 times in 882 files
  // Props: none
  //
  // TODO: Decide component type and implementation strategy
  // [ ] Review actual usage in MDX files
  // [ ] Determine if this should be block/inline/wrapper
  // [ ] Create Payload block definition if needed
  // [ ] Map all props to Payload fields
  // [ ] Test rendering in admin UI
  //
  'WpBlock60290_AvgTexasResidentialRate': {
    status: 'needs-work', // TODO: Change to 'implemented' after creating block
    componentType: 'block', // TODO: Verify - 'block' | 'inline' | 'wrapper'
    canRenderBlock: true, // TODO: Can this render as standalone block?
    canRenderInline: false, // TODO: Can this render inline in text?

    payloadBlockType: undefined, // TODO: Add block type if implementing
    // payloadBlockType: 'WpBlock60290_AvgTexasResidentialRateBlock', // Example

    mdxUsageCount: 1764,

    fields: {
      // No props detected - verify in actual MDX files
    },

    todos: [
      // TODO: Add implementation tasks here, for example:
      // 'Create src/lexical/blocks/WpBlock60290_AvgTexasResidentialRateBlock.ts',
      // 'Export from src/lexical/blocks/index.ts',
      // 'Add to payload.config.ts lexical editor config',
      // 'Test in admin UI',
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // WpBlock60291_AvgTexasCommercialRate
  // ──────────────────────────────────────────────────────────────────────────
  // Usage: 234 times in 117 files
  // Props: none
  //
  // TODO: Decide component type and implementation strategy
  // [ ] Review actual usage in MDX files
  // [ ] Determine if this should be block/inline/wrapper
  // [ ] Create Payload block definition if needed
  // [ ] Map all props to Payload fields
  // [ ] Test rendering in admin UI
  //
  'WpBlock60291_AvgTexasCommercialRate': {
    status: 'needs-work', // TODO: Change to 'implemented' after creating block
    componentType: 'block', // TODO: Verify - 'block' | 'inline' | 'wrapper'
    canRenderBlock: true, // TODO: Can this render as standalone block?
    canRenderInline: false, // TODO: Can this render inline in text?

    payloadBlockType: undefined, // TODO: Add block type if implementing
    // payloadBlockType: 'WpBlock60291_AvgTexasCommercialRateBlock', // Example

    mdxUsageCount: 234,

    fields: {
      // No props detected - verify in actual MDX files
    },

    todos: [
      // TODO: Add implementation tasks here, for example:
      // 'Create src/lexical/blocks/WpBlock60291_AvgTexasCommercialRateBlock.ts',
      // 'Export from src/lexical/blocks/index.ts',
      // 'Add to payload.config.ts lexical editor config',
      // 'Test in admin UI',
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // WpBlock58831_MostImportant
  // ──────────────────────────────────────────────────────────────────────────
  // Usage: 98 times in 49 files
  // Props: none
  //
  // TODO: Decide component type and implementation strategy
  // [ ] Review actual usage in MDX files
  // [ ] Determine if this should be block/inline/wrapper
  // [ ] Create Payload block definition if needed
  // [ ] Map all props to Payload fields
  // [ ] Test rendering in admin UI
  //
  'WpBlock58831_MostImportant': {
    status: 'needs-work', // TODO: Change to 'implemented' after creating block
    componentType: 'block', // TODO: Verify - 'block' | 'inline' | 'wrapper'
    canRenderBlock: true, // TODO: Can this render as standalone block?
    canRenderInline: false, // TODO: Can this render inline in text?

    payloadBlockType: undefined, // TODO: Add block type if implementing
    // payloadBlockType: 'WpBlock58831_MostImportantBlock', // Example

    mdxUsageCount: 98,

    fields: {
      // No props detected - verify in actual MDX files
    },

    todos: [
      // TODO: Add implementation tasks here, for example:
      // 'Create src/lexical/blocks/WpBlock58831_MostImportantBlock.ts',
      // 'Export from src/lexical/blocks/index.ts',
      // 'Add to payload.config.ts lexical editor config',
      // 'Test in admin UI',
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // ShopperApprovedReviewsFeed
  // ──────────────────────────────────────────────────────────────────────────
  // Usage: 42 times in 21 files
  // Props: name
  //
  // TODO: Decide component type and implementation strategy
  // [ ] Review actual usage in MDX files
  // [ ] Determine if this should be block/inline/wrapper
  // [ ] Create Payload block definition if needed
  // [ ] Map all props to Payload fields
  // [ ] Test rendering in admin UI
  //
  'ShopperApprovedReviewsFeed': {
    status: 'needs-work', // TODO: Change to 'implemented' after creating block
    componentType: 'block', // TODO: Verify - 'block' | 'inline' | 'wrapper'
    canRenderBlock: true, // TODO: Can this render as standalone block?
    canRenderInline: false, // TODO: Can this render inline in text?

    payloadBlockType: undefined, // TODO: Add block type if implementing
    // payloadBlockType: 'ShopperApprovedReviewsFeedBlock', // Example

    mdxUsageCount: 42,

    fields: {
      // TODO: Map prop 'name' to Payload field type
      // 'name': { type: '???' },
    },

    todos: [
      // TODO: Add implementation tasks here, for example:
      // 'Create src/lexical/blocks/ShopperApprovedReviewsFeedBlock.ts',
      // 'Export from src/lexical/blocks/index.ts',
      // 'Add to payload.config.ts lexical editor config',
      // 'Test in admin UI',
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // UsageBasedPricingVideo
  // ──────────────────────────────────────────────────────────────────────────
  // Usage: 34 times in 17 files
  // Props: name
  //
  // TODO: Decide component type and implementation strategy
  // [ ] Review actual usage in MDX files
  // [ ] Determine if this should be block/inline/wrapper
  // [ ] Create Payload block definition if needed
  // [ ] Map all props to Payload fields
  // [ ] Test rendering in admin UI
  //
  'UsageBasedPricingVideo': {
    status: 'needs-work', // TODO: Change to 'implemented' after creating block
    componentType: 'block', // TODO: Verify - 'block' | 'inline' | 'wrapper'
    canRenderBlock: true, // TODO: Can this render as standalone block?
    canRenderInline: false, // TODO: Can this render inline in text?

    payloadBlockType: undefined, // TODO: Add block type if implementing
    // payloadBlockType: 'UsageBasedPricingVideoBlock', // Example

    mdxUsageCount: 34,

    fields: {
      // TODO: Map prop 'name' to Payload field type
      // 'name': { type: '???' },
    },

    todos: [
      // TODO: Add implementation tasks here, for example:
      // 'Create src/lexical/blocks/UsageBasedPricingVideoBlock.ts',
      // 'Export from src/lexical/blocks/index.ts',
      // 'Add to payload.config.ts lexical editor config',
      // 'Test in admin UI',
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // WpBlock60549_Unknown
  // ──────────────────────────────────────────────────────────────────────────
  // Usage: 18 times in 9 files
  // Props: none
  //
  // TODO: Decide component type and implementation strategy
  // [ ] Review actual usage in MDX files
  // [ ] Determine if this should be block/inline/wrapper
  // [ ] Create Payload block definition if needed
  // [ ] Map all props to Payload fields
  // [ ] Test rendering in admin UI
  //
  'WpBlock60549_Unknown': {
    status: 'needs-work', // TODO: Change to 'implemented' after creating block
    componentType: 'block', // TODO: Verify - 'block' | 'inline' | 'wrapper'
    canRenderBlock: true, // TODO: Can this render as standalone block?
    canRenderInline: false, // TODO: Can this render inline in text?

    payloadBlockType: undefined, // TODO: Add block type if implementing
    // payloadBlockType: 'WpBlock60549_UnknownBlock', // Example

    mdxUsageCount: 18,

    fields: {
      // No props detected - verify in actual MDX files
    },

    todos: [
      // TODO: Add implementation tasks here, for example:
      // 'Create src/lexical/blocks/WpBlock60549_UnknownBlock.ts',
      // 'Export from src/lexical/blocks/index.ts',
      // 'Add to payload.config.ts lexical editor config',
      // 'Test in admin UI',
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // WpBlock66341_CityPageFaqNonRm
  // ──────────────────────────────────────────────────────────────────────────
  // Usage: 14 times in 7 files
  // Props: none
  //
  // TODO: Decide component type and implementation strategy
  // [ ] Review actual usage in MDX files
  // [ ] Determine if this should be block/inline/wrapper
  // [ ] Create Payload block definition if needed
  // [ ] Map all props to Payload fields
  // [ ] Test rendering in admin UI
  //
  'WpBlock66341_CityPageFaqNonRm': {
    status: 'needs-work', // TODO: Change to 'implemented' after creating block
    componentType: 'block', // TODO: Verify - 'block' | 'inline' | 'wrapper'
    canRenderBlock: true, // TODO: Can this render as standalone block?
    canRenderInline: false, // TODO: Can this render inline in text?

    payloadBlockType: undefined, // TODO: Add block type if implementing
    // payloadBlockType: 'WpBlock66341_CityPageFaqNonRmBlock', // Example

    mdxUsageCount: 14,

    fields: {
      // No props detected - verify in actual MDX files
    },

    todos: [
      // TODO: Add implementation tasks here, for example:
      // 'Create src/lexical/blocks/WpBlock66341_CityPageFaqNonRmBlock.ts',
      // 'Export from src/lexical/blocks/index.ts',
      // 'Add to payload.config.ts lexical editor config',
      // 'Test in admin UI',
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // WpBlock80371_Unknown
  // ──────────────────────────────────────────────────────────────────────────
  // Usage: 12 times in 6 files
  // Props: none
  //
  // TODO: Decide component type and implementation strategy
  // [ ] Review actual usage in MDX files
  // [ ] Determine if this should be block/inline/wrapper
  // [ ] Create Payload block definition if needed
  // [ ] Map all props to Payload fields
  // [ ] Test rendering in admin UI
  //
  'WpBlock80371_Unknown': {
    status: 'needs-work', // TODO: Change to 'implemented' after creating block
    componentType: 'block', // TODO: Verify - 'block' | 'inline' | 'wrapper'
    canRenderBlock: true, // TODO: Can this render as standalone block?
    canRenderInline: false, // TODO: Can this render inline in text?

    payloadBlockType: undefined, // TODO: Add block type if implementing
    // payloadBlockType: 'WpBlock80371_UnknownBlock', // Example

    mdxUsageCount: 12,

    fields: {
      // No props detected - verify in actual MDX files
    },

    todos: [
      // TODO: Add implementation tasks here, for example:
      // 'Create src/lexical/blocks/WpBlock80371_UnknownBlock.ts',
      // 'Export from src/lexical/blocks/index.ts',
      // 'Add to payload.config.ts lexical editor config',
      // 'Test in admin UI',
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // Call
  // ──────────────────────────────────────────────────────────────────────────
  // Usage: 12 times in 1 files
  // Props: name
  //
  // TODO: Decide component type and implementation strategy
  // [ ] Review actual usage in MDX files
  // [ ] Determine if this should be block/inline/wrapper
  // [ ] Create Payload block definition if needed
  // [ ] Map all props to Payload fields
  // [ ] Test rendering in admin UI
  //
  'Call': {
    status: 'needs-work', // TODO: Change to 'implemented' after creating block
    componentType: 'inline', // TODO: Verify - 'block' | 'inline' | 'wrapper'
    canRenderBlock: false, // TODO: Can this render as standalone block?
    canRenderInline: true, // TODO: Can this render inline in text?

    payloadBlockType: undefined, // TODO: Add block type if implementing
    // payloadBlockType: 'CallBlock', // Example

    mdxUsageCount: 12,

    fields: {
      // TODO: Map prop 'name' to Payload field type
      // 'name': { type: '???' },
    },

    todos: [
      // TODO: Add implementation tasks here, for example:
      // 'Create src/lexical/blocks/CallBlock.ts',
      // 'Export from src/lexical/blocks/index.ts',
      // 'Add to payload.config.ts lexical editor config',
      // 'Test in admin UI',
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // WpBlock93267_HoustonDirectLink
  // ──────────────────────────────────────────────────────────────────────────
  // Usage: 10 times in 1 files
  // Props: none
  //
  // TODO: Decide component type and implementation strategy
  // [ ] Review actual usage in MDX files
  // [ ] Determine if this should be block/inline/wrapper
  // [ ] Create Payload block definition if needed
  // [ ] Map all props to Payload fields
  // [ ] Test rendering in admin UI
  //
  'WpBlock93267_HoustonDirectLink': {
    status: 'needs-work', // TODO: Change to 'implemented' after creating block
    componentType: 'block', // TODO: Verify - 'block' | 'inline' | 'wrapper'
    canRenderBlock: true, // TODO: Can this render as standalone block?
    canRenderInline: false, // TODO: Can this render inline in text?

    payloadBlockType: undefined, // TODO: Add block type if implementing
    // payloadBlockType: 'WpBlock93267_HoustonDirectLinkBlock', // Example

    mdxUsageCount: 10,

    fields: {
      // No props detected - verify in actual MDX files
    },

    todos: [
      // TODO: Add implementation tasks here, for example:
      // 'Create src/lexical/blocks/WpBlock93267_HoustonDirectLinkBlock.ts',
      // 'Export from src/lexical/blocks/index.ts',
      // 'Add to payload.config.ts lexical editor config',
      // 'Test in admin UI',
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // WpBlock75232_EnergySavingsArticlesCopy
  // ──────────────────────────────────────────────────────────────────────────
  // Usage: 10 times in 5 files
  // Props: none
  //
  // TODO: Decide component type and implementation strategy
  // [ ] Review actual usage in MDX files
  // [ ] Determine if this should be block/inline/wrapper
  // [ ] Create Payload block definition if needed
  // [ ] Map all props to Payload fields
  // [ ] Test rendering in admin UI
  //
  'WpBlock75232_EnergySavingsArticlesCopy': {
    status: 'needs-work', // TODO: Change to 'implemented' after creating block
    componentType: 'block', // TODO: Verify - 'block' | 'inline' | 'wrapper'
    canRenderBlock: true, // TODO: Can this render as standalone block?
    canRenderInline: false, // TODO: Can this render inline in text?

    payloadBlockType: undefined, // TODO: Add block type if implementing
    // payloadBlockType: 'WpBlock75232_EnergySavingsArticlesCopyBlock', // Example

    mdxUsageCount: 10,

    fields: {
      // No props detected - verify in actual MDX files
    },

    todos: [
      // TODO: Add implementation tasks here, for example:
      // 'Create src/lexical/blocks/WpBlock75232_EnergySavingsArticlesCopyBlock.ts',
      // 'Export from src/lexical/blocks/index.ts',
      // 'Add to payload.config.ts lexical editor config',
      // 'Test in admin UI',
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // Sc
  // ──────────────────────────────────────────────────────────────────────────
  // Usage: 10 times in 4 files
  // Props: content, name
  //
  // TODO: Decide component type and implementation strategy
  // [ ] Review actual usage in MDX files
  // [ ] Determine if this should be block/inline/wrapper
  // [ ] Create Payload block definition if needed
  // [ ] Map all props to Payload fields
  // [ ] Test rendering in admin UI
  //
  'Sc': {
    status: 'needs-work', // TODO: Change to 'implemented' after creating block
    componentType: 'block', // TODO: Verify - 'block' | 'inline' | 'wrapper'
    canRenderBlock: true, // TODO: Can this render as standalone block?
    canRenderInline: false, // TODO: Can this render inline in text?

    payloadBlockType: undefined, // TODO: Add block type if implementing
    // payloadBlockType: 'ScBlock', // Example

    mdxUsageCount: 10,

    fields: {
      // TODO: Map prop 'content' to Payload field type
      // 'content': { type: '???' },
      // TODO: Map prop 'name' to Payload field type
      // 'name': { type: '???' },
    },

    todos: [
      // TODO: Add implementation tasks here, for example:
      // 'Create src/lexical/blocks/ScBlock.ts',
      // 'Export from src/lexical/blocks/index.ts',
      // 'Add to payload.config.ts lexical editor config',
      // 'Test in admin UI',
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // DynamicValue
  // ──────────────────────────────────────────────────────────────────────────
  // Usage: 8 times in 1 files
  // Props: value
  //
  // TODO: Decide component type and implementation strategy
  // [ ] Review actual usage in MDX files
  // [ ] Determine if this should be block/inline/wrapper
  // [ ] Create Payload block definition if needed
  // [ ] Map all props to Payload fields
  // [ ] Test rendering in admin UI
  //
  'DynamicValue': {
    status: 'needs-work', // TODO: Change to 'implemented' after creating block
    componentType: 'block', // TODO: Verify - 'block' | 'inline' | 'wrapper'
    canRenderBlock: true, // TODO: Can this render as standalone block?
    canRenderInline: false, // TODO: Can this render inline in text?

    payloadBlockType: undefined, // TODO: Add block type if implementing
    // payloadBlockType: 'DynamicValueBlock', // Example

    mdxUsageCount: 8,

    fields: {
      // TODO: Map prop 'value' to Payload field type
      // 'value': { type: '???' },
    },

    todos: [
      // TODO: Add implementation tasks here, for example:
      // 'Create src/lexical/blocks/DynamicValueBlock.ts',
      // 'Export from src/lexical/blocks/index.ts',
      // 'Add to payload.config.ts lexical editor config',
      // 'Test in admin UI',
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // AvgCommercialRateTexas
  // ──────────────────────────────────────────────────────────────────────────
  // Usage: 8 times in 3 files
  // Props: name
  //
  // TODO: Decide component type and implementation strategy
  // [ ] Review actual usage in MDX files
  // [ ] Determine if this should be block/inline/wrapper
  // [ ] Create Payload block definition if needed
  // [ ] Map all props to Payload fields
  // [ ] Test rendering in admin UI
  //
  'AvgCommercialRateTexas': {
    status: 'needs-work', // TODO: Change to 'implemented' after creating block
    componentType: 'block', // TODO: Verify - 'block' | 'inline' | 'wrapper'
    canRenderBlock: true, // TODO: Can this render as standalone block?
    canRenderInline: false, // TODO: Can this render inline in text?

    payloadBlockType: undefined, // TODO: Add block type if implementing
    // payloadBlockType: 'AvgCommercialRateTexasBlock', // Example

    mdxUsageCount: 8,

    fields: {
      // TODO: Map prop 'name' to Payload field type
      // 'name': { type: '???' },
    },

    todos: [
      // TODO: Add implementation tasks here, for example:
      // 'Create src/lexical/blocks/AvgCommercialRateTexasBlock.ts',
      // 'Export from src/lexical/blocks/index.ts',
      // 'Add to payload.config.ts lexical editor config',
      // 'Test in admin UI',
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // PercentOffUsAvgCom
  // ──────────────────────────────────────────────────────────────────────────
  // Usage: 8 times in 3 files
  // Props: name
  //
  // TODO: Decide component type and implementation strategy
  // [ ] Review actual usage in MDX files
  // [ ] Determine if this should be block/inline/wrapper
  // [ ] Create Payload block definition if needed
  // [ ] Map all props to Payload fields
  // [ ] Test rendering in admin UI
  //
  'PercentOffUsAvgCom': {
    status: 'needs-work', // TODO: Change to 'implemented' after creating block
    componentType: 'block', // TODO: Verify - 'block' | 'inline' | 'wrapper'
    canRenderBlock: true, // TODO: Can this render as standalone block?
    canRenderInline: false, // TODO: Can this render inline in text?

    payloadBlockType: undefined, // TODO: Add block type if implementing
    // payloadBlockType: 'PercentOffUsAvgComBlock', // Example

    mdxUsageCount: 8,

    fields: {
      // TODO: Map prop 'name' to Payload field type
      // 'name': { type: '???' },
    },

    todos: [
      // TODO: Add implementation tasks here, for example:
      // 'Create src/lexical/blocks/PercentOffUsAvgComBlock.ts',
      // 'Export from src/lexical/blocks/index.ts',
      // 'Add to payload.config.ts lexical editor config',
      // 'Test in admin UI',
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // WpBlock91786_WhyTexansTrustCp
  // ──────────────────────────────────────────────────────────────────────────
  // Usage: 8 times in 4 files
  // Props: none
  //
  // TODO: Decide component type and implementation strategy
  // [ ] Review actual usage in MDX files
  // [ ] Determine if this should be block/inline/wrapper
  // [ ] Create Payload block definition if needed
  // [ ] Map all props to Payload fields
  // [ ] Test rendering in admin UI
  //
  'WpBlock91786_WhyTexansTrustCp': {
    status: 'needs-work', // TODO: Change to 'implemented' after creating block
    componentType: 'block', // TODO: Verify - 'block' | 'inline' | 'wrapper'
    canRenderBlock: true, // TODO: Can this render as standalone block?
    canRenderInline: false, // TODO: Can this render inline in text?

    payloadBlockType: undefined, // TODO: Add block type if implementing
    // payloadBlockType: 'WpBlock91786_WhyTexansTrustCpBlock', // Example

    mdxUsageCount: 8,

    fields: {
      // No props detected - verify in actual MDX files
    },

    todos: [
      // TODO: Add implementation tasks here, for example:
      // 'Create src/lexical/blocks/WpBlock91786_WhyTexansTrustCpBlock.ts',
      // 'Export from src/lexical/blocks/index.ts',
      // 'Add to payload.config.ts lexical editor config',
      // 'Test in admin UI',
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // Formidable
  // ──────────────────────────────────────────────────────────────────────────
  // Usage: 8 times in 4 files
  // Props: content, id, title, description
  //
  // TODO: Decide component type and implementation strategy
  // [ ] Review actual usage in MDX files
  // [ ] Determine if this should be block/inline/wrapper
  // [ ] Create Payload block definition if needed
  // [ ] Map all props to Payload fields
  // [ ] Test rendering in admin UI
  //
  'Formidable': {
    status: 'needs-work', // TODO: Change to 'implemented' after creating block
    componentType: 'block', // TODO: Verify - 'block' | 'inline' | 'wrapper'
    canRenderBlock: true, // TODO: Can this render as standalone block?
    canRenderInline: false, // TODO: Can this render inline in text?

    payloadBlockType: undefined, // TODO: Add block type if implementing
    // payloadBlockType: 'FormidableBlock', // Example

    mdxUsageCount: 8,

    fields: {
      // TODO: Map prop 'content' to Payload field type
      // 'content': { type: '???' },
      // TODO: Map prop 'id' to Payload field type
      // 'id': { type: '???' },
      // TODO: Map prop 'title' to Payload field type
      // 'title': { type: '???' },
      // TODO: Map prop 'description' to Payload field type
      // 'description': { type: '???' },
    },

    todos: [
      // TODO: Add implementation tasks here, for example:
      // 'Create src/lexical/blocks/FormidableBlock.ts',
      // 'Export from src/lexical/blocks/index.ts',
      // 'Add to payload.config.ts lexical editor config',
      // 'Test in admin UI',
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // FaqEndpoint
  // ──────────────────────────────────────────────────────────────────────────
  // Usage: 6 times in 3 files
  // Props: ids
  //
  // TODO: Decide component type and implementation strategy
  // [ ] Review actual usage in MDX files
  // [ ] Determine if this should be block/inline/wrapper
  // [ ] Create Payload block definition if needed
  // [ ] Map all props to Payload fields
  // [ ] Test rendering in admin UI
  //
  'FaqEndpoint': {
    status: 'needs-work', // TODO: Change to 'implemented' after creating block
    componentType: 'block', // TODO: Verify - 'block' | 'inline' | 'wrapper'
    canRenderBlock: true, // TODO: Can this render as standalone block?
    canRenderInline: false, // TODO: Can this render inline in text?

    payloadBlockType: undefined, // TODO: Add block type if implementing
    // payloadBlockType: 'FaqEndpointBlock', // Example

    mdxUsageCount: 6,

    fields: {
      // TODO: Map prop 'ids' to Payload field type
      // 'ids': { type: '???' },
    },

    todos: [
      // TODO: Add implementation tasks here, for example:
      // 'Create src/lexical/blocks/FaqEndpointBlock.ts',
      // 'Export from src/lexical/blocks/index.ts',
      // 'Add to payload.config.ts lexical editor config',
      // 'Test in admin UI',
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // ShopperApprovedReviewsFeedHeaderOnly
  // ──────────────────────────────────────────────────────────────────────────
  // Usage: 6 times in 3 files
  // Props: name, reviewsCount
  //
  // TODO: Decide component type and implementation strategy
  // [ ] Review actual usage in MDX files
  // [ ] Determine if this should be block/inline/wrapper
  // [ ] Create Payload block definition if needed
  // [ ] Map all props to Payload fields
  // [ ] Test rendering in admin UI
  //
  'ShopperApprovedReviewsFeedHeaderOnly': {
    status: 'needs-work', // TODO: Change to 'implemented' after creating block
    componentType: 'block', // TODO: Verify - 'block' | 'inline' | 'wrapper'
    canRenderBlock: true, // TODO: Can this render as standalone block?
    canRenderInline: false, // TODO: Can this render inline in text?

    payloadBlockType: undefined, // TODO: Add block type if implementing
    // payloadBlockType: 'ShopperApprovedReviewsFeedHeaderOnlyBlock', // Example

    mdxUsageCount: 6,

    fields: {
      // TODO: Map prop 'name' to Payload field type
      // 'name': { type: '???' },
      // TODO: Map prop 'reviewsCount' to Payload field type
      // 'reviewsCount': { type: '???' },
    },

    todos: [
      // TODO: Add implementation tasks here, for example:
      // 'Create src/lexical/blocks/ShopperApprovedReviewsFeedHeaderOnlyBlock.ts',
      // 'Export from src/lexical/blocks/index.ts',
      // 'Add to payload.config.ts lexical editor config',
      // 'Test in admin UI',
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // WpBlock55552_TestimonialsGenericCpc
  // ──────────────────────────────────────────────────────────────────────────
  // Usage: 6 times in 3 files
  // Props: none
  //
  // TODO: Decide component type and implementation strategy
  // [ ] Review actual usage in MDX files
  // [ ] Determine if this should be block/inline/wrapper
  // [ ] Create Payload block definition if needed
  // [ ] Map all props to Payload fields
  // [ ] Test rendering in admin UI
  //
  'WpBlock55552_TestimonialsGenericCpc': {
    status: 'needs-work', // TODO: Change to 'implemented' after creating block
    componentType: 'block', // TODO: Verify - 'block' | 'inline' | 'wrapper'
    canRenderBlock: true, // TODO: Can this render as standalone block?
    canRenderInline: false, // TODO: Can this render inline in text?

    payloadBlockType: undefined, // TODO: Add block type if implementing
    // payloadBlockType: 'WpBlock55552_TestimonialsGenericCpcBlock', // Example

    mdxUsageCount: 6,

    fields: {
      // No props detected - verify in actual MDX files
    },

    todos: [
      // TODO: Add implementation tasks here, for example:
      // 'Create src/lexical/blocks/WpBlock55552_TestimonialsGenericCpcBlock.ts',
      // 'Export from src/lexical/blocks/index.ts',
      // 'Add to payload.config.ts lexical editor config',
      // 'Test in admin UI',
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // WpBlock81949_CompareRatesCta
  // ──────────────────────────────────────────────────────────────────────────
  // Usage: 6 times in 3 files
  // Props: none
  //
  // TODO: Decide component type and implementation strategy
  // [ ] Review actual usage in MDX files
  // [ ] Determine if this should be block/inline/wrapper
  // [ ] Create Payload block definition if needed
  // [ ] Map all props to Payload fields
  // [ ] Test rendering in admin UI
  //
  'WpBlock81949_CompareRatesCta': {
    status: 'needs-work', // TODO: Change to 'implemented' after creating block
    componentType: 'block', // TODO: Verify - 'block' | 'inline' | 'wrapper'
    canRenderBlock: true, // TODO: Can this render as standalone block?
    canRenderInline: false, // TODO: Can this render inline in text?

    payloadBlockType: undefined, // TODO: Add block type if implementing
    // payloadBlockType: 'WpBlock81949_CompareRatesCtaBlock', // Example

    mdxUsageCount: 6,

    fields: {
      // No props detected - verify in actual MDX files
    },

    todos: [
      // TODO: Add implementation tasks here, for example:
      // 'Create src/lexical/blocks/WpBlock81949_CompareRatesCtaBlock.ts',
      // 'Export from src/lexical/blocks/index.ts',
      // 'Add to payload.config.ts lexical editor config',
      // 'Test in admin UI',
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // ZipCodesTable
  // ──────────────────────────────────────────────────────────────────────────
  // Usage: 4 times in 1 files
  // Props: columns
  //
  // TODO: Decide component type and implementation strategy
  // [ ] Review actual usage in MDX files
  // [ ] Determine if this should be block/inline/wrapper
  // [ ] Create Payload block definition if needed
  // [ ] Map all props to Payload fields
  // [ ] Test rendering in admin UI
  //
  'ZipCodesTable': {
    status: 'needs-work', // TODO: Change to 'implemented' after creating block
    componentType: 'block', // TODO: Verify - 'block' | 'inline' | 'wrapper'
    canRenderBlock: true, // TODO: Can this render as standalone block?
    canRenderInline: false, // TODO: Can this render inline in text?

    payloadBlockType: undefined, // TODO: Add block type if implementing
    // payloadBlockType: 'ZipCodesTableBlock', // Example

    mdxUsageCount: 4,

    fields: {
      // TODO: Map prop 'columns' to Payload field type
      // 'columns': { type: '???' },
    },

    todos: [
      // TODO: Add implementation tasks here, for example:
      // 'Create src/lexical/blocks/ZipCodesTableBlock.ts',
      // 'Export from src/lexical/blocks/index.ts',
      // 'Add to payload.config.ts lexical editor config',
      // 'Test in admin UI',
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // ConnectLiveLinkNow
  // ──────────────────────────────────────────────────────────────────────────
  // Usage: 4 times in 2 files
  // Props: name
  //
  // TODO: Decide component type and implementation strategy
  // [ ] Review actual usage in MDX files
  // [ ] Determine if this should be block/inline/wrapper
  // [ ] Create Payload block definition if needed
  // [ ] Map all props to Payload fields
  // [ ] Test rendering in admin UI
  //
  'ConnectLiveLinkNow': {
    status: 'needs-work', // TODO: Change to 'implemented' after creating block
    componentType: 'block', // TODO: Verify - 'block' | 'inline' | 'wrapper'
    canRenderBlock: true, // TODO: Can this render as standalone block?
    canRenderInline: false, // TODO: Can this render inline in text?

    payloadBlockType: undefined, // TODO: Add block type if implementing
    // payloadBlockType: 'ConnectLiveLinkNowBlock', // Example

    mdxUsageCount: 4,

    fields: {
      // TODO: Map prop 'name' to Payload field type
      // 'name': { type: '???' },
    },

    todos: [
      // TODO: Add implementation tasks here, for example:
      // 'Create src/lexical/blocks/ConnectLiveLinkNowBlock.ts',
      // 'Export from src/lexical/blocks/index.ts',
      // 'Add to payload.config.ts lexical editor config',
      // 'Test in admin UI',
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // DisplayTotalReviewsFormatted
  // ──────────────────────────────────────────────────────────────────────────
  // Usage: 4 times in 2 files
  // Props: none
  //
  // TODO: Decide component type and implementation strategy
  // [ ] Review actual usage in MDX files
  // [ ] Determine if this should be block/inline/wrapper
  // [ ] Create Payload block definition if needed
  // [ ] Map all props to Payload fields
  // [ ] Test rendering in admin UI
  //
  'DisplayTotalReviewsFormatted': {
    status: 'needs-work', // TODO: Change to 'implemented' after creating block
    componentType: 'block', // TODO: Verify - 'block' | 'inline' | 'wrapper'
    canRenderBlock: true, // TODO: Can this render as standalone block?
    canRenderInline: false, // TODO: Can this render inline in text?

    payloadBlockType: undefined, // TODO: Add block type if implementing
    // payloadBlockType: 'DisplayTotalReviewsFormattedBlock', // Example

    mdxUsageCount: 4,

    fields: {
      // No props detected - verify in actual MDX files
    },

    todos: [
      // TODO: Add implementation tasks here, for example:
      // 'Create src/lexical/blocks/DisplayTotalReviewsFormattedBlock.ts',
      // 'Export from src/lexical/blocks/index.ts',
      // 'Add to payload.config.ts lexical editor config',
      // 'Test in admin UI',
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // NationalAvgRateResidential
  // ──────────────────────────────────────────────────────────────────────────
  // Usage: 4 times in 2 files
  // Props: name
  //
  // TODO: Decide component type and implementation strategy
  // [ ] Review actual usage in MDX files
  // [ ] Determine if this should be block/inline/wrapper
  // [ ] Create Payload block definition if needed
  // [ ] Map all props to Payload fields
  // [ ] Test rendering in admin UI
  //
  'NationalAvgRateResidential': {
    status: 'needs-work', // TODO: Change to 'implemented' after creating block
    componentType: 'block', // TODO: Verify - 'block' | 'inline' | 'wrapper'
    canRenderBlock: true, // TODO: Can this render as standalone block?
    canRenderInline: false, // TODO: Can this render inline in text?

    payloadBlockType: undefined, // TODO: Add block type if implementing
    // payloadBlockType: 'NationalAvgRateResidentialBlock', // Example

    mdxUsageCount: 4,

    fields: {
      // TODO: Map prop 'name' to Payload field type
      // 'name': { type: '???' },
    },

    todos: [
      // TODO: Add implementation tasks here, for example:
      // 'Create src/lexical/blocks/NationalAvgRateResidentialBlock.ts',
      // 'Export from src/lexical/blocks/index.ts',
      // 'Add to payload.config.ts lexical editor config',
      // 'Test in admin UI',
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // BroncoPowerPhoneNumber
  // ──────────────────────────────────────────────────────────────────────────
  // Usage: 4 times in 1 files
  // Props: name
  //
  // TODO: Decide component type and implementation strategy
  // [ ] Review actual usage in MDX files
  // [ ] Determine if this should be block/inline/wrapper
  // [ ] Create Payload block definition if needed
  // [ ] Map all props to Payload fields
  // [ ] Test rendering in admin UI
  //
  'BroncoPowerPhoneNumber': {
    status: 'needs-work', // TODO: Change to 'implemented' after creating block
    componentType: 'block', // TODO: Verify - 'block' | 'inline' | 'wrapper'
    canRenderBlock: true, // TODO: Can this render as standalone block?
    canRenderInline: false, // TODO: Can this render inline in text?

    payloadBlockType: undefined, // TODO: Add block type if implementing
    // payloadBlockType: 'BroncoPowerPhoneNumberBlock', // Example

    mdxUsageCount: 4,

    fields: {
      // TODO: Map prop 'name' to Payload field type
      // 'name': { type: '???' },
    },

    todos: [
      // TODO: Add implementation tasks here, for example:
      // 'Create src/lexical/blocks/BroncoPowerPhoneNumberBlock.ts',
      // 'Export from src/lexical/blocks/index.ts',
      // 'Add to payload.config.ts lexical editor config',
      // 'Test in admin UI',
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // TDSPInfo
  // ──────────────────────────────────────────────────────────────────────────
  // Usage: 2 times in 1 files
  // Props: none
  //
  // TODO: Decide component type and implementation strategy
  // [ ] Review actual usage in MDX files
  // [ ] Determine if this should be block/inline/wrapper
  // [ ] Create Payload block definition if needed
  // [ ] Map all props to Payload fields
  // [ ] Test rendering in admin UI
  //
  'TDSPInfo': {
    status: 'needs-work', // TODO: Change to 'implemented' after creating block
    componentType: 'block', // TODO: Verify - 'block' | 'inline' | 'wrapper'
    canRenderBlock: true, // TODO: Can this render as standalone block?
    canRenderInline: false, // TODO: Can this render inline in text?

    payloadBlockType: undefined, // TODO: Add block type if implementing
    // payloadBlockType: 'TDSPInfoBlock', // Example

    mdxUsageCount: 2,

    fields: {
      // No props detected - verify in actual MDX files
    },

    todos: [
      // TODO: Add implementation tasks here, for example:
      // 'Create src/lexical/blocks/TDSPInfoBlock.ts',
      // 'Export from src/lexical/blocks/index.ts',
      // 'Add to payload.config.ts lexical editor config',
      // 'Test in admin UI',
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // ProvidersTable
  // ──────────────────────────────────────────────────────────────────────────
  // Usage: 2 times in 1 files
  // Props: title
  //
  // TODO: Decide component type and implementation strategy
  // [ ] Review actual usage in MDX files
  // [ ] Determine if this should be block/inline/wrapper
  // [ ] Create Payload block definition if needed
  // [ ] Map all props to Payload fields
  // [ ] Test rendering in admin UI
  //
  'ProvidersTable': {
    status: 'needs-work', // TODO: Change to 'implemented' after creating block
    componentType: 'block', // TODO: Verify - 'block' | 'inline' | 'wrapper'
    canRenderBlock: true, // TODO: Can this render as standalone block?
    canRenderInline: false, // TODO: Can this render inline in text?

    payloadBlockType: undefined, // TODO: Add block type if implementing
    // payloadBlockType: 'ProvidersTableBlock', // Example

    mdxUsageCount: 2,

    fields: {
      // TODO: Map prop 'title' to Payload field type
      // 'title': { type: '???' },
    },

    todos: [
      // TODO: Add implementation tasks here, for example:
      // 'Create src/lexical/blocks/ProvidersTableBlock.ts',
      // 'Export from src/lexical/blocks/index.ts',
      // 'Add to payload.config.ts lexical editor config',
      // 'Test in admin UI',
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // CTA
  // ──────────────────────────────────────────────────────────────────────────
  // Usage: 2 times in 1 files
  // Props: type
  //
  // TODO: Decide component type and implementation strategy
  // [ ] Review actual usage in MDX files
  // [ ] Determine if this should be block/inline/wrapper
  // [ ] Create Payload block definition if needed
  // [ ] Map all props to Payload fields
  // [ ] Test rendering in admin UI
  //
  'CTA': {
    status: 'needs-work', // TODO: Change to 'implemented' after creating block
    componentType: 'block', // TODO: Verify - 'block' | 'inline' | 'wrapper'
    canRenderBlock: true, // TODO: Can this render as standalone block?
    canRenderInline: false, // TODO: Can this render inline in text?

    payloadBlockType: undefined, // TODO: Add block type if implementing
    // payloadBlockType: 'CTABlock', // Example

    mdxUsageCount: 2,

    fields: {
      // TODO: Map prop 'type' to Payload field type
      // 'type': { type: '???' },
    },

    todos: [
      // TODO: Add implementation tasks here, for example:
      // 'Create src/lexical/blocks/CTABlock.ts',
      // 'Export from src/lexical/blocks/index.ts',
      // 'Add to payload.config.ts lexical editor config',
      // 'Test in admin UI',
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // PercentOffUsAvg
  // ──────────────────────────────────────────────────────────────────────────
  // Usage: 2 times in 1 files
  // Props: name
  //
  // TODO: Decide component type and implementation strategy
  // [ ] Review actual usage in MDX files
  // [ ] Determine if this should be block/inline/wrapper
  // [ ] Create Payload block definition if needed
  // [ ] Map all props to Payload fields
  // [ ] Test rendering in admin UI
  //
  'PercentOffUsAvg': {
    status: 'needs-work', // TODO: Change to 'implemented' after creating block
    componentType: 'block', // TODO: Verify - 'block' | 'inline' | 'wrapper'
    canRenderBlock: true, // TODO: Can this render as standalone block?
    canRenderInline: false, // TODO: Can this render inline in text?

    payloadBlockType: undefined, // TODO: Add block type if implementing
    // payloadBlockType: 'PercentOffUsAvgBlock', // Example

    mdxUsageCount: 2,

    fields: {
      // TODO: Map prop 'name' to Payload field type
      // 'name': { type: '???' },
    },

    todos: [
      // TODO: Add implementation tasks here, for example:
      // 'Create src/lexical/blocks/PercentOffUsAvgBlock.ts',
      // 'Export from src/lexical/blocks/index.ts',
      // 'Add to payload.config.ts lexical editor config',
      // 'Test in admin UI',
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // WpBlock94393_ShowSummary
  // ──────────────────────────────────────────────────────────────────────────
  // Usage: 2 times in 1 files
  // Props: none
  //
  // TODO: Decide component type and implementation strategy
  // [ ] Review actual usage in MDX files
  // [ ] Determine if this should be block/inline/wrapper
  // [ ] Create Payload block definition if needed
  // [ ] Map all props to Payload fields
  // [ ] Test rendering in admin UI
  //
  'WpBlock94393_ShowSummary': {
    status: 'needs-work', // TODO: Change to 'implemented' after creating block
    componentType: 'block', // TODO: Verify - 'block' | 'inline' | 'wrapper'
    canRenderBlock: true, // TODO: Can this render as standalone block?
    canRenderInline: false, // TODO: Can this render inline in text?

    payloadBlockType: undefined, // TODO: Add block type if implementing
    // payloadBlockType: 'WpBlock94393_ShowSummaryBlock', // Example

    mdxUsageCount: 2,

    fields: {
      // No props detected - verify in actual MDX files
    },

    todos: [
      // TODO: Add implementation tasks here, for example:
      // 'Create src/lexical/blocks/WpBlock94393_ShowSummaryBlock.ts',
      // 'Export from src/lexical/blocks/index.ts',
      // 'Add to payload.config.ts lexical editor config',
      // 'Test in admin UI',
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // PowerToChooseVideo
  // ──────────────────────────────────────────────────────────────────────────
  // Usage: 2 times in 1 files
  // Props: name
  //
  // TODO: Decide component type and implementation strategy
  // [ ] Review actual usage in MDX files
  // [ ] Determine if this should be block/inline/wrapper
  // [ ] Create Payload block definition if needed
  // [ ] Map all props to Payload fields
  // [ ] Test rendering in admin UI
  //
  'PowerToChooseVideo': {
    status: 'needs-work', // TODO: Change to 'implemented' after creating block
    componentType: 'block', // TODO: Verify - 'block' | 'inline' | 'wrapper'
    canRenderBlock: true, // TODO: Can this render as standalone block?
    canRenderInline: false, // TODO: Can this render inline in text?

    payloadBlockType: undefined, // TODO: Add block type if implementing
    // payloadBlockType: 'PowerToChooseVideoBlock', // Example

    mdxUsageCount: 2,

    fields: {
      // TODO: Map prop 'name' to Payload field type
      // 'name': { type: '???' },
    },

    todos: [
      // TODO: Add implementation tasks here, for example:
      // 'Create src/lexical/blocks/PowerToChooseVideoBlock.ts',
      // 'Export from src/lexical/blocks/index.ts',
      // 'Add to payload.config.ts lexical editor config',
      // 'Test in admin UI',
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // PartnershipFormGoogleForms
  // ──────────────────────────────────────────────────────────────────────────
  // Usage: 2 times in 1 files
  // Props: name
  //
  // TODO: Decide component type and implementation strategy
  // [ ] Review actual usage in MDX files
  // [ ] Determine if this should be block/inline/wrapper
  // [ ] Create Payload block definition if needed
  // [ ] Map all props to Payload fields
  // [ ] Test rendering in admin UI
  //
  'PartnershipFormGoogleForms': {
    status: 'needs-work', // TODO: Change to 'implemented' after creating block
    componentType: 'block', // TODO: Verify - 'block' | 'inline' | 'wrapper'
    canRenderBlock: true, // TODO: Can this render as standalone block?
    canRenderInline: false, // TODO: Can this render inline in text?

    payloadBlockType: undefined, // TODO: Add block type if implementing
    // payloadBlockType: 'PartnershipFormGoogleFormsBlock', // Example

    mdxUsageCount: 2,

    fields: {
      // TODO: Map prop 'name' to Payload field type
      // 'name': { type: '???' },
    },

    todos: [
      // TODO: Add implementation tasks here, for example:
      // 'Create src/lexical/blocks/PartnershipFormGoogleFormsBlock.ts',
      // 'Export from src/lexical/blocks/index.ts',
      // 'Add to payload.config.ts lexical editor config',
      // 'Test in admin UI',
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // ShopperApprovedWidgetTotalReviewsCounts
  // ──────────────────────────────────────────────────────────────────────────
  // Usage: 2 times in 1 files
  // Props: name
  //
  // TODO: Decide component type and implementation strategy
  // [ ] Review actual usage in MDX files
  // [ ] Determine if this should be block/inline/wrapper
  // [ ] Create Payload block definition if needed
  // [ ] Map all props to Payload fields
  // [ ] Test rendering in admin UI
  //
  'ShopperApprovedWidgetTotalReviewsCounts': {
    status: 'needs-work', // TODO: Change to 'implemented' after creating block
    componentType: 'block', // TODO: Verify - 'block' | 'inline' | 'wrapper'
    canRenderBlock: true, // TODO: Can this render as standalone block?
    canRenderInline: false, // TODO: Can this render inline in text?

    payloadBlockType: undefined, // TODO: Add block type if implementing
    // payloadBlockType: 'ShopperApprovedWidgetTotalReviewsCountsBlock', // Example

    mdxUsageCount: 2,

    fields: {
      // TODO: Map prop 'name' to Payload field type
      // 'name': { type: '???' },
    },

    todos: [
      // TODO: Add implementation tasks here, for example:
      // 'Create src/lexical/blocks/ShopperApprovedWidgetTotalReviewsCountsBlock.ts',
      // 'Export from src/lexical/blocks/index.ts',
      // 'Add to payload.config.ts lexical editor config',
      // 'Test in admin UI',
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // Program
  // ──────────────────────────────────────────────────────────────────────────
  // Usage: 2 times in 1 files
  // Props: content
  //
  // TODO: Decide component type and implementation strategy
  // [ ] Review actual usage in MDX files
  // [ ] Determine if this should be block/inline/wrapper
  // [ ] Create Payload block definition if needed
  // [ ] Map all props to Payload fields
  // [ ] Test rendering in admin UI
  //
  'Program': {
    status: 'needs-work', // TODO: Change to 'implemented' after creating block
    componentType: 'block', // TODO: Verify - 'block' | 'inline' | 'wrapper'
    canRenderBlock: true, // TODO: Can this render as standalone block?
    canRenderInline: false, // TODO: Can this render inline in text?

    payloadBlockType: undefined, // TODO: Add block type if implementing
    // payloadBlockType: 'ProgramBlock', // Example

    mdxUsageCount: 2,

    fields: {
      // TODO: Map prop 'content' to Payload field type
      // 'content': { type: '???' },
    },

    todos: [
      // TODO: Add implementation tasks here, for example:
      // 'Create src/lexical/blocks/ProgramBlock.ts',
      // 'Export from src/lexical/blocks/index.ts',
      // 'Add to payload.config.ts lexical editor config',
      // 'Test in admin UI',
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // Company
  // ──────────────────────────────────────────────────────────────────────────
  // Usage: 2 times in 1 files
  // Props: content
  //
  // TODO: Decide component type and implementation strategy
  // [ ] Review actual usage in MDX files
  // [ ] Determine if this should be block/inline/wrapper
  // [ ] Create Payload block definition if needed
  // [ ] Map all props to Payload fields
  // [ ] Test rendering in admin UI
  //
  'Company': {
    status: 'needs-work', // TODO: Change to 'implemented' after creating block
    componentType: 'block', // TODO: Verify - 'block' | 'inline' | 'wrapper'
    canRenderBlock: true, // TODO: Can this render as standalone block?
    canRenderInline: false, // TODO: Can this render inline in text?

    payloadBlockType: undefined, // TODO: Add block type if implementing
    // payloadBlockType: 'CompanyBlock', // Example

    mdxUsageCount: 2,

    fields: {
      // TODO: Map prop 'content' to Payload field type
      // 'content': { type: '???' },
    },

    todos: [
      // TODO: Add implementation tasks here, for example:
      // 'Create src/lexical/blocks/CompanyBlock.ts',
      // 'Export from src/lexical/blocks/index.ts',
      // 'Add to payload.config.ts lexical editor config',
      // 'Test in admin UI',
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // WpBlock91790_IntroducingLiveLink
  // ──────────────────────────────────────────────────────────────────────────
  // Usage: 2 times in 1 files
  // Props: none
  //
  // TODO: Decide component type and implementation strategy
  // [ ] Review actual usage in MDX files
  // [ ] Determine if this should be block/inline/wrapper
  // [ ] Create Payload block definition if needed
  // [ ] Map all props to Payload fields
  // [ ] Test rendering in admin UI
  //
  'WpBlock91790_IntroducingLiveLink': {
    status: 'needs-work', // TODO: Change to 'implemented' after creating block
    componentType: 'block', // TODO: Verify - 'block' | 'inline' | 'wrapper'
    canRenderBlock: true, // TODO: Can this render as standalone block?
    canRenderInline: false, // TODO: Can this render inline in text?

    payloadBlockType: undefined, // TODO: Add block type if implementing
    // payloadBlockType: 'WpBlock91790_IntroducingLiveLinkBlock', // Example

    mdxUsageCount: 2,

    fields: {
      // No props detected - verify in actual MDX files
    },

    todos: [
      // TODO: Add implementation tasks here, for example:
      // 'Create src/lexical/blocks/WpBlock91790_IntroducingLiveLinkBlock.ts',
      // 'Export from src/lexical/blocks/index.ts',
      // 'Add to payload.config.ts lexical editor config',
      // 'Test in admin UI',
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // WpBlock91788_RealCustomerExperiences
  // ──────────────────────────────────────────────────────────────────────────
  // Usage: 2 times in 1 files
  // Props: none
  //
  // TODO: Decide component type and implementation strategy
  // [ ] Review actual usage in MDX files
  // [ ] Determine if this should be block/inline/wrapper
  // [ ] Create Payload block definition if needed
  // [ ] Map all props to Payload fields
  // [ ] Test rendering in admin UI
  //
  'WpBlock91788_RealCustomerExperiences': {
    status: 'needs-work', // TODO: Change to 'implemented' after creating block
    componentType: 'block', // TODO: Verify - 'block' | 'inline' | 'wrapper'
    canRenderBlock: true, // TODO: Can this render as standalone block?
    canRenderInline: false, // TODO: Can this render inline in text?

    payloadBlockType: undefined, // TODO: Add block type if implementing
    // payloadBlockType: 'WpBlock91788_RealCustomerExperiencesBlock', // Example

    mdxUsageCount: 2,

    fields: {
      // No props detected - verify in actual MDX files
    },

    todos: [
      // TODO: Add implementation tasks here, for example:
      // 'Create src/lexical/blocks/WpBlock91788_RealCustomerExperiencesBlock.ts',
      // 'Export from src/lexical/blocks/index.ts',
      // 'Add to payload.config.ts lexical editor config',
      // 'Test in admin UI',
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // WpBlock84751_RentersInsuranceLemonade
  // ──────────────────────────────────────────────────────────────────────────
  // Usage: 2 times in 1 files
  // Props: none
  //
  // TODO: Decide component type and implementation strategy
  // [ ] Review actual usage in MDX files
  // [ ] Determine if this should be block/inline/wrapper
  // [ ] Create Payload block definition if needed
  // [ ] Map all props to Payload fields
  // [ ] Test rendering in admin UI
  //
  'WpBlock84751_RentersInsuranceLemonade': {
    status: 'needs-work', // TODO: Change to 'implemented' after creating block
    componentType: 'block', // TODO: Verify - 'block' | 'inline' | 'wrapper'
    canRenderBlock: true, // TODO: Can this render as standalone block?
    canRenderInline: false, // TODO: Can this render inline in text?

    payloadBlockType: undefined, // TODO: Add block type if implementing
    // payloadBlockType: 'WpBlock84751_RentersInsuranceLemonadeBlock', // Example

    mdxUsageCount: 2,

    fields: {
      // No props detected - verify in actual MDX files
    },

    todos: [
      // TODO: Add implementation tasks here, for example:
      // 'Create src/lexical/blocks/WpBlock84751_RentersInsuranceLemonadeBlock.ts',
      // 'Export from src/lexical/blocks/index.ts',
      // 'Add to payload.config.ts lexical editor config',
      // 'Test in admin UI',
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // WpBlock84539_TestimonialLowerHighBill
  // ──────────────────────────────────────────────────────────────────────────
  // Usage: 2 times in 1 files
  // Props: none
  //
  // TODO: Decide component type and implementation strategy
  // [ ] Review actual usage in MDX files
  // [ ] Determine if this should be block/inline/wrapper
  // [ ] Create Payload block definition if needed
  // [ ] Map all props to Payload fields
  // [ ] Test rendering in admin UI
  //
  'WpBlock84539_TestimonialLowerHighBill': {
    status: 'needs-work', // TODO: Change to 'implemented' after creating block
    componentType: 'block', // TODO: Verify - 'block' | 'inline' | 'wrapper'
    canRenderBlock: true, // TODO: Can this render as standalone block?
    canRenderInline: false, // TODO: Can this render inline in text?

    payloadBlockType: undefined, // TODO: Add block type if implementing
    // payloadBlockType: 'WpBlock84539_TestimonialLowerHighBillBlock', // Example

    mdxUsageCount: 2,

    fields: {
      // No props detected - verify in actual MDX files
    },

    todos: [
      // TODO: Add implementation tasks here, for example:
      // 'Create src/lexical/blocks/WpBlock84539_TestimonialLowerHighBillBlock.ts',
      // 'Export from src/lexical/blocks/index.ts',
      // 'Add to payload.config.ts lexical editor config',
      // 'Test in admin UI',
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // WpBlock84543_TestimonialMovingStart
  // ──────────────────────────────────────────────────────────────────────────
  // Usage: 2 times in 1 files
  // Props: none
  //
  // TODO: Decide component type and implementation strategy
  // [ ] Review actual usage in MDX files
  // [ ] Determine if this should be block/inline/wrapper
  // [ ] Create Payload block definition if needed
  // [ ] Map all props to Payload fields
  // [ ] Test rendering in admin UI
  //
  'WpBlock84543_TestimonialMovingStart': {
    status: 'needs-work', // TODO: Change to 'implemented' after creating block
    componentType: 'block', // TODO: Verify - 'block' | 'inline' | 'wrapper'
    canRenderBlock: true, // TODO: Can this render as standalone block?
    canRenderInline: false, // TODO: Can this render inline in text?

    payloadBlockType: undefined, // TODO: Add block type if implementing
    // payloadBlockType: 'WpBlock84543_TestimonialMovingStartBlock', // Example

    mdxUsageCount: 2,

    fields: {
      // No props detected - verify in actual MDX files
    },

    todos: [
      // TODO: Add implementation tasks here, for example:
      // 'Create src/lexical/blocks/WpBlock84543_TestimonialMovingStartBlock.ts',
      // 'Export from src/lexical/blocks/index.ts',
      // 'Add to payload.config.ts lexical editor config',
      // 'Test in admin UI',
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // FindBestRates
  // ──────────────────────────────────────────────────────────────────────────
  // Usage: 2 times in 1 files
  // Props: none
  //
  // TODO: Decide component type and implementation strategy
  // [ ] Review actual usage in MDX files
  // [ ] Determine if this should be block/inline/wrapper
  // [ ] Create Payload block definition if needed
  // [ ] Map all props to Payload fields
  // [ ] Test rendering in admin UI
  //
  'FindBestRates': {
    status: 'needs-work', // TODO: Change to 'implemented' after creating block
    componentType: 'block', // TODO: Verify - 'block' | 'inline' | 'wrapper'
    canRenderBlock: true, // TODO: Can this render as standalone block?
    canRenderInline: false, // TODO: Can this render inline in text?

    payloadBlockType: undefined, // TODO: Add block type if implementing
    // payloadBlockType: 'FindBestRatesBlock', // Example

    mdxUsageCount: 2,

    fields: {
      // No props detected - verify in actual MDX files
    },

    todos: [
      // TODO: Add implementation tasks here, for example:
      // 'Create src/lexical/blocks/FindBestRatesBlock.ts',
      // 'Export from src/lexical/blocks/index.ts',
      // 'Add to payload.config.ts lexical editor config',
      // 'Test in admin UI',
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // TryLiveLinkNow
  // ──────────────────────────────────────────────────────────────────────────
  // Usage: 2 times in 1 files
  // Props: name
  //
  // TODO: Decide component type and implementation strategy
  // [ ] Review actual usage in MDX files
  // [ ] Determine if this should be block/inline/wrapper
  // [ ] Create Payload block definition if needed
  // [ ] Map all props to Payload fields
  // [ ] Test rendering in admin UI
  //
  'TryLiveLinkNow': {
    status: 'needs-work', // TODO: Change to 'implemented' after creating block
    componentType: 'block', // TODO: Verify - 'block' | 'inline' | 'wrapper'
    canRenderBlock: true, // TODO: Can this render as standalone block?
    canRenderInline: false, // TODO: Can this render inline in text?

    payloadBlockType: undefined, // TODO: Add block type if implementing
    // payloadBlockType: 'TryLiveLinkNowBlock', // Example

    mdxUsageCount: 2,

    fields: {
      // TODO: Map prop 'name' to Payload field type
      // 'name': { type: '???' },
    },

    todos: [
      // TODO: Add implementation tasks here, for example:
      // 'Create src/lexical/blocks/TryLiveLinkNowBlock.ts',
      // 'Export from src/lexical/blocks/index.ts',
      // 'Add to payload.config.ts lexical editor config',
      // 'Test in admin UI',
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // PowerTacoToolVideo
  // ──────────────────────────────────────────────────────────────────────────
  // Usage: 2 times in 1 files
  // Props: name
  //
  // TODO: Decide component type and implementation strategy
  // [ ] Review actual usage in MDX files
  // [ ] Determine if this should be block/inline/wrapper
  // [ ] Create Payload block definition if needed
  // [ ] Map all props to Payload fields
  // [ ] Test rendering in admin UI
  //
  'PowerTacoToolVideo': {
    status: 'needs-work', // TODO: Change to 'implemented' after creating block
    componentType: 'block', // TODO: Verify - 'block' | 'inline' | 'wrapper'
    canRenderBlock: true, // TODO: Can this render as standalone block?
    canRenderInline: false, // TODO: Can this render inline in text?

    payloadBlockType: undefined, // TODO: Add block type if implementing
    // payloadBlockType: 'PowerTacoToolVideoBlock', // Example

    mdxUsageCount: 2,

    fields: {
      // TODO: Map prop 'name' to Payload field type
      // 'name': { type: '???' },
    },

    todos: [
      // TODO: Add implementation tasks here, for example:
      // 'Create src/lexical/blocks/PowerTacoToolVideoBlock.ts',
      // 'Export from src/lexical/blocks/index.ts',
      // 'Add to payload.config.ts lexical editor config',
      // 'Test in admin UI',
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // WpBlock60599_RatesNearYou
  // ──────────────────────────────────────────────────────────────────────────
  // Usage: 2 times in 1 files
  // Props: none
  //
  // TODO: Decide component type and implementation strategy
  // [ ] Review actual usage in MDX files
  // [ ] Determine if this should be block/inline/wrapper
  // [ ] Create Payload block definition if needed
  // [ ] Map all props to Payload fields
  // [ ] Test rendering in admin UI
  //
  'WpBlock60599_RatesNearYou': {
    status: 'needs-work', // TODO: Change to 'implemented' after creating block
    componentType: 'block', // TODO: Verify - 'block' | 'inline' | 'wrapper'
    canRenderBlock: true, // TODO: Can this render as standalone block?
    canRenderInline: false, // TODO: Can this render inline in text?

    payloadBlockType: undefined, // TODO: Add block type if implementing
    // payloadBlockType: 'WpBlock60599_RatesNearYouBlock', // Example

    mdxUsageCount: 2,

    fields: {
      // No props detected - verify in actual MDX files
    },

    todos: [
      // TODO: Add implementation tasks here, for example:
      // 'Create src/lexical/blocks/WpBlock60599_RatesNearYouBlock.ts',
      // 'Export from src/lexical/blocks/index.ts',
      // 'Add to payload.config.ts lexical editor config',
      // 'Test in admin UI',
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // SectionIntro
  // ──────────────────────────────────────────────────────────────────────────
  // Usage: 1 times in 1 files
  // Props: title, headingLevel, id
  //
  // TODO: Decide component type and implementation strategy
  // [ ] Review actual usage in MDX files
  // [ ] Determine if this should be block/inline/wrapper
  // [ ] Create Payload block definition if needed
  // [ ] Map all props to Payload fields
  // [ ] Test rendering in admin UI
  //
  'SectionIntro': {
    status: 'needs-work', // TODO: Change to 'implemented' after creating block
    componentType: 'block', // TODO: Verify - 'block' | 'inline' | 'wrapper'
    canRenderBlock: true, // TODO: Can this render as standalone block?
    canRenderInline: false, // TODO: Can this render inline in text?

    payloadBlockType: undefined, // TODO: Add block type if implementing
    // payloadBlockType: 'SectionIntroBlock', // Example

    mdxUsageCount: 1,

    fields: {
      // TODO: Map prop 'title' to Payload field type
      // 'title': { type: '???' },
      // TODO: Map prop 'headingLevel' to Payload field type
      // 'headingLevel': { type: '???' },
      // TODO: Map prop 'id' to Payload field type
      // 'id': { type: '???' },
    },

    todos: [
      // TODO: Add implementation tasks here, for example:
      // 'Create src/lexical/blocks/SectionIntroBlock.ts',
      // 'Export from src/lexical/blocks/index.ts',
      // 'Add to payload.config.ts lexical editor config',
      // 'Test in admin UI',
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // TestimonialGrid
  // ──────────────────────────────────────────────────────────────────────────
  // Usage: 1 times in 1 files
  // Props: columns
  //
  // TODO: Decide component type and implementation strategy
  // [ ] Review actual usage in MDX files
  // [ ] Determine if this should be block/inline/wrapper
  // [ ] Create Payload block definition if needed
  // [ ] Map all props to Payload fields
  // [ ] Test rendering in admin UI
  //
  'TestimonialGrid': {
    status: 'needs-work', // TODO: Change to 'implemented' after creating block
    componentType: 'block', // TODO: Verify - 'block' | 'inline' | 'wrapper'
    canRenderBlock: true, // TODO: Can this render as standalone block?
    canRenderInline: false, // TODO: Can this render inline in text?

    payloadBlockType: undefined, // TODO: Add block type if implementing
    // payloadBlockType: 'TestimonialGridBlock', // Example

    mdxUsageCount: 1,

    fields: {
      // TODO: Map prop 'columns' to Payload field type
      // 'columns': { type: '???' },
    },

    todos: [
      // TODO: Add implementation tasks here, for example:
      // 'Create src/lexical/blocks/TestimonialGridBlock.ts',
      // 'Export from src/lexical/blocks/index.ts',
      // 'Add to payload.config.ts lexical editor config',
      // 'Test in admin UI',
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // Testimonial
  // ──────────────────────────────────────────────────────────────────────────
  // Usage: 1 times in 1 files
  // Props: rating
  //
  // TODO: Decide component type and implementation strategy
  // [ ] Review actual usage in MDX files
  // [ ] Determine if this should be block/inline/wrapper
  // [ ] Create Payload block definition if needed
  // [ ] Map all props to Payload fields
  // [ ] Test rendering in admin UI
  //
  'Testimonial': {
    status: 'needs-work', // TODO: Change to 'implemented' after creating block
    componentType: 'block', // TODO: Verify - 'block' | 'inline' | 'wrapper'
    canRenderBlock: true, // TODO: Can this render as standalone block?
    canRenderInline: false, // TODO: Can this render inline in text?

    payloadBlockType: undefined, // TODO: Add block type if implementing
    // payloadBlockType: 'TestimonialBlock', // Example

    mdxUsageCount: 1,

    fields: {
      // TODO: Map prop 'rating' to Payload field type
      // 'rating': { type: '???' },
    },

    todos: [
      // TODO: Add implementation tasks here, for example:
      // 'Create src/lexical/blocks/TestimonialBlock.ts',
      // 'Export from src/lexical/blocks/index.ts',
      // 'Add to payload.config.ts lexical editor config',
      // 'Test in admin UI',
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // InfoBox
  // ──────────────────────────────────────────────────────────────────────────
  // Usage: 1 times in 1 files
  // Props: type
  //
  // TODO: Decide component type and implementation strategy
  // [ ] Review actual usage in MDX files
  // [ ] Determine if this should be block/inline/wrapper
  // [ ] Create Payload block definition if needed
  // [ ] Map all props to Payload fields
  // [ ] Test rendering in admin UI
  //
  'InfoBox': {
    status: 'needs-work', // TODO: Change to 'implemented' after creating block
    componentType: 'block', // TODO: Verify - 'block' | 'inline' | 'wrapper'
    canRenderBlock: true, // TODO: Can this render as standalone block?
    canRenderInline: false, // TODO: Can this render inline in text?

    payloadBlockType: undefined, // TODO: Add block type if implementing
    // payloadBlockType: 'InfoBoxBlock', // Example

    mdxUsageCount: 1,

    fields: {
      // TODO: Map prop 'type' to Payload field type
      // 'type': { type: '???' },
    },

    todos: [
      // TODO: Add implementation tasks here, for example:
      // 'Create src/lexical/blocks/InfoBoxBlock.ts',
      // 'Export from src/lexical/blocks/index.ts',
      // 'Add to payload.config.ts lexical editor config',
      // 'Test in admin UI',
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // Admonition
  // ──────────────────────────────────────────────────────────────────────────
  // Usage: 1 times in 1 files
  // Props: variant
  //
  // TODO: Decide component type and implementation strategy
  // [ ] Review actual usage in MDX files
  // [ ] Determine if this should be block/inline/wrapper
  // [ ] Create Payload block definition if needed
  // [ ] Map all props to Payload fields
  // [ ] Test rendering in admin UI
  //
  'Admonition': {
    status: 'needs-work', // TODO: Change to 'implemented' after creating block
    componentType: 'block', // TODO: Verify - 'block' | 'inline' | 'wrapper'
    canRenderBlock: true, // TODO: Can this render as standalone block?
    canRenderInline: false, // TODO: Can this render inline in text?

    payloadBlockType: undefined, // TODO: Add block type if implementing
    // payloadBlockType: 'AdmonitionBlock', // Example

    mdxUsageCount: 1,

    fields: {
      // TODO: Map prop 'variant' to Payload field type
      // 'variant': { type: '???' },
    },

    todos: [
      // TODO: Add implementation tasks here, for example:
      // 'Create src/lexical/blocks/AdmonitionBlock.ts',
      // 'Export from src/lexical/blocks/index.ts',
      // 'Add to payload.config.ts lexical editor config',
      // 'Test in admin UI',
    ],
  },

}

// ============================================================================
// PRIORITY RECOMMENDATIONS
// ============================================================================

/**
 * HIGH PRIORITY (>1000 uses):
 * ---------------------------
 * These components are used extensively and should be implemented first:
 *
 * - Section: 6601 uses
 * - Image: 5292 uses
 * - EiaMonth: 1774 uses
 * - EiaRatesChart: 1770 uses
 * - WpBlock60290_AvgTexasResidentialRate: 1764 uses
 *
 * MEDIUM PRIORITY (100-1000 uses):
 * --------------------------------
 * - WpBlock60291_AvgTexasCommercialRate: 234 uses
 *
 * LOW PRIORITY (<100 uses):
 * -------------------------
 * 48 components with fewer than 100 uses each
 * Consider marking these as 'wrapper' if they're just containers
 * or implementing as simple text replacements
 */

// ============================================================================
// NEXT STEPS
// ============================================================================

/**
 * 1. Review each component marked with TODO comments above
 * 2. For high-priority components, examine actual MDX usage:
 *    - Find example file from analysis report
 *    - Look at how component is used in context
 *    - Determine what functionality it provides
 *
 * 3. Decide implementation strategy:
 *    - Full Payload block: Interactive component needs props/data
 *    - Wrapper: Just a container, strip during parsing
 *    - Text replacement: Static content, replace with markdown
 *
 * 4. Copy completed entries to component-registry.ts
 *
 * 5. Re-run analysis to verify:
 *    pnpm tsx migration/scripts/analyze-mdx-components.mjs
 */
