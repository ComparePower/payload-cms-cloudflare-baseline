#!/usr/bin/env node
/**
 * Verify Provider Migration
 *
 * Tasks: T026-T027
 *
 * Verifies:
 * 1. Provider count matches expected (157 total, 156 successful)
 * 2. Random sample of 20 providers have all fields present
 * 3. No providers have missing or invalid data
 *
 * Run: ./scripts/doppler-run.sh dev node scripts/migration/verify-provider-migration.mjs
 */

import { getPayload } from 'payload'
import config from '../../src/payload.config.ts'

async function verify() {
  console.log('🔍 Verifying Provider Migration\n')

  // Initialize Payload
  console.log('🔌 Initializing Payload...')
  const payload = await getPayload({ config })
  console.log('   ✓ Payload initialized\n')

  try {
    // T026: Verify total count
    console.log('📊 T026: Verifying provider count...')
    const { totalDocs } = await payload.find({
      collection: 'providers',
      limit: 0,
    })

    console.log(`   Total providers: ${totalDocs}`)
    console.log(`   Expected: 156 (1 failed out of 157)`)

    if (totalDocs === 156) {
      console.log('   ✅ Count matches expected!\n')
    } else {
      console.warn(`   ⚠️  Count mismatch! Expected 156, got ${totalDocs}\n`)
    }

    // T027: Verify random sample
    console.log('📋 T027: Verifying random sample of 20 providers...\n')

    // Get all provider IDs
    const { docs: allProviders } = await payload.find({
      collection: 'providers',
      limit: 200,
      select: {
        id: true,
        title: true,
        slug: true,
      },
    })

    // Shuffle and pick 20
    const shuffled = allProviders.sort(() => Math.random() - 0.5)
    const sample = shuffled.slice(0, 20)

    console.log(`   Checking ${sample.length} random providers:\n`)

    const results = {
      total: sample.length,
      valid: 0,
      invalid: 0,
      issues: [],
    }

    for (let i = 0; i < sample.length; i++) {
      const provider = sample[i]
      const progress = `[${i + 1}/${sample.length}]`

      // Fetch full provider details
      const full = await payload.findByID({
        collection: 'providers',
        id: provider.id,
      })

      // Check required fields
      const issues = []

      if (!full.title) issues.push('missing title')
      if (!full.slug) issues.push('missing slug')
      if (!full.status) issues.push('missing status')
      if (!full.publishedAt) issues.push('missing publishedAt')
      if (!full.contentBlocks || full.contentBlocks.length === 0) {
        issues.push('missing contentBlocks')
      }

      if (issues.length === 0) {
        results.valid++
        console.log(`   ${progress} ✓ ${full.title}`)
        console.log(`      - Slug: ${full.slug}`)
        console.log(`      - Status: ${full.status}`)
        console.log(`      - Published: ${new Date(full.publishedAt).toLocaleDateString()}`)
        console.log(`      - Content blocks: ${full.contentBlocks.length}`)
        console.log(`      - SEO: ${full.seo ? 'configured' : 'none'}`)
        console.log(`      - Hero: ${full.hero ? 'configured' : 'none'}`)
      } else {
        results.invalid++
        results.issues.push({
          title: full.title || 'Unknown',
          slug: full.slug || 'unknown',
          issues,
        })
        console.log(`   ${progress} ❌ ${full.title || 'Unknown'}`)
        console.log(`      Issues: ${issues.join(', ')}`)
      }
      console.log()
    }

    // Summary
    console.log('📊 Verification Summary:\n')
    console.log(`   Total checked: ${results.total}`)
    console.log(`   Valid: ${results.valid}`)
    console.log(`   Invalid: ${results.invalid}`)

    if (results.invalid > 0) {
      console.log('\n❌ Issues found:\n')
      results.issues.forEach(({ title, slug, issues }) => {
        console.log(`   - ${title} (${slug}): ${issues.join(', ')}`)
      })
      console.log()
    } else {
      console.log('\n✅ All sampled providers are valid!\n')
    }

    // Additional statistics
    console.log('📈 Additional Statistics:\n')

    // Count by status
    const { docs: allDocs } = await payload.find({
      collection: 'providers',
      limit: 200,
      select: {
        status: true,
        seo: true,
        hero: true,
      },
    })

    const publishedCount = allDocs.filter((p) => p.status === 'published').length
    const draftCount = allDocs.filter((p) => p.status === 'draft').length
    const withSeo = allDocs.filter((p) => p.seo).length
    const withHero = allDocs.filter((p) => p.hero).length

    console.log(`   Published: ${publishedCount}`)
    console.log(`   Drafts: ${draftCount}`)
    console.log(`   With SEO: ${withSeo}`)
    console.log(`   With Hero: ${withHero}`)
    console.log()

    // Final verdict
    if (totalDocs === 156 && results.invalid === 0) {
      console.log('✅ Migration Verification PASSED!\n')
      process.exit(0)
    } else {
      console.log('⚠️  Migration Verification has warnings\n')
      process.exit(1)
    }
  } catch (error) {
    console.error('\n❌ Verification failed:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

verify()
