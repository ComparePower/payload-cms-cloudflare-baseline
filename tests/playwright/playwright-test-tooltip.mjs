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

    console.log('Looking for tooltip...');
    const dynamicValueElements = await page.locator('span[title]').all();

    for (const el of dynamicValueElements) {
      const text = await el.textContent();
      const title = await el.getAttribute('title');
      if (text?.includes('Dynamic Value')) {
        console.log(`Found: "${text}" with tooltip: "${title}"`);
      }
    }

    await page.screenshot({ path: 'test-results/screenshots/payload-tooltip-test.png', fullPage: true });
    console.log('Screenshot saved');

    console.log('\nKeeping browser open for 15 seconds for manual hover test...');
    await page.waitForTimeout(15000);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
})();
