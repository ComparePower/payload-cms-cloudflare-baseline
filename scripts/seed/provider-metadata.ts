#!/usr/bin/env tsx
/**
 * Seed ProviderMetadata from ComparePower Pricing API
 *
 * Fetches all brands/providers from the pricing API and creates
 * ProviderMetadata records as the central registry.
 *
 * Usage:
 *   ./scripts/doppler-run.sh dev pnpm tsx scripts/seed/provider-metadata.ts
 *   ./scripts/doppler-run.sh dev pnpm tsx scripts/seed/provider-metadata.ts --dry-run
 *   ./scripts/doppler-run.sh dev pnpm tsx scripts/seed/provider-metadata.ts --purge
 */

import { getPayload } from 'payload'
import config from '../../src/payload.config'

const PRICING_API_URL = 'https://pricing.api.comparepower.com/api/brands'

interface ApiBrand {
  _id: string
  name: string
  [key: string]: any  // Other API fields
}

interface SeedStats {
  total: number
  created: number
  updated: number
  skipped: number
  failed: number
  errors: Array<{ provider: string; error: string }>
}

async function fetchProvidersFromAPI(): Promise<ApiBrand[]> {
  console.log(`🌐 Fetching providers from: ${PRICING_API_URL}\n`)

  try {
    const response = await fetch(PRICING_API_URL, {
      headers: {
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()

    // The API might return an array directly or an object with data property
    const brands = Array.isArray(data) ? data : data.brands || data.data || []

    console.log(`✅ Fetched ${brands.length} providers from API\n`)

    return brands
  } catch (error: any) {
    console.error(`❌ Failed to fetch providers from API: ${error.message}`)
    throw error
  }
}

/**
 * Sanitize email addresses from API
 * - Trim whitespace
 * - Remove internal spaces
 * - Return undefined if invalid format
 */
function sanitizeEmail(email: string | undefined): string | undefined {
  if (!email) return undefined

  // Trim and remove all whitespace
  const cleaned = email.trim().replace(/\s+/g, '')

  // Basic email validation
  if (cleaned && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned)) {
    return cleaned
  }

  return undefined
}

async function seedProviderMetadata(dryRun = false, purge = false) {
  console.log('🌱 Seeding ProviderMetadata Collection\n')
  console.log('='.repeat(60))

  if (dryRun) {
    console.log('🔬 DRY RUN MODE - No changes will be made\n')
  }

  const payload = await getPayload({ config })

  const stats: SeedStats = {
    total: 0,
    created: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    errors: []
  }

  try {
    // Fetch providers from API
    const apiBrands = await fetchProvidersFromAPI()
    stats.total = apiBrands.length

    // Purge existing data if requested
    if (purge && !dryRun) {
      console.log('🗑️  Purging existing ProviderMetadata...')

      const { docs } = await payload.find({
        collection: 'providerMetadata',
        limit: 1000
      })

      let deleted = 0
      for (const doc of docs) {
        await payload.delete({
          collection: 'providerMetadata',
          id: doc.id
        })
        deleted++
      }

      console.log(`   ✓ Deleted ${deleted} existing records\n`)
    }

    // Process each provider
    console.log(`📥 Processing ${stats.total} providers...\n`)

    for (let i = 0; i < apiBrands.length; i++) {
      const brand = apiBrands[i]
      const progress = `[${i + 1}/${stats.total}]`

      try {
        // Check if already exists
        const { docs: existing } = await payload.find({
          collection: 'providerMetadata',
          where: {
            cp_provider_id: { equals: brand._id }
          },
          limit: 1
        })

        const providerData = {
          cp_provider_id: brand._id,
          name: brand.name,
          legal_name: brand.legal_name,
          puct_number: brand.puct_number?.toString() || brand.puct_number,
          status: 'active' as const,

          // Operation hours - map each day
          operation_hours: brand.operation_hours ? {
            monday: brand.operation_hours.monday,
            tuesday: brand.operation_hours.tuesday,
            wednesday: brand.operation_hours.wednesday,
            thursday: brand.operation_hours.thursday,
            friday: brand.operation_hours.friday,
            saturday: brand.operation_hours.saturday,
            sunday: brand.operation_hours.sunday,
          } : undefined,

          // Same day cutoff
          same_day_cutoff_time: brand.same_day_cutoff_time,

          // Contact info - sales
          contact_sales: brand.contact_info?.sales ? {
            phone_number: brand.contact_info.sales.phone_number
          } : undefined,

          // Contact info - support
          contact_support: brand.contact_info?.support ? {
            phone_number: brand.contact_info.support.phone_number,
            email: sanitizeEmail(brand.contact_info.support.email),
            address: brand.contact_info.support.address,
            url: brand.contact_info.support.url,
          } : undefined,

          // Contact info - brand
          contact_brand: brand.contact_info?.brand ? {
            phone_number: brand.contact_info.brand.phone_number
          } : undefined,

          // Contact info - comparepower
          contact_comparepower: brand.contact_info?.compare_power ? {
            phone_number: brand.contact_info.compare_power.phone_number
          } : undefined,

          // Contact info - rescission
          contact_rescission: brand.contact_info?.rescission ? {
            phone_number: brand.contact_info.rescission.phone_number,
            email: sanitizeEmail(brand.contact_info.rescission.email),
            address: brand.contact_info.rescission.address,
            fax: brand.contact_info.rescission.fax,
          } : undefined,

          // Contact info - deposit waiver
          contact_deposit_waiver: brand.contact_info?.deposit_waiver ? {
            phone_number: brand.contact_info.deposit_waiver.phone_number
          } : undefined,

          // Configuration
          configuration: brand.configuration ? {
            api_url: brand.configuration.api_url,
            has_credit_check_method: brand.configuration.has_credit_check_method,
            has_payment_method: brand.configuration.has_payment_method,
            compare_usage_prices: brand.configuration.compare_usage_prices,
            compare_document_links: brand.configuration.compare_document_links,
            compare_components: brand.configuration.compare_components,
            send_brand: brand.configuration.send_brand,
            allow_current_address: brand.configuration.allow_current_address,
            allow_drivers_license: brand.configuration.allow_drivers_license,
            social_security_number_required: brand.configuration.social_security_number_required,
            saturday_not_allowed: brand.configuration.saturday_not_allowed,
            hide_phone_number: brand.configuration.hide_phone_number,
            hide_sign_up_button: brand.configuration.hide_sign_up_button,
            window: brand.configuration.window,
          } : undefined,

          // System fields
          api_last_synced: new Date(),

          // slug will be auto-generated from name if not provided
        }

        if (existing.length > 0) {
          // Update existing
          if (dryRun) {
            console.log(`   ${progress} [DRY RUN] Would update: ${brand.name}`)
            stats.updated++
          } else {
            await payload.update({
              collection: 'providerMetadata',
              id: existing[0].id,
              data: providerData
            })
            console.log(`   ${progress} ✓ Updated: ${brand.name}`)
            stats.updated++
          }
        } else {
          // Create new
          if (dryRun) {
            console.log(`   ${progress} [DRY RUN] Would create: ${brand.name}`)
            stats.created++
          } else {
            await payload.create({
              collection: 'providerMetadata',
              data: providerData
            })
            console.log(`   ${progress} ✓ Created: ${brand.name}`)
            stats.created++
          }
        }
      } catch (error: any) {
        console.error(`   ${progress} ❌ Failed: ${brand.name}`)
        console.error(`      Error: ${error.message}`)
        stats.failed++
        stats.errors.push({
          provider: brand.name,
          error: error.message
        })
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60))
    console.log('📊 SUMMARY')
    console.log('='.repeat(60))
    console.log(`Total:   ${stats.total}`)
    console.log(`Created: ${stats.created}`)
    console.log(`Updated: ${stats.updated}`)
    console.log(`Failed:  ${stats.failed}`)
    console.log('='.repeat(60))

    if (stats.errors.length > 0) {
      console.log('\n❌ Errors:')
      stats.errors.forEach(err => {
        console.log(`   - ${err.provider}: ${err.error}`)
      })
    }

    if (stats.failed === 0) {
      console.log('\n✅ All providers seeded successfully!')
    }

    // Verification
    if (!dryRun) {
      console.log('\n🔍 Verifying...')
      const { totalDocs } = await payload.find({
        collection: 'providerMetadata',
        limit: 0
      })
      console.log(`   Total records in database: ${totalDocs}`)
      console.log(`   Expected: ${stats.total - stats.failed}`)

      if (totalDocs === stats.total - stats.failed) {
        console.log('   ✅ Verification passed!')
      } else {
        console.log('   ⚠️  Count mismatch!')
      }
    }

  } catch (error: any) {
    console.error('\n💥 Seeding failed:', error.message)
    process.exit(1)
  }

  process.exit(stats.failed > 0 ? 1 : 0)
}

// Parse command line arguments
const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const purge = args.includes('--purge')

seedProviderMetadata(dryRun, purge).catch(console.error)
