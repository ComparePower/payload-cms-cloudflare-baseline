import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Collect console logs
  page.on('console', msg => {
    const text = msg.text();
    console.log('BROWSER:', text);
  });

  // Collect errors
  page.on('pageerror', error => {
    console.log('ERROR:', error.message);
  });

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
    await page.waitForTimeout(5000);

    console.log('3. Taking screenshot...');
    await page.screenshot({ path: 'test-results/screenshots/payload-label-test.png', fullPage: true });
    console.log('Screenshot saved to test-results/screenshots/payload-label-test.png');

    console.log('4. Looking for inline block label...');

    // Try to find the inline block label text
    const labels = await page.locator('span').allTextContents();
    const dynamicLabels = labels.filter(label => label.includes('Phone Number') || label.includes('Email') || label.includes('Address') || label.includes('Dynamic'));

    console.log('\nFound potential labels:');
    dynamicLabels.forEach(label => console.log(`  - ${label}`));

    // Keep browser open for manual inspection
    console.log('\nKeeping browser open for 20 seconds...');
    await page.waitForTimeout(20000);

  } catch (error) {
    console.error('Error:', error.message);
    await page.screenshot({ path: 'test-results/screenshots/playwright-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
