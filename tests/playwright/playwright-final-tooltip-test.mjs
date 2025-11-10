import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  const PAYLOAD_URL = 'http://localhost:3001';
  const EMAIL = 'brad@comparepower.com';
  const PASSWORD = 'deh2xjt1CHW_dmd.gxj';

  try {
    console.log('1. Logging in...');
    await page.goto(`${PAYLOAD_URL}/admin/login`);
    await page.fill('input[name="email"]', EMAIL);
    await page.fill('input[name="password"]', PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    console.log('2. Opening demo...');
    await page.goto(`${PAYLOAD_URL}/admin/collections/demos/68f9fd88445a4165b55c7ebb`);
    await page.waitForTimeout(6000);

    console.log('3. Finding Dynamic Value element...');
    const dynamicValueElement = page.locator('span:has-text("Dynamic Value")').first();
    await dynamicValueElement.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);

    console.log('4. Hovering to show tooltip...');
    await dynamicValueElement.hover({ force: true });
    await page.waitForTimeout(2000); // Wait longer for tooltip to appear

    console.log('5. Checking for tooltip content...');
    const tooltipVisible = await page.locator('span:has-text("Phone Number")').count();
    console.log(`   Tooltip elements found: ${tooltipVisible}`);

    // Take screenshot
    await page.screenshot({ path: 'test-results/screenshots/final-tooltip.png', fullPage: false });
    console.log('   Screenshot saved: test-results/screenshots/final-tooltip.png');

    // Try to get the tooltip text if visible
    if (tooltipVisible > 0) {
      const tooltipText = await page.locator('span:has-text("Phone Number")').first().textContent();
      console.log(`   Tooltip text: "${tooltipText}"`);
    }

    console.log('\n✅ Test complete! Keeping browser open for 15 seconds...');
    await page.waitForTimeout(15000);

  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({ path: 'test-results/screenshots/final-tooltip-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
