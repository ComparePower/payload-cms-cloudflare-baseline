/**
 * AssetManager Props Types
 *
 * Auto-generated from: /Users/brad/_CODE_DEV_PROJECTS/cp-content-site-astro/src/components/common/AssetManager.astro
 * Generated: 2025-10-28T23:09:10.987Z
 *
 * DO NOT EDIT MANUALLY - Run regenerate script if AssetManager changes
 */

interface Props {
  /**
   * Unique asset identifier from the central asset registry
   *
   * @remarks
   * Type-safe with autocomplete - only accepts registered asset IDs
   * from /src/config/assets.config.ts
   *
   * @example "image-team-brad-gregory"
   * @example "logo-comparepower"
   */
  id: AssetId;

  /**
   * Target width in pixels (optional - can be auto-detected from CSS classes)
   *
   * @remarks
   * - If omitted, will attempt to detect from Tailwind classes (w-28, size-48, etc.)
   * - Required for Astro image optimization to work
   * - Tells Astro the max container width to optimize for
   * - Astro will generate 1x and 2x variants based on this width
   *
   * @priority
   * 1. Explicit width prop (if provided)
   * 2. Auto-detected from CSS classes
   * 3. Fallback to asset.width from config
   *
   * @example width={112} // Explicit
   * @example class="w-28" // Auto-detected as 112px
   */
  width?: number | string;

  /**
   * Target height in pixels (optional)
   *
   * @remarks
   * - If omitted, aspect ratio is maintained
   * - Falls back to asset.height from config
   *
   * @example height={112}
   */
  height?: number | string;

  /**
   * Alt text for accessibility
   *
   * @remarks
   * Overrides the alt text from asset config
   * Falls back to asset.alt or asset.name if not provided
   *
   * @example "Brad Gregory - ComparePower Team Member"
   */
  alt?: string;

  /**
   * CSS classes to apply to the image element
   *
   * @remarks
   * - Supports Tailwind utility classes
   * - Automatically parsed for size detection (w-*, h-*, size-*)
   * - Applied to both <Image> and <img> elements
   *
   * @example "w-28 h-28 rounded-full object-cover"
   */
  class?: string;

  /**
   * Image loading strategy
   *
   * @remarks
   * - 'lazy': Load when near viewport (default, best for most images)
   * - 'eager': Load immediately (use for above-the-fold images)
   *
   * @default "lazy"
   */
  loading?: "lazy" | "eager";

  /**
   * Responsive layout mode for image optimization
   *
   * @remarks
   * - 'constrained': Responsive up to max width, generates srcset (best for most cases)
   * - 'full-width': Always fills container, generates many srcset variants (for hero images)
   * - 'fixed': Exact size, no responsive behavior (for icons/logos)
   *
   * @default "constrained"
   *
   * @example layout="constrained" // Avatars, cards, thumbnails
   * @example layout="full-width" // Hero images, banners
   * @example layout="fixed" // Icons, logos
   */
  layout?: "constrained" | "full-width" | "fixed";
}

/**
 * Individual prop types for validation
 */
export const ASSET_MANAGER_PROP_TYPES = {
  "id": {
    "type": "AssetId",
    "optional": false,
    "comment": "/**\n   * Unique asset identifier from the central asset registry\n   *\n   * @remarks\n   * Type-safe with autocomplete - only accepts registered asset IDs\n   * from /src/config/assets.config.ts\n   *\n   * @example \"image-team-brad-gregory\"\n   * @example \"logo-comparepower\"\n   */"
  },
  "width": {
    "type": "number | string",
    "optional": true,
    "comment": "/**\n   * Target width in pixels (optional - can be auto-detected from CSS classes)\n   *\n   * @remarks\n   * - If omitted, will attempt to detect from Tailwind classes (w-28, size-48, etc.)\n   * - Required for Astro image optimization to work\n   * - Tells Astro the max container width to optimize for\n   * - Astro will generate 1x and 2x variants based on this width\n   *\n   * @priority\n   * 1. Explicit width prop (if provided)\n   * 2. Auto-detected from CSS classes\n   * 3. Fallback to asset.width from config\n   *\n   * @example width={112} // Explicit\n   * @example class=\"w-28\" // Auto-detected as 112px\n   */"
  },
  "height": {
    "type": "number | string",
    "optional": true,
    "comment": "/**\n   * Target height in pixels (optional)\n   *\n   * @remarks\n   * - If omitted, aspect ratio is maintained\n   * - Falls back to asset.height from config\n   *\n   * @example height={112}\n   */"
  },
  "alt": {
    "type": "string",
    "optional": true,
    "comment": "/**\n   * Alt text for accessibility\n   *\n   * @remarks\n   * Overrides the alt text from asset config\n   * Falls back to asset.alt or asset.name if not provided\n   *\n   * @example \"Brad Gregory - ComparePower Team Member\"\n   */"
  },
  "class": {
    "type": "string",
    "optional": true,
    "comment": "/**\n   * CSS classes to apply to the image element\n   *\n   * @remarks\n   * - Supports Tailwind utility classes\n   * - Automatically parsed for size detection (w-*, h-*, size-*)\n   * - Applied to both <Image> and <img> elements\n   *\n   * @example \"w-28 h-28 rounded-full object-cover\"\n   */"
  },
  "loading": {
    "type": "\"lazy\" | \"eager\"",
    "optional": true,
    "comment": "/**\n   * Image loading strategy\n   *\n   * @remarks\n   * - 'lazy': Load when near viewport (default, best for most images)\n   * - 'eager': Load immediately (use for above-the-fold images)\n   *\n   * @default \"lazy\"\n   */"
  },
  "layout": {
    "type": "\"constrained\" | \"full-width\" | \"fixed\"",
    "optional": true,
    "comment": "/**\n   * Responsive layout mode for image optimization\n   *\n   * @remarks\n   * - 'constrained': Responsive up to max width, generates srcset (best for most cases)\n   * - 'full-width': Always fills container, generates many srcset variants (for hero images)\n   * - 'fixed': Exact size, no responsive behavior (for icons/logos)\n   *\n   * @default \"constrained\"\n   *\n   * @example layout=\"constrained\" // Avatars, cards, thumbnails\n   * @example layout=\"full-width\" // Hero images, banners\n   * @example layout=\"fixed\" // Icons, logos\n   */"
  }
} as const

/**
 * Type guard to validate AssetManager props at runtime
 */
export function isValidAssetManagerProps(props: any): props is Props {
  if (!props || typeof props !== 'object') return false

  // Required props
  if (!('id' in props)) return false

  // Type validation for provided props
  const validProps = new Set(Object.keys(ASSET_MANAGER_PROP_TYPES))
  for (const key of Object.keys(props)) {
    if (!validProps.has(key)) {
      console.warn(`Unknown AssetManager prop: ${key}`)
      return false
    }
  }

  return true
}

/**
 * Validate props and throw detailed error if invalid
 */
export function validateAssetManagerProps(props: any): asserts props is Props {
  if (!isValidAssetManagerProps(props)) {
    const requiredProps = Object.entries(ASSET_MANAGER_PROP_TYPES)
      .filter(([_, meta]) => !meta.optional)
      .map(([name]) => name)

    const providedProps = Object.keys(props || {})
    const missingRequired = requiredProps.filter(p => !providedProps.includes(p))

    throw new Error(
      `Invalid AssetManager props.\n` +
      `Missing required: [${missingRequired.join(', ')}]\n` +
      `Provided: [${providedProps.join(', ')}]`
    )
  }
}
