/**
 * Component to Provider Mapping
 *
 * Maps MDX phone number component names to ProviderMetadata names.
 *
 * This allows the migration to automatically link DynamicInlineBlocks
 * to their corresponding providers.
 */

export interface ComponentProviderMapping {
  componentName: string
  providerName: string
  category: 'phone'
  description?: string
}

/**
 * Phone number component to provider name mapping
 *
 * Component names come from Astro MDX (e.g., <FourChangePhoneNumber />)
 * Provider names must match ProviderMetadata.name exactly
 */
export const PHONE_COMPONENT_TO_PROVIDER: Record<string, string> = {
  // 4Change Energy
  'FourChangePhoneNumber': '4Change Energy',
  '4ChangePhoneNumber': '4Change Energy',

  // Amigo Energy
  'AmigoPhoneNumber': 'Amigo Energy',
  'AmigoEnergyPhoneNumber': 'Amigo Energy',

  // Cirro Energy
  'CirroPhoneNumber': 'Cirro Energy',
  'CirroEnergyPhoneNumber': 'Cirro Energy',

  // Constellation
  'ConstellationPhoneNumber': 'Constellation',

  // Direct Energy
  'DirectPhoneNumber': 'Direct Energy',
  'DirectEnergyPhoneNumber': 'Direct Energy',

  // Discount Power
  'DiscountPhoneNumber': 'Discount Power',
  'DiscountPowerPhoneNumber': 'Discount Power',

  // Flagship Power
  'FlagshipPhoneNumber': 'Flagship Power',
  'FlagshipPowerPhoneNumber': 'Flagship Power',

  // Frontier Utilities
  'FrontierPhoneNumber': 'Frontier Utilities',
  'FrontierUtilitiesPhoneNumber': 'Frontier Utilities',
  'FrontierPhoneNumberLinkRc': 'Frontier Utilities',

  // Gexa Energy
  'GexaPhoneNumber': 'Gexa Energy',
  'GexaEnergyPhoneNumber': 'Gexa Energy',

  // Green Mountain
  'GreenMountainPhoneNumber': 'Green Mountain',

  // Just Energy
  'JustPhoneNumber': 'Just Energy',
  'JustEnergyPhoneNumber': 'Just Energy',

  // New Power Texas
  'NewPowerPhoneNumber': 'New Power Texas',
  'NewPowerTexasPhoneNumber': 'New Power Texas',

  // Payless Power
  'PaylessPhoneNumber': 'Payless Power',
  'PaylessPowerPhoneNumber': 'Payless Power',

  // Pulse Power
  'PulsePhoneNumber': 'Pulse Power',
  'PulsePowerPhoneNumber': 'Pulse Power',

  // Reliant
  'ReliantPhoneNumber': 'Reliant',

  // Rhythm Energy
  'RhythmPhoneNumber': 'Rhythm Energy',
  'RhythmEnergyPhoneNumber': 'Rhythm Energy',

  // Tara Energy
  'TaraPhoneNumber': 'Tara Energy',
  'TaraEnergyPhoneNumber': 'Tara Energy',

  // TXU Energy
  'TxuPhoneNumber': 'TXU Energy',
  'TXUPhoneNumber': 'TXU Energy',
  'TxuEnergyPhoneNumber': 'TXU Energy',
}

/**
 * Get provider name from component name
 *
 * @param componentName - Name of the MDX component (e.g., "FourChangePhoneNumber")
 * @returns Provider name or undefined if not found
 */
export function getProviderFromComponent(componentName: string): string | undefined {
  return PHONE_COMPONENT_TO_PROVIDER[componentName]
}

/**
 * Generate slug for inline block instance
 *
 * @param componentName - Component name
 * @param providerName - Provider name
 * @returns Slug for the inline block instance
 */
export function generateInlineBlockSlug(
  componentName: string,
  providerName: string
): string {
  // Convert provider name to short slug (first part only)
  // "4Change Energy" → "4change"
  // "TXU Energy" → "txu"
  const providerSlug = providerName
    .split(' ')[0]  // Take first word
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')

  // Extract type from component name (e.g., "phone" from "FourChangePhoneNumber")
  // Keep it simple - just "phone" for phone numbers
  const type = componentName.toLowerCase().includes('phone') ? 'phone' : 'data'

  return `${providerSlug}-${type}`
}

/**
 * Generate display name for inline block instance
 *
 * @param componentName - Component name
 * @param providerName - Provider name
 * @returns Display name for the inline block
 */
export function generateInlineBlockName(
  componentName: string,
  providerName: string
): string {
  // Extract type from component name
  if (componentName.includes('PhoneNumber')) {
    return `${providerName} Phone Number`
  }

  return `${providerName} - ${componentName}`
}

/**
 * Validate provider exists in ProviderMetadata
 *
 * Returns true if provider can be mapped, false otherwise.
 * Logs warning if component has no mapping.
 *
 * @param componentName - Component name to check
 * @returns Whether provider mapping exists
 */
export function hasProviderMapping(componentName: string): boolean {
  const provider = getProviderFromComponent(componentName)

  if (!provider) {
    console.warn(`⚠️  No provider mapping for component: ${componentName}`)
    return false
  }

  return true
}

/**
 * Get all mapped provider names
 *
 * Returns unique list of provider names that have component mappings.
 * Useful for validation.
 *
 * @returns Array of unique provider names
 */
export function getMappedProviders(): string[] {
  const providers = Object.values(PHONE_COMPONENT_TO_PROVIDER)
  return [...new Set(providers)].sort()
}
