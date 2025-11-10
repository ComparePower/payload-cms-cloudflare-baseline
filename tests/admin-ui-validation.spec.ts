/**
 * Payload Admin UI Validation Tests
 *
 * Tasks: T045, T046, T047
 *
 * Validates that migrated records are viewable and accessible in the Payload admin UI.
 * Tests both Providers and Electricity Rates collections by:
 * - Logging into admin
 * - Navigating to collection list pages
 * - Clicking through random sample records
 * - Verifying no errors occur
 *
 * Run:
 *   pnpm playwright test tests/admin-ui-validation.spec.ts
 *   pnpm playwright test tests/admin-ui-validation.spec.ts --headed  # with browser UI
 */

import { test, expect } from '@playwright/test'

const ADMIN_URL = 'http://localhost:3003/admin'
const ADMIN_EMAIL = 'brad@comparepower.com'
const ADMIN_PASSWORD = 'deh2xjt1CHW_dmd.gxj'

test.describe('Payload Admin UI Validation', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto(`${ADMIN_URL}/login`)
    await page.fill('input[name="email"]', ADMIN_EMAIL)
    await page.fill('input[name="password"]', ADMIN_PASSWORD)
    await page.click('button[type="submit"]')

    // Wait for successful login (redirects to admin area)
    await page.waitForURL(/\/admin/, { timeout: 10000 })
  })

  test('T046: Verify 20 random provider records load without errors', async ({ page }) => {
    console.log('\n🧪 Testing Provider Records...')

    // Navigate to providers collection
    await page.goto(`${ADMIN_URL}/collections/providers`)
    await page.waitForLoadState('networkidle')

    // Get all provider rows
    const rows = page.locator('table tbody tr')
    const totalRows = await rows.count()

    console.log(`   Found ${totalRows} provider rows in list`)
    expect(totalRows).toBeGreaterThan(0)

    // Calculate sample size (20 or total, whichever is smaller)
    const sampleSize = Math.min(20, totalRows)
    const indicesToTest = getRandomIndices(totalRows, sampleSize)

    console.log(`   Testing ${sampleSize} random providers...`)

    let successCount = 0
    let failureCount = 0

    for (let i = 0; i < sampleSize; i++) {
      const index = indicesToTest[i]

      // Navigate back to list if not on first iteration
      if (i > 0) {
        await page.goto(`${ADMIN_URL}/collections/providers`)
        await page.waitForLoadState('networkidle')
      }

      try {
        // Click the row
        const row = rows.nth(index)
        const titleCell = row.locator('td').first()
        const title = await titleCell.textContent()

        await row.click()

        // Wait for edit page to load
        await page.waitForURL(/\/collections\/providers\/.*/, { timeout: 5000 })

        // Check for error indicators
        const hasError = await page.locator('text=/error|not found|failed/i').count() > 0

        if (hasError) {
          console.log(`   ❌ [${i + 1}/${sampleSize}] Error loading: ${title}`)
          failureCount++
        } else {
          console.log(`   ✓ [${i + 1}/${sampleSize}] Loaded successfully: ${title}`)
          successCount++
        }
      } catch (error) {
        console.log(`   ❌ [${i + 1}/${sampleSize}] Failed to load record ${index}`)
        failureCount++
      }
    }

    console.log(`\n   📊 Results: ${successCount} passed, ${failureCount} failed`)
    console.log(`   Success Rate: ${((successCount / sampleSize) * 100).toFixed(1)}%\n`)

    // Expect 100% success
    expect(failureCount).toBe(0)
  })

  test('T047: Verify 20 random electricity rate records load without errors', async ({ page }) => {
    console.log('\n🧪 Testing Electricity Rate Records...')

    // Navigate to electricity-rates collection
    await page.goto(`${ADMIN_URL}/collections/electricity-rates`)
    await page.waitForLoadState('networkidle')

    // Get all rate rows
    const rows = page.locator('table tbody tr')
    const totalRows = await rows.count()

    console.log(`   Found ${totalRows} electricity rate rows in list`)
    expect(totalRows).toBeGreaterThan(0)

    // Calculate sample size (20 or total, whichever is smaller)
    const sampleSize = Math.min(20, totalRows)
    const indicesToTest = getRandomIndices(totalRows, sampleSize)

    console.log(`   Testing ${sampleSize} random rates...`)

    let successCount = 0
    let failureCount = 0

    for (let i = 0; i < sampleSize; i++) {
      const index = indicesToTest[i]

      // Navigate back to list if not on first iteration
      if (i > 0) {
        await page.goto(`${ADMIN_URL}/collections/electricity-rates`)
        await page.waitForLoadState('networkidle')
      }

      try {
        // Click the row
        const row = rows.nth(index)
        const titleCell = row.locator('td').first()
        const title = await titleCell.textContent()

        await row.click()

        // Wait for edit page to load
        await page.waitForURL(/\/collections\/electricity-rates\/.*/, { timeout: 5000 })

        // Check for error indicators
        const hasError = await page.locator('text=/error|not found|failed/i').count() > 0

        if (hasError) {
          console.log(`   ❌ [${i + 1}/${sampleSize}] Error loading: ${title}`)
          failureCount++
        } else {
          console.log(`   ✓ [${i + 1}/${sampleSize}] Loaded successfully: ${title}`)
          successCount++
        }
      } catch (error) {
        console.log(`   ❌ [${i + 1}/${sampleSize}] Failed to load record ${index}`)
        failureCount++
      }
    }

    console.log(`\n   📊 Results: ${successCount} passed, ${failureCount} failed`)
    console.log(`   Success Rate: ${((successCount / sampleSize) * 100).toFixed(1)}%\n`)

    // Expect 100% success
    expect(failureCount).toBe(0)
  })

  test('Verify collections are accessible and counts match expectations', async ({ page }) => {
    console.log('\n🧪 Verifying Collection Counts...')

    // Check providers
    await page.goto(`${ADMIN_URL}/collections/providers`)
    await page.waitForLoadState('networkidle')

    const providersText = await page.locator('text=/\\d+\\s+results?/i').first().textContent()
    const providersMatch = providersText?.match(/(\d+)\s+results?/i)
    const providersCount = providersMatch ? parseInt(providersMatch[1]) : 0

    console.log(`   Providers: ${providersCount} records`)
    expect(providersCount).toBeGreaterThanOrEqual(155) // Allow for 1-2 failures

    // Check electricity-rates
    await page.goto(`${ADMIN_URL}/collections/electricity-rates`)
    await page.waitForLoadState('networkidle')

    const ratesText = await page.locator('text=/\\d+\\s+results?/i').first().textContent()
    const ratesMatch = ratesText?.match(/(\d+)\s+results?/i)
    const ratesCount = ratesMatch ? parseInt(ratesMatch[1]) : 0

    console.log(`   Electricity Rates: ${ratesCount} records`)
    expect(ratesCount).toBeGreaterThanOrEqual(890) // Allow for 1-2 failures

    console.log('   ✅ All collection counts within expected range\n')
  })
})

/**
 * Generate random unique indices for sampling
 */
function getRandomIndices(total: number, count: number): number[] {
  const indices = Array.from({ length: total }, (_, i) => i)

  // Fisher-Yates shuffle
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]]
  }

  return indices.slice(0, count)
}
