/**
 * Component Registry - Type-Safe MDX ↔ Payload CMS Mapping System
 *
 * Single source of truth for all MDX component mappings in the migration pipeline.
 * This registry tracks component implementations, validates during migration, and
 * enables rendering of Payload content back to Astro components.
 *
 * **Purpose**:
 * - Prevent unmapped MDX components from corrupting migrated content
 * - Track implementation status across all components
 * - Enable fail-fast validation during migration
 * - Support Lexical → Astro rendering for frontend
 * - Generate progress reports and documentation
 *
 * **Related**: Issue #2 - Robust MDX Importer (CRITICAL)
 * **Related**: Issue #16 - Component Registry Types and Interfaces
 *
 * @see {@link migration/COMPONENT-REGISTRY-DESIGN.md} - Complete design specification
 * @see {@link migration/UNMAPPED-COMPONENTS-ANALYSIS.md} - Component analysis
 *
 * @module component-registry
 */

/**
 * Component implementation status
 *
 * Tracks the current state of each component's implementation:
 * - `implemented`: Fully working with Payload block + frontend component
 * - `placeholder`: Has Payload block definition but no frontend rendering component yet
 * - `needs-work`: Stub, incomplete, or requires additional implementation
 * - `deprecated`: Should be removed from MDX files (no longer used)
 * - `alias`: Maps to another component (use `aliasOf` field)
 *
 * @example
 * ```typescript
 * const component: ComponentMapping = {
 *   status: 'implemented', // Fully ready for production
 *   // ... other fields
 * }
 * ```
 */
export type ComponentStatus =
  | 'implemented'  // Fully implemented with Payload block
  | 'placeholder'  // Has block definition but no frontend component
  | 'needs-work'   // Stub or incomplete implementation
  | 'deprecated'   // Should be removed from MDX
  | 'alias'        // Maps to another component

/**
 * Component type classification
 *
 * Determines how the component should be handled during parsing and rendering:
 * - `block`: Block-level component that renders as standalone content block
 * - `inline`: Inline component that appears within text (e.g., phone numbers)
 * - `wrapper`: Structural wrapper component (stripped during parsing, children extracted)
 *
 * @example
 * ```typescript
 * // Block-level component
 * const ratesTable: ComponentMapping = {
 *   componentType: 'block',
 *   canRenderBlock: true,
 *   canRenderInline: false,
 *   // ... other fields
 * }
 *
 * // Inline component
 * const phoneNumber: ComponentMapping = {
 *   componentType: 'inline',
 *   canRenderBlock: false,
 *   canRenderInline: true,
 *   requiresDataInstance: true,
 *   // ... other fields
 * }
 *
 * // Wrapper component (stripped)
 * const section: ComponentMapping = {
 *   componentType: 'wrapper',
 *   canRenderBlock: false,
 *   canRenderInline: false,
 *   // ... other fields
 * }
 * ```
 */
export type ComponentType =
  | 'block'    // Block-level component (standalone)
  | 'inline'   // Inline component (within text)
  | 'wrapper'  // Structural wrapper (stripped during parsing)

/**
 * Component field definition
 *
 * Describes a single field/prop that a component accepts.
 * Used for validation, documentation, and Payload schema generation.
 *
 * @example
 * ```typescript
 * const providerField: ComponentField = {
 *   name: 'provider',
 *   type: 'string',
 *   required: false,
 *   description: 'Filter rates by provider slug',
 *   defaultValue: undefined
 * }
 * ```
 */
export interface ComponentField {
  /**
   * Field name (prop name in MDX/Astro component)
   *
   * @example 'provider', 'city', 'title', 'alt'
   */
  name: string

  /**
   * Field data type
   *
   * Maps to TypeScript/Payload field types:
   * - `string`: Text content
   * - `number`: Numeric values
   * - `boolean`: True/false flags
   * - `relationship`: Reference to another Payload collection
   * - `richText`: Lexical rich text content
   * - `image`: Media/upload reference
   * - `array`: Array of values
   */
  type: 'string' | 'number' | 'boolean' | 'relationship' | 'richText' | 'image' | 'array'

  /**
   * Whether field is required
   *
   * @default false
   */
  required?: boolean

  /**
   * Human-readable description of field purpose
   *
   * @example 'Display date in "Month Year" format'
   */
  description?: string

  /**
   * Default value if not provided
   *
   * @example 'Current month', 42, true, []
   */
  defaultValue?: any
}

/**
 * Complete component mapping definition
 *
 * Centralized record of all metadata for a single MDX component, including:
 * - Source component details (MDX/Astro)
 * - Target Payload block configuration
 * - Implementation status and tracking
 * - Rendering capabilities
 * - WordPress legacy metadata (if applicable)
 *
 * This interface is the core of the Component Registry system.
 *
 * @example
 * ```typescript
 * import { ComponentMapping } from './component-registry'
 *
 * const ratesTableMapping: ComponentMapping = {
 *   // === SOURCE (MDX/Astro) ===
 *   mdxName: 'RatesTable',
 *   astroComponentPath: 'src/components/tables/RatesTable.astro',
 *   usageCount: 1149,
 *
 *   // === TARGET (Payload) ===
 *   payloadBlockSlug: 'ratesTable',
 *   payloadBlockPath: 'src/lexical/blocks/RatesTableBlock.ts',
 *   payloadInterfaceName: 'RatesTableBlockType',
 *
 *   // === METADATA ===
 *   componentType: 'block',
 *   status: 'implemented',
 *   fields: [
 *     { name: 'provider', type: 'string', required: false },
 *     { name: 'city', type: 'string', required: false }
 *   ],
 *
 *   // === IMPLEMENTATION TRACKING ===
 *   notes: 'Displays electricity rates comparison table',
 *
 *   // === RENDERING CAPABILITIES ===
 *   canRenderInline: false,
 *   canRenderBlock: true,
 *   requiresDataInstance: false
 * }
 * ```
 */
export interface ComponentMapping {
  // ============================================================
  // SOURCE (MDX/Astro)
  // ============================================================

  /**
   * Component name as used in MDX files
   *
   * This is the PascalCase name used in MDX:
   * `<RatesTable provider="reliant" />`
   *
   * @example 'RatesTable', 'ReliantPhoneNumber', 'EiaMonth'
   */
  mdxName: string

  /**
   * Path to Astro component file (relative to Astro project root)
   *
   * Used for Lexical → Astro rendering to dynamically import the component.
   *
   * @example 'src/components/tables/RatesTable.astro'
   * @example 'src/components/phone/ReliantPhoneNumber.astro'
   * @optional Only required if component has frontend rendering
   */
  astroComponentPath?: string

  /**
   * Number of times this component appears in source MDX files
   *
   * Helps prioritize implementation work (higher usage = higher priority).
   *
   * @example 1149, 885, 21
   * @optional Populated during MDX analysis phase
   */
  usageCount?: number

