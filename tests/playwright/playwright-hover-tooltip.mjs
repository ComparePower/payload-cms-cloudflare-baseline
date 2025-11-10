import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  const PAYLOAD_URL = 'http://localhost:3001';
  const EMAIL = 'brad@comparepower.com';
  const PASSWORD = 'deh2xjt1CHW_dmd.gxj';

  try {
    console.log('Logging in...');
    await page.goto(`${PAYLOAD_URL}/admin/login`);
    await page.fill('input[name="email"]', EMAIL);
    await page.fill('input[name="password"]', PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    console.log('Opening demo...');
    await page.goto(`${PAYLOAD_URL}/admin/collections/demos/68f9fd88445a4165b55c7ebb`);
    await page.waitForTimeout(5000);

    console.log('Looking for Dynamic Value element...');

    // Find the element with title attribute
    const dynamicValueElement = page.locator('span[title*="Phone"]').first();

    // Check if it exists
    const count = await dynamicValueElement.count();
    console.log(`Found ${count} elements with title containing "Phone"`);

    if (count > 0) {
      const titleValue = await dynamicValueElement.getAttribute('title');
      console.log(`Title attribute value: "${titleValue}"`);

      // Scroll element into view
      await dynamicValueElement.scrollIntoViewIfNeeded();

      // Hover over the element to show the tooltip
      console.log('Hovering over element to show tooltip...');
      await dynamicValueElement.hover();

      // Wait a moment for tooltip to appear
      await page.waitForTimeout(2000);

      // Take screenshot with tooltip visible
      await page.screenshot({ path: 'test-results/screenshots/tooltip-hover.png', fullPage: false });
      console.log('Screenshot saved to test-results/screenshots/tooltip-hover.png');

      // Keep browser open to manually verify
      console.log('\nTooltip should be visible now. Keeping browser open for 20 seconds...');
      await page.waitForTimeout(20000);
    } else {
      console.log('ERROR: Could not find element with title attribute!');
      await page.screenshot({ path: 'test-results/screenshots/tooltip-not-found.png', fullPage: true });
    }

  } catch (error) {
    console.error('Error:', error.message);
    await page.screenshot({ path: 'test-results/screenshots/tooltip-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
