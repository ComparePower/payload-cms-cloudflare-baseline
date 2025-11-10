import { test, expect } from '@playwright/test'

/**
 * Test that preview routes render identically to non-preview routes
 * except for the preview banner
 */

const ABILENE_CITY_SLUG = 'abilene-electricity-rates-energy-plans'

test.describe('Preview Route Parity', () => {
  test('non-preview route should render actual page', async ({ page }) => {
    console.log('\n🧪 Testing NON-PREVIEW route')
    console.log(`   URL: /electricity-rates/texas/${ABILENE_CITY_SLUG}`)

    await page.goto(`http://localhost:4321/electricity-rates/texas/${ABILENE_CITY_SLUG}`)

    // Should have main title
    const title = await page.locator('h1').first().textContent()
    console.log(`   ✅ Title: "${title}"`)
    expect(title).toContain('Abilene')

    // Should NOT have preview banner
    const previewBanner = await page.locator('.preview-banner').count()
    expect(previewBanner).toBe(0)
    console.log('   ✅ No preview banner (as expected)')
  })

  test('preview route should render same page with preview banner', async ({ page }) => {
    console.log('\n🧪 Testing PREVIEW route')
    console.log(`   URL: /preview/electricity-rates/texas-${ABILENE_CITY_SLUG}`)

    await page.goto(`http://localhost:4321/preview/electricity-rates/texas-${ABILENE_CITY_SLUG}`)

    // Should have main title (same as non-preview)
    const title = await page.locator('h1').first().textContent()
    console.log(`   ✅ Title: "${title}"`)
    expect(title).toContain('Abilene')

    // Should HAVE preview banner
    const previewBanner = await page.locator('.preview-banner').count()
    expect(previewBanner).toBeGreaterThan(0)
    console.log('   ✅ Preview banner present')

    // Should have refresh button
    const refreshButton = await page.locator('.refresh-button').count()
    expect(refreshButton).toBeGreaterThan(0)
    console.log('   ✅ Refresh button present')
  })

  test('both routes should have same content structure', async ({ page }) => {
    console.log('\n🧪 Testing content structure parity')

    // Get non-preview content
    await page.goto(`http://localhost:4321/electricity-rates/texas/${ABILENE_CITY_SLUG}`)
    const nonPreviewHeadings = await page.locator('h1, h2, h3').allTextContents()
    console.log(`   📝 Non-preview has ${nonPreviewHeadings.length} headings`)

    // Get preview content
    await page.goto(`http://localhost:4321/preview/electricity-rates/texas-${ABILENE_CITY_SLUG}`)
    const previewHeadings = await page.locator('h1, h2, h3').allTextContents()
    console.log(`   📝 Preview has ${previewHeadings.length} headings`)

    // Should have similar number of headings (preview might have banner heading)
    expect(Math.abs(nonPreviewHeadings.length - previewHeadings.length)).toBeLessThanOrEqual(2)
    console.log('   ✅ Similar content structure')
  })
})