  // ============================================================
  // TARGET (Payload CMS)
  // ============================================================

  /**
   * Payload block slug (camelCase)
   *
   * Used in `contentBlocks` array:
   * `{ blockType: 'ratesTable', provider: 'reliant' }`
   *
   * @example 'ratesTable', 'reliantPhoneNumber', 'eiaMonth'
   */
  payloadBlockSlug: string

  /**
   * Path to Payload block definition file (relative to project root)
   *
   * @example 'src/lexical/blocks/RatesTableBlock.ts'
   * @example 'src/lexical/inlineBlocks.ts'
   * @optional Only required if block is implemented
   */
  payloadBlockPath?: string

  /**
   * TypeScript interface name for block type
   *
   * Used for type-safe block manipulation in code.
   *
   * @example 'RatesTableBlockType', 'ReliantPhoneNumberBlockType'
   * @optional Only required if block has TypeScript types
   */
  payloadInterfaceName?: string

  // ============================================================
  // METADATA
  // ============================================================

  /**
   * Component type classification
   *
   * @see {@link ComponentType} for detailed explanation
   */
  componentType: ComponentType

  /**
   * Current implementation status
   *
   * @see {@link ComponentStatus} for detailed explanation
   */
  status: ComponentStatus

  /**
   * List of fields/props this component accepts
   *
   * Used for:
   * - Validation during migration
   * - Generating Payload block schemas
   * - Documentation generation
   *
   * @example
   * ```typescript
   * fields: [
   *   { name: 'provider', type: 'string', required: false },
   *   { name: 'city', type: 'string', required: false }
   * ]
   * ```
   */
  fields: ComponentField[]

  // ============================================================
  // IMPLEMENTATION TRACKING
  // ============================================================

  /**
   * General notes about this component
   *
   * Can include:
   * - Purpose and behavior
   * - Implementation details
   * - Known issues or limitations
   * - Migration considerations
   *
   * @example 'EMPTY STUB - component has no content. Used 882 times but renders nothing.'
   * @example 'Displays Reliant Energy phone number from RichTextDataInstances'
   */
  notes?: string

  /**
   * List of TODOs for completing implementation
   *
   * Used to track remaining work and generate progress reports.
   *
   * @example
   * ```typescript
   * todos: [
   *   'Create Payload block definition at src/lexical/blocks/EiaMonthBlock.ts',
   *   'Add to CONTENT_BLOCKS array in src/lexical/blocks/index.ts',
   *   'Create Astro rendering component',
   *   'Test migration with sample MDX files'
   * ]
   * ```
   */
  todos?: string[]

  /**
   * If status is 'alias', which component does this map to?
   *
   * Used to redirect one component name to another during migration.
   *
   * @example
   * ```typescript
   * {
   *   mdxName: 'WpBlock75232_EnergySavingsArticlesCopy',
   *   status: 'alias',
   *   aliasOf: 'WpBlock59853_EnergySavingsArticles',
   *   payloadBlockSlug: 'wpBlock59853_EnergySavingsArticles'
   * }
   * ```
   */
  aliasOf?: string

  // ============================================================
  // RENDERING CAPABILITIES
  // ============================================================

  /**
   * Can this component be rendered inline (within text)?
   *
   * If `true`, component can be used as Lexical inline block:
   * `<p>Call us at <ReliantPhoneNumber /></p>`
   *
   * @example true for phone numbers, false for RatesTable
   */
  canRenderInline: boolean

  /**
   * Can this component be rendered as standalone block?
   *
   * If `true`, component can be used as content block:
   * `contentBlocks: [{ blockType: 'ratesTable', ... }]`
   *
   * @example true for RatesTable, false for phone numbers
   */
  canRenderBlock: boolean

  /**
   * Does this component require RichTextDataInstance lookup?
   *
   * If `true`, component fetches dynamic data from RichTextDataInstances collection
   * during rendering (e.g., phone numbers, current rates).
   *
   * @example true for ReliantPhoneNumber, false for static components
   */
  requiresDataInstance?: boolean

  // ============================================================
  // WORDPRESS LEGACY
  // ============================================================

  /**
   * Original WordPress block ID
   *
   * Used to trace component back to original WordPress shortcode/block.
   *
   * @example 60549, 75232, 80371
   * @optional Only for components migrated from WordPress
   */
  wpBlockId?: number

  /**
   * Original WordPress block name
   *
   * @example 'wp:comparepower/unknown', 'wp:comparepower/energy-savings'
   * @optional Only for components migrated from WordPress
   */
  wpBlockName?: string
}

// ============================================================
// COMPONENT REGISTRY
// ============================================================

/**
 * Component Registry - Single source of truth for all MDX → Payload mappings
 *
 * This registry tracks all MDX components and their Payload CMS mappings.
 * **Related**: Issue #17 - Populate Registry with Inline Components
 *
 * @see {@link getComponentMapping} - Utility to retrieve mapping by name
 * @see {@link validateComponent} - Utility to validate component during migration
 */
