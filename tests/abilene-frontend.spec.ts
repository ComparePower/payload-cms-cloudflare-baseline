import { test, expect } from '@playwright/test'

/**
 * Test Abilene Frontend Rendering
 * Verifies the actual rendered page at http://localhost:4321
 */

test.describe('Abilene Frontend Rendering', () => {
  const FRONTEND_URL = 'http://localhost:4321/electricity-rates-payload/texas/texas-abilene-electricity-rates-energy-plans'

  test('should have proper link spacing - no "Clickhere" or "Learnhow"', async ({ page }) => {
    await page.goto(FRONTEND_URL)

    // Get all text content
    const bodyText = await page.locator('body').textContent()

    // Check for broken link spacing BEFORE links (trailing space issues)
    expect(bodyText).not.toContain('Clickhere')
    expect(bodyText).not.toContain('clickhere')
    expect(bodyText).not.toContain('Learnhow')
    expect(bodyText).not.toContain('learnhow')
    expect(bodyText).not.toContain('visitSmart')
    expect(bodyText).not.toContain('visitAEP')
    expect(bodyText).not.toContain('visitATMOS')

    // Check for broken link spacing AFTER links (leading space issues)
    expect(bodyText).not.toContain('Energyat')  // Should be "Energy at"
    expect(bodyText).not.toContain('Texasat')   // Should be "Texas at"

    // Should have proper spacing
    expect(bodyText).toContain('Click here')
    expect(bodyText).toContain('Learn how')
    expect(bodyText).toContain('ATMOS Energy at')  // After-link spacing
  })

  test('should have images from template and no network errors', async ({ page }) => {
    // Track failed requests
    const failedRequests: string[] = []
    const imageErrors: string[] = []

    page.on('requestfailed', request => {
      failedRequests.push(`${request.failure()?.errorText} - ${request.url()}`)
    })

    page.on('response', response => {
      if (response.url().includes('/api/media/') && response.status() >= 400) {
        imageErrors.push(`${response.status()} - ${response.url()}`)
      }
    })

    await page.goto(FRONTEND_URL)

    // Wait for images to load
    await page.waitForLoadState('networkidle')

    // Take screenshot to verify visual rendering
    await page.screenshot({ path: 'test-results/abilene-full-page.png', fullPage: true })

    // Check for network failures
    if (failedRequests.length > 0) {
      console.error('Failed requests:', failedRequests)
    }
    if (imageErrors.length > 0) {
      console.error('Image errors:', imageErrors)
    }

    // Find all images
    const images = page.locator('img')
    const imageCount = await images.count()

    console.log(`Found ${imageCount} images on page`)

    // Check each image's natural dimensions (broken images have naturalWidth/Height = 0)
    const brokenImages: string[] = []
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i)
      const src = await img.getAttribute('src')
      const isLoaded = await img.evaluate((el: HTMLImageElement) => {
        return el.complete && el.naturalHeight !== 0
      })
      if (!isLoaded && src) {
        brokenImages.push(src)
      }
    }

    if (brokenImages.length > 0) {
      console.error('Broken images:', brokenImages)
    }

    // Check for "[Unknown block:" text which indicates rendering issues
    const bodyText = await page.locator('body').textContent()
    expect(bodyText).not.toContain('[Unknown block:')
    expect(bodyText).not.toContain('Unknown block')

    // Assert no network failures
    expect(failedRequests).toHaveLength(0)
    expect(imageErrors).toHaveLength(0)
    expect(brokenImages).toHaveLength(0)

    // Note: Abilene MDX has no inline images - images come from frontmatter/template
    // Just verify that at least some images are present (layout, hero, etc)
    expect(imageCount).toBeGreaterThan(0)
  })

  test('should have clickable links with proper spacing', async ({ page }) => {
    await page.goto(FRONTEND_URL)

    // Find "Click here" link
    const clickHereLink = page.locator('a:has-text("Click here")').first()
    await expect(clickHereLink).toBeVisible()

    const href = await clickHereLink.getAttribute('href')
    expect(href).toBeTruthy()
    console.log('Click here link:', href)

    // Find "Smart Meter Texas" link
    const smartMeterLink = page.locator('a:has-text("Smart Meter Texas")').first()
    await expect(smartMeterLink).toBeVisible()
  })

  test('should display all content sections', async ({ page }) => {
    await page.goto(FRONTEND_URL)

    // Check for major headings (note: "Abilene Utilities" is h3, not h2)
    await expect(page.locator('h3:has-text("Abilene Utilities")')).toBeVisible()
    await expect(page.locator('h4:has-text("Electricity")')).toBeVisible()
    await expect(page.locator('h4:has-text("Gas")')).toBeVisible()
    await expect(page.locator('h4:has-text("Water")')).toBeVisible()
  })

  test('should serve images from CDN at different screen widths', async ({ page }) => {
    const viewports = [
      { width: 375, height: 667, name: 'Mobile' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 1920, height: 1080, name: 'Desktop' },
    ]

    for (const viewport of viewports) {
      console.log(`\n🖥️  Testing ${viewport.name} (${viewport.width}x${viewport.height})`)

      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await page.goto(FRONTEND_URL)
      await page.waitForLoadState('networkidle')

      // Find all images
      const images = page.locator('img')
      const imageCount = await images.count()
      console.log(`   Found ${imageCount} images`)

      // Track CDN vs non-CDN images
      const cdnImages: string[] = []
      const nonCdnImages: string[] = []
      const brokenImages: string[] = []

      for (let i = 0; i < imageCount; i++) {
        const img = images.nth(i)
        const src = await img.getAttribute('src')

        if (!src) continue

        // Check if image is loaded
        const isLoaded = await img.evaluate((el: HTMLImageElement) => {
          return el.complete && el.naturalHeight !== 0
        })

        if (!isLoaded) {
          brokenImages.push(src)
          continue
        }

        // Check if image is served from CDN
        if (src.includes('cms.assets.dev.comparepower.com')) {
          cdnImages.push(src)

          // Get image dimensions
          const dimensions = await img.evaluate((el: HTMLImageElement) => ({
            natural: { width: el.naturalWidth, height: el.naturalHeight },
            rendered: { width: el.width, height: el.height }
          }))

          console.log(`   ✅ CDN: ${src.split('/').pop()}`)
          console.log(`      Natural: ${dimensions.natural.width}x${dimensions.natural.height}`)
          console.log(`      Rendered: ${dimensions.rendered.width}x${dimensions.rendered.height}`)
        } else {
          nonCdnImages.push(src)
          console.log(`   ⚠️  Non-CDN: ${src}`)
        }
      }

      console.log(`   📊 Summary: ${cdnImages.length} CDN images, ${nonCdnImages.length} non-CDN, ${brokenImages.length} broken`)

      // Assert that at least some images are from CDN
      expect(cdnImages.length).toBeGreaterThan(0)

      // Assert no broken images
      if (brokenImages.length > 0) {
        console.error(`   ❌ Broken images at ${viewport.name}:`, brokenImages)
      }
      expect(brokenImages).toHaveLength(0)

      // Take screenshot for visual verification
      await page.screenshot({
        path: `test-results/abilene-${viewport.name.toLowerCase()}-${viewport.width}w.png`,
        fullPage: false
      })
    }
  })
})
