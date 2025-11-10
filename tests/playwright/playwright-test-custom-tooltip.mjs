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
    await page.waitForTimeout(5000);

    console.log('3. Finding Dynamic Value element...');
    const dynamicValueElement = page.locator('text=Dynamic Value').first();
    await dynamicValueElement.scrollIntoViewIfNeeded();

    console.log('4. Testing hover tooltip...');
    await dynamicValueElement.hover();
    await page.waitForTimeout(1000);

    // Take screenshot with custom tooltip visible
    await page.screenshot({ path: 'test-results/screenshots/custom-tooltip-hover.png', fullPage: false });
    console.log('   Screenshot saved: test-results/screenshots/custom-tooltip-hover.png');

    console.log('5. Testing click alert...');
    // Setup dialog handler before click
    page.on('dialog', async dialog => {
      console.log(`   Alert text: "${dialog.message()}"`);
      await dialog.accept();
    });

    await dynamicValueElement.click();
    await page.waitForTimeout(1000);

    console.log('\n✅ Test complete! Check the screenshots and alert text above.');

    await page.waitForTimeout(5000);

  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({ path: 'test-results/screenshots/custom-tooltip-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
