#!/usr/bin/env node
/**
 * Purge Providers and Electricity-Rates Collections via Payload API
 *
 * Deletes all documents from both collections using Payload API
 * to ensure proper cleanup through Payload's hooks and validation
 */

import { getPayload } from 'payload'
import config from '../../src/payload.config.ts'

async function purge() {
  console.log('🗑️  Purging Providers and Electricity-Rates Collections...\n')

  // Initialize Payload
  console.log('🔌 Initializing Payload...')
  const payload = await getPayload({ config })
  console.log('   ✓ Payload initialized\n')

  try {
    // Purge providers
    console.log('🗑️  Purging providers...')
    const { docs: providers } = await payload.find({
      collection: 'providers',
      limit: 10000,
    })

    let deletedProviders = 0
    for (const doc of providers) {
      await payload.delete({
        collection: 'providers',
        id: doc.id,
      })
      deletedProviders++
    }
    console.log(`   ✓ Deleted ${deletedProviders} providers\n`)

    // Purge electricity-rates
    console.log('🗑️  Purging electricity-rates...')
    const { docs: rates } = await payload.find({
      collection: 'electricity-rates',
      limit: 10000,
    })

    let deletedRates = 0
    for (const doc of rates) {
      await payload.delete({
        collection: 'electricity-rates',
        id: doc.id,
      })
      deletedRates++
    }
    console.log(`   ✓ Deleted ${deletedRates} electricity-rates\n`)

    console.log('✅ Purge complete!\n')
    console.log('📊 Summary:')
    console.log(`   Providers deleted: ${deletedProviders}`)
    console.log(`   Electricity-rates deleted: ${deletedRates}`)
    console.log(`   Total deleted: ${deletedProviders + deletedRates}\n`)

  } catch (error) {
    console.error('❌ Purge failed:', error.message)
    console.error(error.stack)
    throw error
  }
}

// Run purge
purge()
  .then(() => {
    console.log('✅ Done!\n')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error.message)
    process.exit(1)
  })