export const COMPONENT_REGISTRY: Record<string, ComponentMapping> = {
  // ============================================================
  // INLINE COMPONENTS - Phone Numbers (18 components)
  // ============================================================

  ReliantPhoneNumber: {
    mdxName: 'ReliantPhoneNumber',
    astroComponentPath: 'src/components/phone/ReliantPhoneNumber.astro',
    payloadBlockSlug: 'reliantPhoneNumber',
    componentType: 'inline',
    status: 'implemented',
    fields: [],
    canRenderInline: true,
    canRenderBlock: false,
    requiresDataInstance: true,
    notes: 'Displays Reliant Energy phone number from RichTextDataInstances collection',
  },

  AmigoPhoneNumber: {
    mdxName: 'AmigoPhoneNumber',
    astroComponentPath: 'src/components/phone/AmigoPhoneNumber.astro',
    payloadBlockSlug: 'amigoPhoneNumber',
    componentType: 'inline',
    status: 'implemented',
    fields: [],
    canRenderInline: true,
    canRenderBlock: false,
    requiresDataInstance: true,
    notes: 'Displays Amigo Energy phone number from RichTextDataInstances collection',
  },

  CirroEnergyPhoneNumber: {
    mdxName: 'CirroEnergyPhoneNumber',
    astroComponentPath: 'src/components/phone/CirroEnergyPhoneNumber.astro',
    payloadBlockSlug: 'cirroEnergyPhoneNumber',
    componentType: 'inline',
    status: 'implemented',
    fields: [],
    canRenderInline: true,
    canRenderBlock: false,
    requiresDataInstance: true,
    notes: 'Displays Cirro Energy phone number from RichTextDataInstances collection',
  },

  ConstellationPhoneNumber: {
    mdxName: 'ConstellationPhoneNumber',
    astroComponentPath: 'src/components/phone/ConstellationPhoneNumber.astro',
    payloadBlockSlug: 'constellationPhoneNumber',
    componentType: 'inline',
    status: 'implemented',
    fields: [],
    canRenderInline: true,
    canRenderBlock: false,
    requiresDataInstance: true,
    notes: 'Displays Constellation Energy phone number from RichTextDataInstances collection',
  },

  DirectEnergyPhoneNumber: {
    mdxName: 'DirectEnergyPhoneNumber',
    astroComponentPath: 'src/components/phone/DirectEnergyPhoneNumber.astro',
    payloadBlockSlug: 'directEnergyPhoneNumber',
    componentType: 'inline',
    status: 'implemented',
    fields: [],
    canRenderInline: true,
    canRenderBlock: false,
    requiresDataInstance: true,
    notes: 'Displays Direct Energy phone number from RichTextDataInstances collection',
  },

  DiscountPowerPhoneNumber: {
    mdxName: 'DiscountPowerPhoneNumber',
    astroComponentPath: 'src/components/phone/DiscountPowerPhoneNumber.astro',
    payloadBlockSlug: 'discountPowerPhoneNumber',
    componentType: 'inline',
    status: 'implemented',
    fields: [],
    canRenderInline: true,
    canRenderBlock: false,
    requiresDataInstance: true,
    notes: 'Displays Discount Power phone number from RichTextDataInstances collection',
  },

  FlagshipPhoneNumber: {
    mdxName: 'FlagshipPhoneNumber',
    astroComponentPath: 'src/components/phone/FlagshipPhoneNumber.astro',
    payloadBlockSlug: 'flagshipPhoneNumber',
    componentType: 'inline',
    status: 'implemented',
    fields: [],
    canRenderInline: true,
    canRenderBlock: false,
    requiresDataInstance: true,
    notes: 'Displays Flagship Power phone number from RichTextDataInstances collection',
  },

  FourChangePhoneNumber: {
    mdxName: 'FourChangePhoneNumber',
    astroComponentPath: 'src/components/phone/FourChangePhoneNumber.astro',
    payloadBlockSlug: 'fourChangePhoneNumber',
    componentType: 'inline',
    status: 'implemented',
    fields: [],
    canRenderInline: true,
    canRenderBlock: false,
    requiresDataInstance: true,
    notes: 'Displays 4Change Energy phone number from RichTextDataInstances collection',
  },

  FrontierPhoneNumber: {
    mdxName: 'FrontierPhoneNumber',
    astroComponentPath: 'src/components/phone/FrontierPhoneNumber.astro',
    payloadBlockSlug: 'frontierPhoneNumber',
    componentType: 'inline',
    status: 'implemented',
    fields: [],
    canRenderInline: true,
    canRenderBlock: false,
    requiresDataInstance: true,
    notes: 'Displays Frontier Utilities phone number from RichTextDataInstances collection',
  },

  FrontierPhoneNumberLinkRc: {
    mdxName: 'FrontierPhoneNumberLinkRc',
    astroComponentPath: 'src/components/phone/FrontierPhoneNumberLinkRc.astro',
    payloadBlockSlug: 'frontierPhoneNumberLinkRc',
    componentType: 'inline',
    status: 'implemented',
    fields: [],
    canRenderInline: true,
    canRenderBlock: false,
    requiresDataInstance: true,
    notes: 'Displays Frontier Utilities phone number with special link/RC tracking',
  },

  GexaPhoneNumber: {
    mdxName: 'GexaPhoneNumber',
    astroComponentPath: 'src/components/phone/GexaPhoneNumber.astro',
    payloadBlockSlug: 'gexaPhoneNumber',
    componentType: 'inline',
    status: 'implemented',
    fields: [],
    canRenderInline: true,
    canRenderBlock: false,
    requiresDataInstance: true,
    notes: 'Displays Gexa Energy phone number from RichTextDataInstances collection',
  },

  GreenMountainPhoneNumber: {
    mdxName: 'GreenMountainPhoneNumber',
    astroComponentPath: 'src/components/phone/GreenMountainPhoneNumber.astro',
    payloadBlockSlug: 'greenMountainPhoneNumber',
    componentType: 'inline',
    status: 'implemented',
    fields: [],
    canRenderInline: true,
    canRenderBlock: false,
    requiresDataInstance: true,
    notes: 'Displays Green Mountain Energy phone number from RichTextDataInstances collection',
  },

  JustPhoneNumber: {
    mdxName: 'JustPhoneNumber',
    astroComponentPath: 'src/components/phone/JustPhoneNumber.astro',
    payloadBlockSlug: 'justPhoneNumber',
    componentType: 'inline',
    status: 'implemented',
    fields: [],
    canRenderInline: true,
    canRenderBlock: false,
    requiresDataInstance: true,
    notes: 'Displays Just Energy phone number from RichTextDataInstances collection',
  },

  NewPowerPhoneNumber: {
    mdxName: 'NewPowerPhoneNumber',
    astroComponentPath: 'src/components/phone/NewPowerPhoneNumber.astro',
    payloadBlockSlug: 'newPowerPhoneNumber',
    componentType: 'inline',
    status: 'implemented',
    fields: [],
    canRenderInline: true,
    canRenderBlock: false,
    requiresDataInstance: true,
    notes: 'Displays NewPower phone number from RichTextDataInstances collection',
  },

  PaylessPowerPhoneNumber: {
    mdxName: 'PaylessPowerPhoneNumber',
    astroComponentPath: 'src/components/phone/PaylessPowerPhoneNumber.astro',
    payloadBlockSlug: 'paylessPowerPhoneNumber',
    componentType: 'inline',
    status: 'implemented',
    fields: [],
    canRenderInline: true,
    canRenderBlock: false,
    requiresDataInstance: true,
    notes: 'Displays Payless Power phone number from RichTextDataInstances collection',
  },

  PulsePowerPhoneNumber: {
    mdxName: 'PulsePowerPhoneNumber',
    astroComponentPath: 'src/components/phone/PulsePowerPhoneNumber.astro',
    payloadBlockSlug: 'pulsePowerPhoneNumber',
    componentType: 'inline',
    status: 'implemented',
    fields: [],
    canRenderInline: true,
    canRenderBlock: false,
    requiresDataInstance: true,
    notes: 'Displays Pulse Power phone number from RichTextDataInstances collection',
  },

  RhythmEnergyPhone: {
    mdxName: 'RhythmEnergyPhone',
    astroComponentPath: 'src/components/phone/RhythmEnergyPhone.astro',
    payloadBlockSlug: 'rhythmEnergyPhone',
    componentType: 'inline',
    status: 'implemented',
    fields: [],
    canRenderInline: true,
    canRenderBlock: false,
    requiresDataInstance: true,
    notes: 'Displays Rhythm Energy phone number from RichTextDataInstances collection',
  },

  TaraEnergyPhoneNumber: {
    mdxName: 'TaraEnergyPhoneNumber',
    astroComponentPath: 'src/components/phone/TaraEnergyPhoneNumber.astro',
    payloadBlockSlug: 'taraEnergyPhoneNumber',
    componentType: 'inline',
    status: 'implemented',
    fields: [],
    canRenderInline: true,
    canRenderBlock: false,
    requiresDataInstance: true,
    notes: 'Displays TXU Energy phone number from RichTextDataInstances collection',
  },

  TxuPhoneNumber: {
    mdxName: 'TxuPhoneNumber',
    astroComponentPath: 'src/components/phone/TxuPhoneNumber.astro',
    payloadBlockSlug: 'txuPhoneNumber',
    componentType: 'inline',
    status: 'implemented',
    fields: [],
    canRenderInline: true,
    canRenderBlock: false,
    requiresDataInstance: true,
    notes: 'Displays TXU Energy phone number from RichTextDataInstances collection',
  },

  // ============================================================
  // INLINE COMPONENTS - Dynamic Data (5 components)
  // ============================================================

  AvgTexasResidentialRate: {
    mdxName: 'AvgTexasResidentialRate',
    astroComponentPath: 'src/components/dynamic-data/AvgTexasResidentialRate.astro',
    payloadBlockSlug: 'avgTexasResidentialRate',
    componentType: 'inline',
    status: 'implemented',
    fields: [],
    canRenderInline: true,
    canRenderBlock: false,
    requiresDataInstance: true,
    notes: 'Displays average Texas residential electricity rate from RichTextDataInstances collection',
  },

  ComparepowerReviewCount: {
    mdxName: 'ComparepowerReviewCount',
    astroComponentPath: 'src/components/dynamic-data/ComparepowerReviewCount.astro',
    payloadBlockSlug: 'comparepowerReviewCount',
    componentType: 'inline',
    status: 'implemented',
    fields: [],
    canRenderInline: true,
    canRenderBlock: false,
    requiresDataInstance: true,
    notes: 'Displays ComparePower review count from RichTextDataInstances collection',
  },

  CurrentYear: {
    mdxName: 'CurrentYear',
    astroComponentPath: 'src/components/dynamic-data/CurrentYear.astro',
    payloadBlockSlug: 'currentYear',
    componentType: 'inline',
    status: 'implemented',
    fields: [],
    canRenderInline: true,
    canRenderBlock: false,
    requiresDataInstance: true,
    notes: 'Displays current year from RichTextDataInstances collection',
  },

  CurrentMonth: {
    mdxName: 'CurrentMonth',
    astroComponentPath: 'src/components/dynamic-data/CurrentMonth.astro',
    payloadBlockSlug: 'currentMonth',
    componentType: 'inline',
    status: 'implemented',
    fields: [],
    canRenderInline: true,
    canRenderBlock: false,
    requiresDataInstance: true,
    notes: 'Displays current month from RichTextDataInstances collection',
  },

  YearsSince: {
    mdxName: 'YearsSince',
    astroComponentPath: 'src/components/dynamic-data/YearsSince.astro',
    payloadBlockSlug: 'yearsSince',
    componentType: 'inline',
    status: 'implemented',
    fields: [
      {
        name: 'year',
        type: 'number',
        required: true,
        description: 'Base year to calculate years since',
      },
    ],
    canRenderInline: true,
    canRenderBlock: false,
    requiresDataInstance: false,
    notes: 'Calculates and displays years since a given year (e.g., "15 years" if year=2010 and current year is 2025)',
  },

  // ============================================================
  // HYBRID COMPONENTS - Can be both inline and block (1 component)
  // ============================================================

  LowestRateDisplay: {
    mdxName: 'LowestRateDisplay',
    astroComponentPath: 'src/components/rates/LowestRateDisplay.astro',
    payloadBlockSlug: 'lowestRateDisplay',
    payloadBlockPath: 'src/lexical/blocks/LowestRateDisplayBlock.ts',
    componentType: 'block', // Changed from 'inline' since it's primarily a block
    status: 'implemented',
    fields: [
      {
        name: 'provider',
        type: 'string',
        required: false,
        description: 'Optional provider slug to filter rates',
      },
      {
        name: 'city',
        type: 'string',
        required: false,
        description: 'Optional city slug to filter rates',
      },
    ],
    canRenderInline: true,
    canRenderBlock: true,
    requiresDataInstance: false,
    notes: 'Displays lowest available electricity rate. Can be used inline or as standalone block.',
  },

  // ============================================================
  // WRAPPER COMPONENTS - Structural wrappers (stripped during parsing)
  // ============================================================

  Section: {
    mdxName: 'Section',
    astroComponentPath: 'src/components/Section.astro',
    payloadBlockSlug: null, // Wrapper - not converted to block
    componentType: 'wrapper',
    status: 'implemented',
    fields: [
      {
        name: 'id',
        type: 'string',
        required: true,
        description: 'Section identifier for programmatic targeting',
      },
      {
        name: 'title',
        type: 'string',
        required: false,
        description: 'Section title (optional)',
      },
      {
        name: 'headingLevel',
        type: 'string',
        required: false,
        description: 'Heading level (h1-h6) for section title',
      },
    ],
    canRenderInline: false,
    canRenderBlock: false,
    requiresDataInstance: false,
    notes: 'Wrapper component - children are extracted and flattened. Section metadata (id, title, headingLevel) is added to all child blocks via _section field for programmatic targeting.',
  },

  // ============================================================
  // BLOCK COMPONENTS - Standalone content blocks (22 components)
  // ============================================================

  // --- Core Content Blocks ---

  ImageBlock: {
    mdxName: 'ImageBlock',
    payloadBlockSlug: 'image',
    payloadBlockPath: 'src/lexical/blocks/ImageBlock.ts',
    componentType: 'block',
    status: 'implemented',
    fields: [
      {
        name: 'image',
        type: 'relationship',
        required: true,
        description: 'Image upload (relationTo: media)',
      },
      {
        name: 'alt',
        type: 'string',
        required: false,
        description: 'Alternative text for accessibility',
      },
      {
        name: 'caption',
        type: 'string',
        required: false,
        description: 'Optional image caption',
      },
    ],
    canRenderInline: false,
    canRenderBlock: true,
    notes: 'Standard image block with media relationship',
  },

  // --- Interactive/Data Components ---

  RatesTable: {
    mdxName: 'RatesTable',
    astroComponentPath: 'src/components/wp-shortcodes/RatesTable.astro',
    payloadBlockSlug: 'ratesTable',
    payloadBlockPath: 'src/lexical/blocks/RatesTableBlock.ts',
    componentType: 'block',
    status: 'implemented',
    usageCount: 1149,
    fields: [
      { name: 'state', type: 'string', defaultValue: 'TX' },
      { name: 'city', type: 'string' },
      { name: 'zipcode', type: 'string' },
      { name: 'useCityAsFilter', type: 'string' },
      { name: 'showUtility', type: 'string' },
      { name: 'showProvider', type: 'string' },
      { name: 'provider', type: 'string' },
      { name: 'utility', type: 'string' },
      { name: 'excludeProviders', type: 'string' },
      { name: 'priceUnit', type: 'string', defaultValue: 'cent' },
      { name: 'pricingBasedOn', type: 'string', defaultValue: '1000' },
      { name: 'tableMaxWidth', type: 'string', defaultValue: '800px' },
      { name: 'linkPlanToPopup', type: 'string' },
      { name: 'textAfterTable', type: 'string' },
      { name: 'appendTableExtras', type: 'string' },
      { name: 'headingWrapperTag', type: 'string', defaultValue: 'h2' },
    ],
    canRenderInline: false,
    canRenderBlock: true,
    notes: 'Electricity plan comparison table from ComparePower API. 15 configurable fields.',
  },

  ProviderCard: {
    mdxName: 'ProviderCard',
    astroComponentPath: 'src/components/provider-card/ProviderCard.astro',
    payloadBlockSlug: 'providerCard',
    payloadBlockPath: 'src/lexical/blocks/ProviderCardBlock.ts',
    componentType: 'block',
    status: 'implemented',
    fields: [],
    canRenderInline: false,
    canRenderBlock: true,
    notes: 'Displays provider information card. TODO: Add detailed field definitions.',
  },

  ProvidersPhoneTable: {
    mdxName: 'ProvidersPhoneTable',
    astroComponentPath: 'src/components/providers-phone-table/ProvidersPhoneTable.astro',
    payloadBlockSlug: 'providersPhoneTable',
    payloadBlockPath: 'src/lexical/blocks/ProvidersPhoneTableBlock.ts',
    componentType: 'block',
    status: 'implemented',
    fields: [],
    canRenderInline: false,
    canRenderBlock: true,
    notes: 'Table of provider phone numbers. TODO: Add detailed field definitions.',
  },

  PopularCitiesList: {
    mdxName: 'PopularCitiesList',
    astroComponentPath: 'src/components/wp-shortcodes/PopularCitiesList.astro',
    payloadBlockSlug: 'popularCitiesList',
    payloadBlockPath: 'src/lexical/blocks/PopularCitiesListBlock.ts',
    componentType: 'block',
    status: 'implemented',
    fields: [
      { name: 'state', type: 'string', defaultValue: 'TX', description: 'State code (e.g., TX)' },
      { name: 'limit', type: 'string', defaultValue: '40', description: 'Maximum number of cities to display' },
    ],
    canRenderInline: false,
    canRenderBlock: true,
    notes: 'Displays list of popular cities for a given state',
  },

  PopularZipcodes: {
    mdxName: 'PopularZipcodes',
    astroComponentPath: 'src/components/popular-zipcodes/PopularZipcodes.astro',
    payloadBlockSlug: 'popularZipcodes',
    payloadBlockPath: 'src/lexical/blocks/PopularZipcodesBlock.ts',
    componentType: 'block',
    status: 'implemented',
    fields: [],
    canRenderInline: false,
    canRenderBlock: true,
    notes: 'Displays list of popular zipcodes. TODO: Add detailed field definitions.',
  },

  ZipcodeSearchbar: {
    mdxName: 'ZipcodeSearchbar',
    astroComponentPath: 'src/components/wp-shortcodes/ZipcodeSearchbar.astro',
    payloadBlockSlug: 'zipcodeSearchbar',
    payloadBlockPath: 'src/lexical/blocks/ZipcodeSearchbarBlock.ts',
    componentType: 'block',
    status: 'implemented',
    usageCount: 882,
    fields: [
      { name: 'buttonText', type: 'string', description: 'Search button text' },
      { name: 'buttontext', type: 'string', description: 'Legacy lowercase variant' },
      { name: 'prependText', type: 'string', description: 'Text above search bar' },
      { name: 'prepend_text', type: 'string', description: 'Legacy snake_case variant' },
      { name: 'placeholder', type: 'string', description: 'Input placeholder text' },
      { name: 'useAddressSearch', type: 'boolean', description: 'Use address search instead of zipcode' },
      { name: 'initialZipcode', type: 'string', description: 'Pre-fill zipcode' },
      { name: 'zipcode', type: 'string', description: 'Zipcode filter' },
      { name: 'classname', type: 'string', description: 'CSS class name' },
    ],
    canRenderInline: false,
    canRenderBlock: true,
    notes: 'Zipcode search widget with 9 configurable fields including legacy WordPress variants',
  },

  UtilitySearchCTAInline: {
    mdxName: 'UtilitySearchCTAInline',
    astroComponentPath: 'src/components/utility-search-cta/UtilitySearchCTAInline.astro',
    payloadBlockSlug: 'utilitySearchCTAInline',
    payloadBlockPath: 'src/lexical/blocks/UtilitySearchCTAInlineBlock.ts',
    componentType: 'block',
    status: 'implemented',
    fields: [],
    canRenderInline: false,
    canRenderBlock: true,
    notes: 'Call-to-action for utility search. TODO: Add detailed field definitions.',
  },

  FaqRankMath: {
    mdxName: 'FaqRankMath',
    astroComponentPath: 'src/components/wp-kadence-rm/FaqRankMath.astro',
    payloadBlockSlug: 'faqRankMath',
    payloadBlockPath: 'src/lexical/blocks/FaqRankMathBlock.ts',
    componentType: 'block',
    status: 'implemented',
    usageCount: 882,
    fields: [
      { name: 'questions', type: 'array', description: 'Array of FAQ question objects' },
      { name: 'titleWrapper', type: 'string', defaultValue: 'h3', description: 'HTML tag for titles' },
      { name: 'className', type: 'string', description: 'CSS class name' },
    ],
    canRenderInline: false,
    canRenderBlock: true,
    notes: 'FAQ block with schema markup. Questions stored as JSON array.',
  },

  TocRankMath: {
    mdxName: 'TocRankMath',
    astroComponentPath: 'src/components/wp-kadence-rm/TocRankMath.astro',
    payloadBlockSlug: 'tocRankMath',
    payloadBlockPath: 'src/lexical/blocks/TocRankMathBlock.ts',
    componentType: 'block',
    status: 'implemented',
    fields: [],
    canRenderInline: false,
    canRenderBlock: true,
    notes: 'Table of contents block. TODO: Add detailed field definitions.',
  },

  HelpMeChoose: {
    mdxName: 'HelpMeChoose',
    astroComponentPath: 'src/components/help-me-choose/HelpMeChoose.astro',
    payloadBlockSlug: 'helpMeChoose',
    payloadBlockPath: 'src/lexical/blocks/HelpMeChooseBlock.ts',
    componentType: 'block',
    status: 'implemented',
    fields: [],
    canRenderInline: false,
    canRenderBlock: true,
    notes: 'Interactive electricity plan selection wizard. TODO: Add detailed field definitions.',
  },

  VcBasicGrid: {
    mdxName: 'VcBasicGrid',
    astroComponentPath: 'src/components/visual-composer/VcBasicGrid.astro',
    payloadBlockSlug: 'vcBasicGrid',
    payloadBlockPath: 'src/lexical/blocks/VcBasicGridBlock.ts',
    componentType: 'block',
    status: 'implemented',
    fields: [],
    canRenderInline: false,
    canRenderBlock: true,
    notes: 'Visual Composer grid layout. TODO: Add detailed field definitions.',
  },

  AdvisorPostsTabs: {
    mdxName: 'AdvisorPostsTabs',
    astroComponentPath: 'src/components/advisor-posts-tabs/AdvisorPostsTabs.astro',
    payloadBlockSlug: 'advisorPostsTabs',
    payloadBlockPath: 'src/lexical/blocks/AdvisorPostsTabsBlock.ts',
    componentType: 'block',
    status: 'implemented',
    fields: [],
    canRenderInline: false,
    canRenderBlock: true,
    notes: 'Tabbed interface for advisor blog posts. TODO: Add detailed field definitions.',
  },

  // --- WordPress Legacy Blocks ---

  WpBlock59853_EnergySavingsArticles: {
    mdxName: 'WpBlock59853_EnergySavingsArticles',
    astroComponentPath: 'src/components/wp-blocks/WpBlock59853_EnergySavingsArticles.astro',
    payloadBlockSlug: 'wpBlock59853_EnergySavingsArticles',
    payloadBlockPath: 'src/lexical/blocks/WpBlock59853_EnergySavingsArticlesBlock.ts',
    componentType: 'block',
    status: 'implemented',
    wpBlockId: 59853,
    wpBlockName: 'energy-savings-articles',
    usageCount: 882,
    fields: [],
    canRenderInline: false,
    canRenderBlock: true,
    notes: 'Filterable grid of energy savings articles. Static component with no configuration.',
  },

  WpBlock61154_Feedback: {
    mdxName: 'WpBlock61154_Feedback',
    astroComponentPath: 'src/components/wp-blocks/WpBlock61154_Feedback.astro',
    payloadBlockSlug: 'wpBlock61154_Feedback',
    payloadBlockPath: 'src/lexical/blocks/WpBlock61154_FeedbackBlock.ts',
    componentType: 'block',
    status: 'implemented',
    wpBlockId: 61154,
    fields: [],
    canRenderInline: false,
    canRenderBlock: true,
    notes: 'User feedback widget. TODO: Add detailed field definitions.',
  },

  WpBlock61258_EzAuthorBox: {
    mdxName: 'WpBlock61258_EzAuthorBox',
    astroComponentPath: 'src/components/wp-blocks/WpBlock61258_EzAuthorBox.astro',
    payloadBlockSlug: 'wpBlock61258_EzAuthorBox',
    payloadBlockPath: 'src/lexical/blocks/WpBlock61258_EzAuthorBoxBlock.ts',
    componentType: 'block',
    status: 'implemented',
    wpBlockId: 61258,
    fields: [],
    canRenderInline: false,
    canRenderBlock: true,
    notes: 'Author bio box component. TODO: Add detailed field definitions.',
  },

  WpBlock61260_EzAuthorBoxCopy: {
    mdxName: 'WpBlock61260_EzAuthorBoxCopy',
    astroComponentPath: 'src/components/wp-blocks/WpBlock61260_EzAuthorBoxCopy.astro',
    payloadBlockSlug: 'wpBlock61260_EzAuthorBoxCopy',
    payloadBlockPath: 'src/lexical/blocks/WpBlock61260_EzAuthorBoxCopyBlock.ts',
    componentType: 'block',
    status: 'implemented',
    wpBlockId: 61260,
    fields: [],
    canRenderInline: false,
    canRenderBlock: true,
    notes: 'Author bio box variant. TODO: Add detailed field definitions.',
  },

  WpBlock61277_EzAuthorBoxCopy2: {
    mdxName: 'WpBlock61277_EzAuthorBoxCopy2',
    astroComponentPath: 'src/components/wp-blocks/WpBlock61277_EzAuthorBoxCopy2.astro',
    payloadBlockSlug: 'wpBlock61277_EzAuthorBoxCopy2',
    payloadBlockPath: 'src/lexical/blocks/WpBlock61277_EzAuthorBoxCopy2Block.ts',
    componentType: 'block',
    status: 'implemented',
    wpBlockId: 61277,
    fields: [],
    canRenderInline: false,
    canRenderBlock: true,
    notes: 'Author bio box variant 2. TODO: Add detailed field definitions.',
  },

  WpBlock77727_CpVideoPopup: {
    mdxName: 'WpBlock77727_CpVideoPopup',
    astroComponentPath: 'src/components/wp-blocks/WpBlock77727_CpVideoPopup.astro',
    payloadBlockSlug: 'wpBlock77727_CpVideoPopup',
    payloadBlockPath: 'src/lexical/blocks/WpBlock77727_CpVideoPopupBlock.ts',
    componentType: 'block',
    status: 'implemented',
    wpBlockId: 77727,
    fields: [],
    canRenderInline: false,
    canRenderBlock: true,
    notes: 'Video popup modal component. TODO: Add detailed field definitions.',
  },

  WpBlock81492_ChooseBestElectricCompany: {
    mdxName: 'WpBlock81492_ChooseBestElectricCompany',
    astroComponentPath: 'src/components/wp-blocks/WpBlock81492_ChooseBestElectricCompany.astro',
    payloadBlockSlug: 'wpBlock81492_ChooseBestElectricCompany',
    payloadBlockPath: 'src/lexical/blocks/WpBlock81492_ChooseBestElectricCompanyBlock.ts',
    componentType: 'block',
    status: 'implemented',
    wpBlockId: 81492,
    fields: [],
    canRenderInline: false,
    canRenderBlock: true,
    notes: 'Electric company selection guide. TODO: Add detailed field definitions.',
  },

  WpBlock84548_TestimonialEasy: {
    mdxName: 'WpBlock84548_TestimonialEasy',
    astroComponentPath: 'src/components/wp-blocks/WpBlock84548_TestimonialEasy.astro',
    payloadBlockSlug: 'wpBlock84548_TestimonialEasy',
    payloadBlockPath: 'src/lexical/blocks/WpBlock84548_TestimonialEasyBlock.ts',
    componentType: 'block',
    status: 'implemented',
    wpBlockId: 84548,
    fields: [],
    canRenderInline: false,
    canRenderBlock: true,
    notes: 'Customer testimonial display. TODO: Add detailed field definitions.',
  },

  WpBlock94368_TrustCpDropdown: {
    mdxName: 'WpBlock94368_TrustCpDropdown',
    astroComponentPath: 'src/components/wp-blocks/WpBlock94368_TrustCpDropdown.astro',
    payloadBlockSlug: 'wpBlock94368_TrustCpDropdown',
    payloadBlockPath: 'src/lexical/blocks/WpBlock94368_TrustCpDropdownBlock.ts',
    componentType: 'block',
    status: 'implemented',
    wpBlockId: 94368,
    fields: [],
    canRenderInline: false,
    canRenderBlock: true,
    notes: 'Trust badges dropdown component. TODO: Add detailed field definitions.',
  },

  EiaMonth: {
    mdxName: 'EiaMonth',
    payloadBlockSlug: 'eiaMonth',
    payloadBlockPath: 'src/lexical/blocks/EiaMonthBlock.ts',
    componentType: 'block',
    status: 'placeholder',
    fields: [],
    canRenderInline: false,
    canRenderBlock: true,
    notes: 'Added via Component Mapper UI. TODO: Add field definitions and implement block.',
  },

  WpBlock60290_AvgTexasResidentialRate: {
    mdxName: 'WpBlock60290_AvgTexasResidentialRate',
    payloadBlockSlug: 'wpBlock60290_AvgTexasResidentialRate',
    payloadBlockPath: 'src/lexical/blocks/WpBlock60290_AvgTexasResidentialRateBlock.ts',
    componentType: 'block',
    status: 'placeholder',
    fields: [],
    canRenderInline: false,
    canRenderBlock: true,
    notes: 'Added via Component Mapper UI. TODO: Add field definitions and implement block.',
  },

  WpBlock60291_AvgTexasCommercialRate: {
    mdxName: 'WpBlock60291_AvgTexasCommercialRate',
    payloadBlockSlug: 'wpBlock60291_AvgTexasCommercialRate',
    payloadBlockPath: 'src/lexical/blocks/WpBlock60291_AvgTexasCommercialRateBlock.ts',
    componentType: 'block',
    status: 'placeholder',
    fields: [],
    canRenderInline: false,
    canRenderBlock: true,
    notes: 'Added via Component Mapper UI. TODO: Add field definitions and implement block.',
  },

  EiaRatesChart: {
    mdxName: 'EiaRatesChart',
    payloadBlockSlug: 'eiaRatesChart',
    payloadBlockPath: 'src/lexical/blocks/EiaRatesChartBlock.ts',
    componentType: 'block',
    status: 'placeholder',
    fields: [],
    canRenderInline: false,
    canRenderBlock: true,
    notes: 'Added via Component Mapper UI. TODO: Add field definitions and implement block.',
  },

  WpBlock66341_CityPageFaqNonRm: {
    mdxName: 'WpBlock66341_CityPageFaqNonRm',
    payloadBlockSlug: 'wpBlock66341_CityPageFaqNonRm',
    payloadBlockPath: 'src/lexical/blocks/WpBlock66341_CityPageFaqNonRmBlock.ts',
    componentType: 'block',
    status: 'placeholder',
    fields: [],
    canRenderInline: false,
    canRenderBlock: true,
    notes: 'Added via Component Mapper UI. TODO: Add field definitions and implement block.',
  },

  Image: {
    mdxName: 'Image',
    payloadBlockSlug: 'image',
    payloadBlockPath: 'src/lexical/blocks/ImageBlock.ts',
    componentType: 'block',
    status: 'placeholder',
    fields: [],
    canRenderInline: false,
    canRenderBlock: true,
    notes: 'Added via Component Mapper UI. TODO: Add field definitions and implement block.',
  },

  AssetManager: {
    mdxName: 'AssetManager',
    payloadBlockSlug: 'mediaBlock',
    payloadBlockPath: 'src/blocks/MediaBlock/config.ts',
    componentType: 'block',
    canRenderInline: true,
    status: 'implemented',
    fields: [
      {
        name: 'id',
        type: 'string',
        required: true,
        description: 'Asset ID from Astro assets.config.ts (e.g., "image-texas-electricity-abilene")',
      },
      {
        name: 'alt',
        type: 'string',
        required: false,
        description: 'Alt text override (falls back to asset config)',
      },
    ],
    canRenderInline: false,
    canRenderBlock: true,
    notes: 'Astro AssetManager component - resolves asset from Astro config and uploads to Payload Media collection. Maps to mediaBlock with uploaded image.',
  },
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

/**
 * Get component mapping by MDX name
 *
 * @param mdxName - The component name from MDX (e.g., "RatesTable")
 * @returns ComponentMapping object or undefined if not found
 *
 * @example
 * const mapping = getComponentMapping('ReliantPhoneNumber')
 * if (mapping) {
 *   console.log(mapping.payloadBlockSlug) // 'reliantPhoneNumber'
 * }
 */
export function getComponentMapping(mdxName: string): ComponentMapping | undefined {
  return COMPONENT_REGISTRY[mdxName]
}

/**
 * Check if component is fully implemented
 *
 * @param mdxName - The component name from MDX
 * @returns true if component status is 'implemented', false otherwise
 *
 * @example
 * if (!isComponentImplemented('EiaMonth')) {
 *   throw new Error('Component not implemented')
 * }
 */
export function isComponentImplemented(mdxName: string): boolean {
  const mapping = COMPONENT_REGISTRY[mdxName]
  return mapping?.status === 'implemented'
}

/**
 * Validation result for component validation
 */
export interface ComponentValidationResult {
  valid: boolean
  error?: string
  mapping?: ComponentMapping
}

/**
 * Validate component during migration with detailed error messages
 *
 * @param mdxName - The component name from MDX
 * @param props - Component props from MDX
 * @returns Validation result with error details if invalid
 *
 * @example
 * const result = validateComponent('RatesTable', { provider: 'reliant' })
 * if (!result.valid) {
 *   console.error(result.error)
 *   console.log('TODOs:', result.mapping?.todos)
 * }
 */
export function validateComponent(
  mdxName: string,
  props: Record<string, any> = {}
): ComponentValidationResult {
  const mapping = COMPONENT_REGISTRY[mdxName]

  // Component not in registry
  if (!mapping) {
    return {
      valid: false,
      error: `Unknown component: <${mdxName} />. This component is not registered in the Component Registry.`,
    }
  }

  // Component not implemented
  if (mapping.status === 'needs-work') {
    return {
      valid: false,
      error: `Component <${mdxName} /> is not yet implemented. Status: needs-work`,
      mapping,
    }
  }

  // Component deprecated
  if (mapping.status === 'deprecated') {
    return {
      valid: false,
      error: `Component <${mdxName} /> is deprecated and should not be used.`,
      mapping,
    }
  }

  // Placeholder component
  if (mapping.status === 'placeholder') {
    console.warn(
      `⚠️  Component <${mdxName} /> is a placeholder (no frontend component yet). Migration will succeed but rendering may fail.`
    )
  }

  // Component is valid
  return {
    valid: true,
    mapping,
  }
}

/**
 * Get Payload block slug for MDX component (handles aliases)
 *
 * @param mdxName - The component name from MDX
 * @returns Payload block slug or null if not found
 *
 * @example
 * const slug = getPayloadBlockSlug('WpBlock75232_EnergySavingsArticlesCopy')
 * // Returns: 'wpBlock59853_EnergySavingsArticles' (resolved alias)
 */
export function getPayloadBlockSlug(mdxName: string): string | null {
  const mapping = COMPONENT_REGISTRY[mdxName]

  if (!mapping) {
    return null
  }

  // Handle alias components
  if (mapping.status === 'alias' && mapping.aliasOf) {
    // Recursively resolve alias
    return getPayloadBlockSlug(mapping.aliasOf)
  }

  return mapping.payloadBlockSlug
}

/**
 * Get all components with a specific status
 *
 * @param status - Component status to filter by
 * @returns Array of ComponentMapping objects matching the status
 *
 * @example
 * const needsWork = getComponentsByStatus('needs-work')
 * console.log(`${needsWork.length} components need implementation`)
 */
export function getComponentsByStatus(status: ComponentStatus): ComponentMapping[] {
  return Object.values(COMPONENT_REGISTRY).filter(
    (mapping) => mapping.status === status
  )
}

/**
 * Get all components that need implementation
 *
 * @returns Array of ComponentMapping objects with status 'needs-work'
 *
 * @example
 * const unmapped = getUnmappedComponents()
 * unmapped.forEach(c => {
 *   console.log(`${c.mdxName}: ${c.todos?.join(', ')}`)
 * })
 */
export function getUnmappedComponents(): ComponentMapping[] {
  return getComponentsByStatus('needs-work')
}

/**
 * Generate markdown report of implementation status
 *
 * @returns Markdown-formatted implementation report
 *
 * @example
 * const report = generateImplementationReport()
 * fs.writeFileSync('migration/IMPLEMENTATION-REPORT.md', report)
 */
export function generateImplementationReport(): string {
  const allComponents = Object.values(COMPONENT_REGISTRY)

  // Count by status
  const statusCounts = {
    implemented: getComponentsByStatus('implemented').length,
    placeholder: getComponentsByStatus('placeholder').length,
    'needs-work': getComponentsByStatus('needs-work').length,
    deprecated: getComponentsByStatus('deprecated').length,
    alias: getComponentsByStatus('alias').length,
  }

  // Count by type
  const typeCounts = {
    block: allComponents.filter(c => c.componentType === 'block').length,
    inline: allComponents.filter(c => c.componentType === 'inline').length,
    wrapper: allComponents.filter(c => c.componentType === 'wrapper').length,
  }

  // Calculate total usage
  const totalUsage = allComponents.reduce((sum, c) => sum + (c.usageCount || 0), 0)

  // Build report sections
  const sections: string[] = []

  // Header
  sections.push('# Component Implementation Report')
  sections.push('')
  sections.push(`**Generated**: ${new Date().toISOString()}`)
  sections.push('')

  // Summary
  sections.push('## Summary')
  sections.push('')
  sections.push(`- **Total Components**: ${allComponents.length}`)
  sections.push(`- **Implemented**: ${statusCounts.implemented}`)
  sections.push(`- **Placeholder**: ${statusCounts.placeholder}`)
  sections.push(`- **Needs Work**: ${statusCounts['needs-work']}`)
  sections.push(`- **Deprecated**: ${statusCounts.deprecated}`)
  sections.push(`- **Aliases**: ${statusCounts.alias}`)
  sections.push('')
  sections.push('### By Type')
  sections.push(`- **Block Components**: ${typeCounts.block}`)
  sections.push(`- **Inline Components**: ${typeCounts.inline}`)
  sections.push(`- **Wrapper Components**: ${typeCounts.wrapper}`)
  sections.push('')
  sections.push(`### Total MDX Usage`)
  sections.push(`- **${totalUsage.toLocaleString()}** occurrences across all components`)
  sections.push('')

  // Implementation progress
  const implementedPercent = ((statusCounts.implemented / allComponents.length) * 100).toFixed(1)
  sections.push('### Implementation Progress')
  sections.push(`**${implementedPercent}%** of components fully implemented`)
  sections.push('')

  // Needs Work section
  const needsWork = getComponentsByStatus('needs-work')
  if (needsWork.length > 0) {
    sections.push('## Needs Work')
    sections.push('')
    sections.push(`${needsWork.length} components require implementation:`)
    sections.push('')

    // Sort by usage count (highest first)
    needsWork.sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))

    needsWork.forEach((component) => {
      sections.push(`### ${component.mdxName}`)
      sections.push(`- **Usage**: ${component.usageCount || 0} times`)
      sections.push(`- **Type**: ${component.componentType}`)
      sections.push(`- **Payload Slug**: ${component.payloadBlockSlug}`)

      if (component.notes) {
        sections.push(`- **Notes**: ${component.notes}`)
      }

      if (component.todos && component.todos.length > 0) {
        sections.push('- **TODOs**:')
        component.todos.forEach((todo) => {
          sections.push(`  - [ ] ${todo}`)
        })
      }
      sections.push('')
    })
  }

  // Deprecated section
  const deprecated = getComponentsByStatus('deprecated')
  if (deprecated.length > 0) {
    sections.push('## Deprecated Components')
    sections.push('')
    deprecated.forEach((component) => {
      sections.push(`### ${component.mdxName}`)
      sections.push(`- **Usage**: ${component.usageCount || 0} times`)
      sections.push(`- **Notes**: ${component.notes || 'No notes'}`)
      sections.push('')
    })
  }

  // Implemented section (summary only, full details would be too long)
  sections.push('## Fully Implemented')
  sections.push('')
  sections.push(`${statusCounts.implemented} components are fully implemented and ready for use.`)
  sections.push('')

  // High-usage components
  const highUsage = allComponents
    .filter(c => (c.usageCount || 0) > 500)
    .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))

  if (highUsage.length > 0) {
    sections.push('## High-Usage Components')
    sections.push('')
    sections.push('Components used more than 500 times:')
    sections.push('')
    highUsage.forEach((component) => {
      sections.push(`- **${component.mdxName}**: ${component.usageCount} uses (${component.status})`)
    })
    sections.push('')
  }

  return sections.join('\n')
}
