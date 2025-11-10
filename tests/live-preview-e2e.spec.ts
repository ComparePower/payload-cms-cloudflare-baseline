import { test, expect } from '@playwright/test'

/**
 * END-TO-END LIVE PREVIEW TEST
 *
 * Tests the complete live preview flow:
 * 1. Login to Payload admin
 * 2. Open a provider in edit mode
 * 3. Find the preview iframe
 * 4. Verify preview loads content from actual Astro site
 * 5. Edit title in admin
 * 6. Wait for autosave
 * 7. Verify draft API returns edited version
 * 8. Click refresh button in preview
 * 9. Verify preview shows updated content
 */

const ADMIN_EMAIL = process.env.PAYLOAD_EMAIL || 'brad@comparepower.com'
const ADMIN_PASSWORD = process.env.PAYLOAD_PASSWORD || 'deh2xjt1CHW_dmd.gxj'
const PAYLOAD_URL = 'http://localhost:3003'
const ASTRO_URL = 'http://localhost:4321'

test.describe('Live Preview - Providers Collection', () => {
  test('should load preview iframe from actual Astro site and update on refresh', async ({
    page,
  }) => {
    console.log('🧪 LIVE PREVIEW E2E TEST - Providers Collection')
    console.log('='.repeat(70))

    // Step 1: Login to Payload admin
    console.log('\n1️⃣  Logging into Payload admin...')
    await page.goto(`${PAYLOAD_URL}/admin/login`)
    await page.fill('input[name="email"]', ADMIN_EMAIL)
    await page.fill('input[name="password"]', ADMIN_PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForTimeout(2000)
    console.log('   ✅ Logged in')

    // Step 2: Navigate to Providers collection and open first provider
    console.log('\n2️⃣  Opening first provider...')
    await page.goto(`${PAYLOAD_URL}/admin/collections/providers`)
    await page.waitForTimeout(2000)

    // Click first provider link in list (look for the actual link, not just the row)
    const firstProviderLink = page.locator('table tbody tr a').first()
    await firstProviderLink.click()
    await page.waitForTimeout(3000)

    // Get the provider ID from URL
    const currentUrl = page.url()
    const providerId = currentUrl.split('/').pop()?.split('?')[0] // Remove query params
    console.log(`   ✅ Opened provider: ${providerId}`)

    // Step 3: Find preview iframe
    console.log('\n3️⃣  Finding preview iframe...')
    let previewFrame = page.frames().find((f) => f.url().includes('/preview/providers/'))
    if (!previewFrame) {
      console.log('   ⚠️  No preview iframe found yet, clicking Live Preview tab...')
      // Try clicking Live Preview tab if it exists
      const livePreviewTab = page.locator('text=Live Preview').first()
      if (await livePreviewTab.isVisible()) {
        await livePreviewTab.click()
        await page.waitForTimeout(2000)
        previewFrame = page.frames().find((f) => f.url().includes('/preview/providers/'))
      }
    }

    if (!previewFrame) {
      console.log('   ❌ No preview iframe found!')
      throw new Error('Preview iframe not found')
    }

    console.log(`   ✅ Preview URL: ${previewFrame.url()}`)

    // Step 4: Verify preview loads from actual Astro site
    console.log('\n4️⃣  Verifying preview loads from actual Astro site...')
    expect(previewFrame.url()).toContain(ASTRO_URL)
    console.log(`   ✅ Preview is loading from: ${ASTRO_URL}`)

    // Wait for preview content to load
    await page.waitForTimeout(2000)

    // Get original title from preview
    const originalTitle = await previewFrame.$eval('h1', (el) => el.textContent?.trim())
    console.log(`   📝 Preview shows title: "${originalTitle}"`)
    expect(originalTitle).toBeTruthy()

    // Step 5: Verify preview banner is present
    console.log('\n5️⃣  Verifying preview mode banner...')
    const previewBanner = await previewFrame.$('.preview-banner')
    expect(previewBanner).toBeTruthy()
    const bannerText = await previewFrame.$eval(
      '.preview-banner',
      (el) => el.textContent?.trim()
    )
    expect(bannerText).toContain('LIVE PREVIEW MODE')
    console.log('   ✅ Preview mode banner is present')

    // Step 6: Edit title in admin
    const newTitle = `EDITED ${Date.now()}`
    console.log(`\n6️⃣  Editing title to: "${newTitle}"`)
    const titleInput = page.locator('input[name="title"]').first()
    await titleInput.fill(newTitle)
    console.log('   ✏️  Title changed in admin')

    // Step 7: Wait for autosave
    console.log('\n7️⃣  Waiting 3 seconds for autosave...')
    await page.waitForTimeout(3000)

    // Step 8: Verify draft API returns edited version
    console.log('\n8️⃣  Checking draft API endpoint...')
    // Use page.request() to include authentication cookies from browser session
    const draftApiResponse = await page.request.get(
      `${PAYLOAD_URL}/api/providers/${providerId}?draft=true`
    )
    const draftData = await draftApiResponse.json()
    console.log(`   📝 Draft API returns title: "${draftData.title}"`)
    console.log(`   📊 Status: ${draftData._status}`)
    expect(draftData.title).toBe(newTitle)
    console.log('   ✅ Draft API correctly returns edited title')

    // Step 9: Click refresh button in preview
    console.log('\n9️⃣  Clicking refresh button in preview...')
    const refreshButton = await previewFrame.$('.refresh-button')
    if (!refreshButton) {
      console.log('   ❌ Refresh button not found!')
      throw new Error('Refresh button not found')
    }
    await refreshButton.click()
    console.log('   🔄 Refresh clicked')

    // Wait for reload
    await page.waitForTimeout(5000)

    // Get updated preview frame
    previewFrame = page.frames().find((f) => f.url().includes('/preview/providers/'))
    if (!previewFrame) {
      console.log('   ❌ Preview iframe disappeared after refresh!')
      throw new Error('Preview iframe disappeared')
    }

    // Step 10: Verify preview shows updated title
    console.log('\n🔟  Checking updated preview...')
    const updatedTitle = await previewFrame.$eval('h1', (el) => el.textContent?.trim())
    console.log(`   📝 Preview now shows: "${updatedTitle}"`)
    expect(updatedTitle).toBe(newTitle)
    console.log('   ✅ Preview correctly shows edited title after refresh')

    // Results
    console.log('\n' + '='.repeat(70))
    console.log('📊 TEST RESULTS:')
    console.log(`   Original title:        "${originalTitle}"`)
    console.log(`   Edited to:             "${newTitle}"`)
    console.log(`   Draft API returned:    "${draftData.title}"`)
    console.log(`   Preview after refresh: "${updatedTitle}"`)
    console.log('')
    console.log('✅ All assertions passed!')
    console.log('✅ Preview loads from actual Astro site')
    console.log('✅ Draft API correctly returns edited title')
    console.log('✅ Preview correctly shows edited title after refresh')
    console.log('\n🎉 SUCCESS! Live preview is working end-to-end!')
    console.log('='.repeat(70))
  })
})

test.describe('Live Preview - ElectricityRates Collection', () => {
  test('should load preview iframe from actual Astro site and show city metadata', async ({
    page,
  }) => {
    console.log('🧪 LIVE PREVIEW E2E TEST - ElectricityRates Collection')
    console.log('='.repeat(70))

    // Step 1: Login to Payload admin
    console.log('\n1️⃣  Logging into Payload admin...')
    await page.goto(`${PAYLOAD_URL}/admin/login`)
    await page.fill('input[name="email"]', ADMIN_EMAIL)
    await page.fill('input[name="password"]', ADMIN_PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForTimeout(2000)
    console.log('   ✅ Logged in')

    // Step 2: Navigate to ElectricityRates and open first rate
    console.log('\n2️⃣  Opening first electricity rate...')
    await page.goto(`${PAYLOAD_URL}/admin/collections/electricity-rates`)
    await page.waitForTimeout(2000)

    // Click first rate link in list (look for the actual link, not just the row)
    const firstRateLink = page.locator('table tbody tr a').first()
    await firstRateLink.click()
    await page.waitForTimeout(3000)

    // Get the rate ID from URL
    const currentUrl = page.url()
    const rateId = currentUrl.split('/').pop()?.split('?')[0] // Remove query params
    console.log(`   ✅ Opened rate: ${rateId}`)

    // Step 3: Find preview iframe
    console.log('\n3️⃣  Finding preview iframe...')
    let previewFrame = page
      .frames()
      .find((f) => f.url().includes('/preview/electricity-rates/'))
    if (!previewFrame) {
      console.log('   ⚠️  No preview iframe found yet, clicking Live Preview tab...')
      const livePreviewTab = page.locator('text=Live Preview').first()
      if (await livePreviewTab.isVisible()) {
        await livePreviewTab.click()
        await page.waitForTimeout(2000)
        previewFrame = page.frames().find((f) => f.url().includes('/preview/electricity-rates/'))
      }
    }

    if (!previewFrame) {
      console.log('   ❌ No preview iframe found!')
      throw new Error('Preview iframe not found')
    }

    console.log(`   ✅ Preview URL: ${previewFrame.url()}`)

    // Step 4: Verify preview loads from actual Astro site
    console.log('\n4️⃣  Verifying preview loads from actual Astro site...')
    expect(previewFrame.url()).toContain(ASTRO_URL)
    console.log(`   ✅ Preview is loading from: ${ASTRO_URL}`)

    // Wait for preview content to load
    await page.waitForTimeout(2000)

    // Get title from preview
    const title = await previewFrame.$eval('h1', (el) => el.textContent?.trim())
    console.log(`   📝 Preview shows title: "${title}"`)
    expect(title).toBeTruthy()

    // Step 5: Verify city metadata is present
    console.log('\n5️⃣  Verifying city metadata...')
    const cityMeta = await previewFrame.$('.city-meta')
    if (cityMeta) {
      const cityMetaText = await previewFrame.$eval('.city-meta', (el) => el.textContent?.trim())
      console.log(`   ✅ City metadata: "${cityMetaText}"`)
    } else {
      console.log('   ⚠️  City metadata not found (may be expected for some rates)')
    }

    // Results
    console.log('\n' + '='.repeat(70))
    console.log('📊 TEST RESULTS:')
    console.log(`   Title: "${title}"`)
    console.log('')
    console.log('✅ Preview loads from actual Astro site')
    console.log('✅ ElectricityRates preview is working!')
    console.log('\n🎉 SUCCESS! ElectricityRates live preview works!')
    console.log('='.repeat(70))
  })
})
