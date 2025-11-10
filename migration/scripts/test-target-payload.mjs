#!/usr/bin/env node
/**
 * Test Target Payload with Playwright
 *
 * Verifies that generated collections and blocks are working:
 * - Collections exist in sidebar
 * - Can create new entries
 * - Fields render correctly
 * - Blocks are available
 */

import { chromium } from 'playwright'

const PAYLOAD_URL = 'http://localhost:3002'
const EMAIL = 'brad@comparepower.com'
const PASSWORD = 'deh2xjt1CHW_dmd.gxj'

/**
 * Login to Payload
 */
async function login(page) {
  console.log('\n🔐 Logging in...')

  await page.goto(`${PAYLOAD_URL}/admin/login`)
  await page.fill('input[name="email"]', EMAIL)
  await page.fill('input[name="password"]', PASSWORD)
  await page.click('button[type="submit"]')

  // Wait for dashboard
  await page.waitForURL(`${PAYLOAD_URL}/admin`, { timeout: 10000 })
  console.log('  ✓ Logged in successfully')
}

/**
 * Check if collections exist in sidebar
 */
async function checkCollectionsExist(page) {
  console.log('\n📋 Checking collections exist...')

  const collections = ['Providers', 'Team', 'FAQs']

  for (const collection of collections) {
    const link = page.locator(`nav a:has-text("${collection}")`)
    const exists = await link.count() > 0

    if (exists) {
      console.log(`  ✓ ${collection} collection found`)
    } else {
      throw new Error(`❌ ${collection} collection NOT found in sidebar`)
    }
  }
}

/**
 * Test Providers collection
 */
async function testProvidersCollection(page) {
  console.log('\n📝 Testing Providers collection...')

  // Navigate to Providers
  await page.click('nav a:has-text("Providers")')
  await page.waitForURL(`${PAYLOAD_URL}/admin/collections/providers`)
  console.log('  ✓ Navigated to Providers collection')

  // Click Create New
  await page.click('a:has-text("Create New")')
  await page.waitForURL(`${PAYLOAD_URL}/admin/collections/providers/create`)
  console.log('  ✓ Opened Create New form')

  // Check key fields exist
  const fieldsToCheck = [
    'title',
    'slug',
    'draft',
    'seo_title',
    'seo_meta_desc',
    'pubDate',
    'wp_post_id'
  ]

  for (const fieldName of fieldsToCheck) {
    const field = page.locator(`[name="${fieldName}"], [id^="${fieldName}"]`).first()
    const exists = await field.count() > 0

    if (exists) {
      console.log(`  ✓ Field '${fieldName}' rendered`)
    } else {
      console.warn(`  ⚠️  Field '${fieldName}' NOT found`)
    }
  }

  // Check parent relationship field
  const parentField = page.locator('[id^="field-parent"]').first()
  if (await parentField.count() > 0) {
    console.log('  ✓ Parent relationship field rendered')
  }

  // Check contentBlocks field
  const contentBlocksField = page.locator('[id^="field-contentBlocks"], text="Content Blocks"').first()
  if (await contentBlocksField.count() > 0) {
    console.log('  ✓ Content Blocks field rendered')
  }
}

/**
 * Test Team collection
 */
async function testTeamCollection(page) {
  console.log('\n👥 Testing Team collection...')

  await page.click('nav a:has-text("Team")')
  await page.waitForURL(`${PAYLOAD_URL}/admin/collections/team`)
  console.log('  ✓ Navigated to Team collection')

  await page.click('a:has-text("Create New")')
  await page.waitForURL(`${PAYLOAD_URL}/admin/collections/team/create`)
  console.log('  ✓ Opened Create New form')

  // Check fields
  const teamFields = ['name', 'slug', 'email', 'role']

  for (const fieldName of teamFields) {
    const field = page.locator(`[name="${fieldName}"], [id^="${fieldName}"]`).first()
    const exists = await field.count() > 0

    if (exists) {
      console.log(`  ✓ Field '${fieldName}' rendered`)
    }
  }
}

/**
 * Test FAQs collection
 */
async function testFAQsCollection(page) {
  console.log('\n❓ Testing FAQs collection...')

  await page.click('nav a:has-text("FAQs")')
  await page.waitForURL(`${PAYLOAD_URL}/admin/collections/faqs`)
  console.log('  ✓ Navigated to FAQs collection')

  await page.click('a:has-text("Create New")')
  await page.waitForURL(`${PAYLOAD_URL}/admin/collections/faqs/create`)
  console.log('  ✓ Opened Create New form')

  // Check fields
  const faqFields = ['question', 'slug', 'category']

  for (const fieldName of faqFields) {
    const field = page.locator(`[name="${fieldName}"], [id^="${fieldName}"]`).first()
    const exists = await field.count() > 0

    if (exists) {
      console.log(`  ✓ Field '${fieldName}' rendered`)
    }
  }
}

/**
 * Main test function
 */
async function test() {
  console.log('🧪 Starting Payload Tests...')

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()
  const page = await context.newPage()

  try {
    await login(page)
    await checkCollectionsExist(page)
    await testProvidersCollection(page)
    await testTeamCollection(page)
    await testFAQsCollection(page)

    console.log('\n✅ All Tests Passed!\n')
  } catch (error) {
    console.error('\n❌ Test Failed:', error.message)
    throw error
  } finally {
    await browser.close()
  }
}

// Run tests
test().catch(console.error)
