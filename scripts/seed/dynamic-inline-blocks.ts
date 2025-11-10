#!/usr/bin/env tsx
/**
 * Seed Dynamic Inline Blocks (RichTextDataInstances)
 *
 * Creates inline block instances for phone numbers and other dynamic data,
 * with proper relationships to ProviderMetadata.
 *
 * This script should be run BEFORE migrating providers, so that the
 * resolve-rich-text-data-slugs script can find the instances.
 *
 * Usage:
 *   ./scripts/doppler-run.sh dev pnpm tsx scripts/seed/dynamic-inline-blocks.ts
 *   ./scripts/doppler-run.sh dev pnpm tsx scripts/seed/dynamic-inline-blocks.ts --purge
 */

import { getPayload } from 'payload'
import config from '../../src/payload.config'
import {
  PHONE_COMPONENT_TO_PROVIDER,
  getProviderFromComponent,
  generateInlineBlockSlug,
  generateInlineBlockName,
  getMappedProviders
} from '../migration/lib/component-to-provider-mapping'

interface SeedStats {
  total: number
  created: number
  updated: number
  failed: number
  errors: Array<{ instance: string; error: string }>
}

/**
 * Get provider ID from ProviderMetadata by name
 */
async function getProviderIdByName(
  payload: any,
  providerName: string
): Promise<string | null> {
  try {
    const { docs } = await payload.find({
      collection: 'providerMetadata',
      where: { name: { equals: providerName } },
      limit: 1
    })

    if (docs.length > 0) {
      return docs[0].id
    }

    return null
  } catch (error) {
    console.error(`   ⚠️  Error finding provider "${providerName}":`, error)
    return null
  }
}

/**
 * Get phone number from provider metadata
 */
async function getProviderPhoneNumber(
  payload: any,
  providerId: string
): Promise<string | null> {
  try {
    const provider = await payload.findByID({
      collection: 'providerMetadata',
      id: providerId
    })

    // Try different phone fields in order of preference
    const phone =
      provider.contact_sales?.phone_number ||
      provider.contact_support?.phone_number ||
      provider.contact_comparepower?.phone_number ||
      provider.contact_brand?.phone_number

    return phone || null
  } catch (error) {
    console.error(`   ⚠️  Error getting phone for provider ${providerId}:`, error)
    return null
  }
}

async function seedDynamicInlineBlocks(purge = false) {
  console.log('🌱 Seeding Dynamic Inline Blocks\n')
  console.log('='.repeat(60))

  const payload = await getPayload({ config })

  const stats: SeedStats = {
    total: 0,
    created: 0,
    updated: 0,
    failed: 0,
    errors: []
  }

  try {
    // Purge existing data if requested
    if (purge) {
      console.log('🗑️  Purging existing inline blocks...')

      const { docs } = await payload.find({
        collection: 'richTextDataInstances',
        limit: 1000
      })

      let deleted = 0
      for (const doc of docs) {
        await payload.delete({
          collection: 'richTextDataInstances',
          id: doc.id
        })
        deleted++
      }

      console.log(`   ✓ Deleted ${deleted} existing records\n`)
    }

    // Get all unique component names
    const componentNames = Object.keys(PHONE_COMPONENT_TO_PROVIDER)
    stats.total = componentNames.length

    console.log(`📥 Processing ${stats.total} phone number components...\n`)

    // Build provider ID cache
    console.log('🔍 Building provider ID cache...\n')
    const providerIdCache = new Map<string, string>()

    for (const providerName of getMappedProviders()) {
      const providerId = await getProviderIdByName(payload, providerName)
      if (providerId) {
        providerIdCache.set(providerName, providerId)
        console.log(`   ✓ ${providerName}: ${providerId}`)
      } else {
        console.warn(`   ⚠️  Provider not found: ${providerName}`)
      }
    }

    console.log('')

    // Process each component
    for (let i = 0; i < componentNames.length; i++) {
      const componentName = componentNames[i]
      const progress = `[${i + 1}/${stats.total}]`
      const providerName = getProviderFromComponent(componentName)

      if (!providerName) {
        console.warn(`   ${progress} ⚠️  No provider mapping for: ${componentName}`)
        stats.failed++
        continue
      }

      try {
        const providerId = providerIdCache.get(providerName)

        if (!providerId) {
          throw new Error(`Provider not found in database: ${providerName}`)
        }

        // Get phone number from provider metadata
        const phoneNumber = await getProviderPhoneNumber(payload, providerId)

        if (!phoneNumber) {
          throw new Error(`No phone number found for provider: ${providerName}`)
        }

        // Generate slug and name
        const slug = generateInlineBlockSlug(componentName, providerName)
        const name = generateInlineBlockName(componentName, providerName)

        // Check if already exists
        const { docs: existing } = await payload.find({
          collection: 'richTextDataInstances',
          where: { slug: { equals: slug } },
          limit: 1
        })

        const instanceData = {
          name,
          slug,
          value: phoneNumber,
          category: 'phone',
          provider: providerId,  // Link to ProviderMetadata
          userFacingDescription: `Call ${providerName}`,
          componentName,  // Store original component name for reference
        }

        if (existing.length > 0) {
          // Update existing
          await payload.update({
            collection: 'richTextDataInstances',
            id: existing[0].id,
            data: instanceData
          })
          console.log(`   ${progress} ✓ Updated: ${name}`)
          stats.updated++
        } else {
          // Create new
          await payload.create({
            collection: 'richTextDataInstances',
            data: instanceData
          })
          console.log(`   ${progress} ✓ Created: ${name}`)
          stats.created++
        }
      } catch (error: any) {
        console.error(`   ${progress} ❌ Failed: ${componentName}`)
        console.error(`      Error: ${error.message}`)
        stats.failed++
        stats.errors.push({
          instance: componentName,
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
        console.log(`   - ${err.instance}: ${err.error}`)
      })
    }

    if (stats.failed === 0) {
      console.log('\n✅ All inline blocks seeded successfully!')
    }

    // Verification
    console.log('\n🔍 Verifying...')
    const { totalDocs } = await payload.find({
      collection: 'richTextDataInstances',
      limit: 0
    })
    console.log(`   Total records in database: ${totalDocs}`)
    console.log(`   Expected: ${stats.total - stats.failed}`)

    if (totalDocs === stats.total - stats.failed) {
      console.log('   ✅ Verification passed!')
    } else {
      console.log('   ⚠️  Count mismatch!')
    }

  } catch (error: any) {
    console.error('\n💥 Seeding failed:', error.message)
    process.exit(1)
  }

  process.exit(stats.failed > 0 ? 1 : 0)
}

// Parse command line arguments
const args = process.argv.slice(2)
const purge = args.includes('--purge')

seedDynamicInlineBlocks(purge).catch(console.error)
