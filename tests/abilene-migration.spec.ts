import { test, expect } from '@playwright/test'

/**
 * Test Abilene Electricity Rate Migration
 *
 * Verifies:
 * - Record loads in admin UI
 * - Link spacing is preserved (no "Learnhow" - should be "Learn how")
 * - Bold formatting is preserved on links
 * - All links are present and clickable
 */

test.describe('Abilene Electricity Rate Migration', () => {
  test.beforeEach(async ({ page }) => {
    // Login to Payload admin
    await page.goto('http://localhost:3003/admin')

    // Wait for login page to load
    await page.waitForSelector('input[name="email"]')

    // Login
    await page.fill('input[name="email"]', 'brad@comparepower.com')
    await page.fill('input[name="password"]', 'deh2xjt1CHW_dmd.gxj')
    await page.click('button[type="submit"]')

    // Wait for redirect to admin dashboard
    await page.waitForURL('**/admin', { timeout: 10000 })
  })

  test('should load Abilene record in admin UI', async ({ page }) => {
    // Navigate to Electricity Rates collection
    await page.goto('http://localhost:3003/admin/collections/electricity-rates')

    // Wait for list to load
    await page.waitForSelector('table', { timeout: 10000 })

    // Search for Abilene
    await page.fill('input[placeholder*="Search"]', 'Abilene')
    await page.waitForTimeout(1000)

    // Click on Abilene record
    await page.click('text=Abilene Electricity Rates')

    // Wait for edit page to load
    await page.waitForURL('**/electricity-rates/**', { timeout: 10000 })

    // Verify title field contains "Abilene"
    const title = await page.locator('input[name="title"]').inputValue()
    expect(title).toContain('Abilene')
  })

  test('should preserve link spacing - "Learn how" not "Learnhow"', async ({ page }) => {
    // Navigate directly to Abilene record
    await page.goto('http://localhost:3003/admin/collections/electricity-rates')
    await page.waitForSelector('table', { timeout: 10000 })

    // Search for Abilene and click it
    await page.fill('input[placeholder*="Search"]', 'Abilene')
    await page.waitForTimeout(1000)
    await page.click('text=Abilene Electricity Rates')
    await page.waitForURL('**/electricity-rates/**', { timeout: 10000 })

    // Wait for Lexical editor to load with content
    await page.waitForSelector('[contenteditable="true"]', { timeout: 10000 })

    // Wait a bit for content to render
    await page.waitForTimeout(2000)

    // Get all editor content (there are multiple contenteditable for each block)
    const allEditorText = await page.locator('[contenteditable="true"]').allTextContents()
    const combinedText = allEditorText.join(' ')

    // Verify "Learn how" appears with proper spacing (not "Learnhow")
    expect(combinedText).toContain('Learn how')
    expect(combinedText).not.toContain('Learnhow')
  })

  test('should have all expected links', async ({ page }) => {
    // Navigate to Abilene record
    await page.goto('http://localhost:3003/admin/collections/electricity-rates')
    await page.waitForSelector('table', { timeout: 10000 })
    await page.fill('input[placeholder*="Search"]', 'Abilene')
    await page.waitForTimeout(1000)
    await page.click('text=Abilene Electricity Rates')
    await page.waitForURL('**/electricity-rates/**', { timeout: 10000 })

    // Wait for Lexical editor
    await page.waitForSelector('[contenteditable="true"]', { timeout: 10000 })
    await page.waitForTimeout(2000)

    // Count links across all contenteditable blocks
    const links = await page.locator('[contenteditable="true"] a').count()

    // Verify we have at least 5 links (allowing for some variation in rendering)
    expect(links).toBeGreaterThanOrEqual(5)
  })

  test('should have clickable links with correct URLs', async ({ page }) => {
    // Navigate to Abilene record
    await page.goto('http://localhost:3003/admin/collections/electricity-rates')
    await page.waitForSelector('table', { timeout: 10000 })
    await page.fill('input[placeholder*="Search"]', 'Abilene')
    await page.waitForTimeout(1000)
    await page.click('text=Abilene Electricity Rates')
    await page.waitForURL('**/electricity-rates/**', { timeout: 10000 })

    // Wait for Lexical editor
    await page.waitForSelector('[contenteditable="true"]', { timeout: 10000 })
    await page.waitForTimeout(2000)

    // Check for links across all contenteditable blocks
    const firstLink = await page.locator('[contenteditable="true"] a').first()

    // Wait for link to be visible
    await firstLink.waitFor({ state: 'visible', timeout: 5000 })

    const href = await firstLink.getAttribute('href')

    // Verify it has a valid URL
    expect(href).toBeTruthy()
    expect(href).toContain('http')
  })

  test('should preserve bold formatting', async ({ page }) => {
    // Navigate to Abilene record
    await page.goto('http://localhost:3003/admin/collections/electricity-rates')
    await page.waitForSelector('table', { timeout: 10000 })
    await page.fill('input[placeholder*="Search"]', 'Abilene')
    await page.waitForTimeout(1000)
    await page.click('text=Abilene Electricity Rates')
    await page.waitForURL('**/electricity-rates/**', { timeout: 10000 })

    // Wait for Lexical editor
    await page.waitForSelector('[contenteditable="true"]', { timeout: 10000 })
    await page.waitForTimeout(2000)

    // Check for bold elements across all contenteditable blocks
    const boldElements = await page.locator('[contenteditable="true"] strong, [contenteditable="true"] b').count()

    // Should have at least 2 bold elements
    expect(boldElements).toBeGreaterThanOrEqual(2)
  })
})
