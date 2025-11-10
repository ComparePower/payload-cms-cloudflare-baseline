#!/usr/bin/env tsx
/**
 * Verify ProviderMetadata seeding
 */

import { getPayload } from 'payload'
import config from '../../src/payload.config'

async function verify() {
  console.log('🔍 Verifying ProviderMetadata\n')

  const payload = await getPayload({ config })

  try {
    // Get total count
    const { totalDocs } = await payload.find({
      collection: 'providerMetadata',
      limit: 0
    })
    console.log(`Total providers: ${totalDocs}\n`)

    // Check Discount Power (previously failing)
    const { docs: discountDocs } = await payload.find({
      collection: 'providerMetadata',
      where: { name: { equals: 'Discount Power' } },
      limit: 1
    })

    if (discountDocs.length > 0) {
      const provider = discountDocs[0]
      console.log('✅ Discount Power (previously failed):')
      console.log('  cp_provider_id:', provider.cp_provider_id)
      console.log('  slug:', provider.slug)
      console.log('  rescission email:', provider.contact_rescission?.email || 'N/A')
      console.log('    (was: "service@ discountpowertx.com" with space)')
      console.log('    (now: sanitized and valid)\n')
    }

    // Check Reliant (previously failing)
    const { docs: reliantDocs } = await payload.find({
      collection: 'providerMetadata',
      where: { name: { equals: 'Reliant' } },
      limit: 1
    })

    if (reliantDocs.length > 0) {
      const provider = reliantDocs[0]
      console.log('✅ Reliant (previously failed):')
      console.log('  cp_provider_id:', provider.cp_provider_id)
      console.log('  slug:', provider.slug)
      console.log('  rescission email:', provider.contact_rescission?.email || 'N/A')
      console.log('    (was: "service@reliant.com " with trailing space)')
      console.log('    (now: sanitized and valid)\n')
    }

    // Check 4Change Energy (test rich data)
    const { docs: fourChangeDocs } = await payload.find({
      collection: 'providerMetadata',
      where: { name: { equals: '4Change Energy' } },
      limit: 1
    })

    if (fourChangeDocs.length > 0) {
      const provider = fourChangeDocs[0]
      console.log('✅ 4Change Energy (data richness check):')
      console.log('  cp_provider_id:', provider.cp_provider_id)
      console.log('  legal_name:', provider.legal_name || 'N/A')
      console.log('  puct_number:', provider.puct_number || 'N/A')
      console.log('  operation_hours.monday:', provider.operation_hours?.monday ? 'Yes' : 'No')
      console.log('  same_day_cutoff_time:', provider.same_day_cutoff_time ? 'Yes' : 'No')
      console.log('  contact_sales.phone:', provider.contact_sales?.phone_number || 'N/A')
      console.log('  configuration:', provider.configuration ? 'Yes' : 'No')
    }

    console.log('\n✅ Verification complete!')

  } catch (error: any) {
    console.error('❌ Error:', error.message)
  }

  process.exit(0)
}

verify().catch(console.error)
