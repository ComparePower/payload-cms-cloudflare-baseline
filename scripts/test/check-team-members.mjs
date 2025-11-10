#!/usr/bin/env node
/**
 * Check Team Members - Quick verification script
 *
 * Created: 2025-11-06 (Issue #27)
 * Context: Verify team members exist before testing relationship field mapping
 * Usage: ./scripts/doppler-run.sh dev node scripts/test/check-team-members.mjs
 */

import { getPayload } from 'payload'
import config from '../../src/payload.config.ts'

async function checkTeamMembers() {
  try {
    console.log('🔗 Connecting to Payload...')
    const payload = await getPayload({ config })

    console.log('📋 Fetching team members...')
    const { docs } = await payload.find({
      collection: 'team',
      limit: 100,
    })

    console.log(`\n✅ Found ${docs.length} team member(s):`)
    docs.forEach((member) => {
      console.log(`  - ${member.name} (slug: ${member.slug})`)
      console.log(`    Email: ${member.email || 'Not set'}`)
      console.log(`    Roles: ${member.roles?.join(', ') || 'None'}`)
      console.log(`    ID: ${member.id}`)
      console.log('')
    })

    // Check for required team members
    const requiredSlugs = ['graham-griffin', 'ryan-hatch', 'enri-zhulati']
    const existingSlugs = docs.map((m) => m.slug)

    const missing = requiredSlugs.filter((slug) => !existingSlugs.includes(slug))

    if (missing.length > 0) {
      console.log(`⚠️  Missing required team members: ${missing.join(', ')}`)
      console.log('   These need to be created for relationship field mapping tests.')
    } else {
      console.log('✅ All required team members exist!')
    }

    process.exit(0)
  } catch (err) {
    console.error('❌ Error:', err.message)
    process.exit(1)
  }
}

checkTeamMembers()
