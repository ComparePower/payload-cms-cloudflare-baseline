#!/usr/bin/env tsx
/**
 * Seed UtilityMetadata from ComparePower Pricing API
 *
 * Fetches all TDSPs (Transmission and Distribution Service Providers) from
 * the pricing API and creates UtilityMetadata records as the central registry.
 *
 * Usage:
 *   ./scripts/doppler-run.sh dev pnpm tsx scripts/seed/utility-metadata.ts
 *   ./scripts/doppler-run.sh dev pnpm tsx scripts/seed/utility-metadata.ts --dry-run
 *   ./scripts/doppler-run.sh dev pnpm tsx scripts/seed/utility-metadata.ts --purge
 */

import { getPayload } from 'payload'
import config from '../../src/payload.config'

const PRICING_API_URL = 'https://pricing.api.comparepower.com/api/tdsps'

interface ApiTdsp {
  _id: string
  name: string
  short_name: string
  abbreviation: string
  duns_number: string
  address?: {
    line_1?: string
    line_2?: string
    city?: string
    state?: string
    zip_code?: string
  }
  contact?: {
    name?: string
    email?: string
    phone?: string
    fax?: string
  }
  doe_code?: string
  date_last_modified?: string
  last_modified_by?: string
  fees?: {
    amsr?: {
      standard_move_in?: number
      switch?: number
      self_selected_switch?: number
    }
    amsm?: {
      priority_move_in?: number
      standard_move_in?: number
      switch?: number
      self_selected_switch?: number
    }
    non_standard?: {
      priority_move_in?: number
      standard_move_in?: number
      switch?: number
      self_selected_switch?: number
    }
  }
  [key: string]: any  // Other API fields
}

interface SeedStats {
  total: number
  created: number
  updated: number
  skipped: number
  failed: number
  errors: Array<{ utility: string; error: string }>
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

/**
 * Sanitize phone number
 * - Trim whitespace
 * - Allow common formats: (123) 456-7890, 123-456-7890, 1234567890
 */
function sanitizePhone(phone: string | undefined): string | undefined {
  if (!phone) return undefined
  return phone.trim()
}

async function fetchTdspsFromAPI(): Promise<ApiTdsp[]> {
  console.log(`🌐 Fetching TDSPs from: ${PRICING_API_URL}\n`)

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
    const tdsps = Array.isArray(data) ? data : data.tdsps || data.data || []

    console.log(`✅ Fetched ${tdsps.length} TDSPs from API\n`)

    return tdsps
  } catch (error: any) {
    console.error(`❌ Failed to fetch TDSPs from API: ${error.message}`)
    throw error
  }
}

async function seedUtilityMetadata(dryRun = false, purge = false) {
  console.log('🌱 Seeding UtilityMetadata Collection\n')
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
    // Fetch TDSPs from API
    const apiTdsps = await fetchTdspsFromAPI()
    stats.total = apiTdsps.length

    // Purge existing data if requested
    if (purge && !dryRun) {
      console.log('🗑️  Purging existing UtilityMetadata...')

      const { docs } = await payload.find({
        collection: 'utilityMetadata',
        limit: 1000
      })

      let deleted = 0
      for (const doc of docs) {
        await payload.delete({
          collection: 'utilityMetadata',
          id: doc.id
        })
        deleted++
      }

      console.log(`   ✓ Deleted ${deleted} existing records\n`)
    }

    // Process each TDSP
    console.log(`📥 Processing ${stats.total} TDSPs...\n`)

    for (let i = 0; i < apiTdsps.length; i++) {
      const tdsp = apiTdsps[i]
      const progress = `[${i + 1}/${stats.total}]`

      try {
        // Check if already exists
        const { docs: existing } = await payload.find({
          collection: 'utilityMetadata',
          where: {
            cp_tdsp_id: { equals: tdsp._id }
          },
          limit: 1
        })

        const utilityData = {
          cp_tdsp_id: tdsp._id,
          name: tdsp.name,
          short_name: tdsp.short_name,
          abbreviation: tdsp.abbreviation,
          duns_number: tdsp.duns_number,
          doe_code: tdsp.doe_code,
          status: 'active' as const,

          // Address
          address: tdsp.address ? {
            line_1: tdsp.address.line_1,
            line_2: tdsp.address.line_2,
            city: tdsp.address.city,
            state: tdsp.address.state,
            zip_code: tdsp.address.zip_code,
          } : undefined,

          // Contact
          contact: tdsp.contact ? {
            name: tdsp.contact.name,
            email: sanitizeEmail(tdsp.contact.email),
            phone: sanitizePhone(tdsp.contact.phone),
            fax: sanitizePhone(tdsp.contact.fax),
          } : undefined,

          // Fees
          fees: tdsp.fees ? {
            amsr: tdsp.fees.amsr ? {
              standard_move_in: tdsp.fees.amsr.standard_move_in,
              switch: tdsp.fees.amsr.switch,
              self_selected_switch: tdsp.fees.amsr.self_selected_switch,
            } : undefined,
            amsm: tdsp.fees.amsm ? {
              priority_move_in: tdsp.fees.amsm.priority_move_in,
              standard_move_in: tdsp.fees.amsm.standard_move_in,
              switch: tdsp.fees.amsm.switch,
              self_selected_switch: tdsp.fees.amsm.self_selected_switch,
            } : undefined,
            non_standard: tdsp.fees.non_standard ? {
              priority_move_in: tdsp.fees.non_standard.priority_move_in,
              standard_move_in: tdsp.fees.non_standard.standard_move_in,
              switch: tdsp.fees.non_standard.switch,
              self_selected_switch: tdsp.fees.non_standard.self_selected_switch,
            } : undefined,
          } : undefined,

          // API metadata
          api_metadata: {
            date_last_modified: tdsp.date_last_modified,
            last_modified_by: tdsp.last_modified_by,
          },

          // System fields
          api_last_synced: new Date(),

          // slug will be auto-generated from short_name if not provided
        }

        if (existing.length > 0) {
          // Update existing
          if (dryRun) {
            console.log(`   ${progress} [DRY RUN] Would update: ${tdsp.name}`)
            stats.updated++
          } else {
            await payload.update({
              collection: 'utilityMetadata',
              id: existing[0].id,
              data: utilityData
            })
            console.log(`   ${progress} ✓ Updated: ${tdsp.name}`)
            stats.updated++
          }
        } else {
          // Create new
          if (dryRun) {
            console.log(`   ${progress} [DRY RUN] Would create: ${tdsp.name}`)
            stats.created++
          } else {
            await payload.create({
              collection: 'utilityMetadata',
              data: utilityData
            })
            console.log(`   ${progress} ✓ Created: ${tdsp.name}`)
            stats.created++
          }
        }
      } catch (error: any) {
        console.error(`   ${progress} ❌ Failed: ${tdsp.name}`)
        console.error(`      Error: ${error.message}`)
        stats.failed++
        stats.errors.push({
          utility: tdsp.name,
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
        console.log(`   - ${err.utility}: ${err.error}`)
      })
    }

    if (stats.failed === 0) {
      console.log('\n✅ All TDSPs seeded successfully!')
    }

    // Verification
    if (!dryRun) {
      console.log('\n🔍 Verifying...')
      const { totalDocs } = await payload.find({
        collection: 'utilityMetadata',
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

seedUtilityMetadata(dryRun, purge).catch(console.error)
