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

    console.log('3. Looking for inline blocks...');

    // Look for "Dynamic Value" (original with tooltip)
    const dynamicValueCount = await page.locator('span:has-text("Dynamic Value")').count();
    console.log(`   Found ${dynamicValueCount} "Dynamic Value" chip(s)`);

    // Look for the actual phone number displayed inline
    const phoneNumberCount = await page.locator('span:has-text("1-866-961-1345")').count();
    console.log(`   Found ${phoneNumberCount} chip(s) showing "1-866-961-1345"`);

    // Take a full screenshot
    await page.screenshot({ path: 'test-results/screenshots/inline-blocks-comparison.png', fullPage: true });
    console.log('   Screenshot saved: test-results/screenshots/inline-blocks-comparison.png');

    // Try to add a new "Dynamic Value (Inline)" block
    console.log('\n4. Adding new "Dynamic Value (Inline)" block...');

    // Click into the content editor
    const contentEditor = page.locator('[data-block-type="richText"]').first();
    await contentEditor.click();
    await page.waitForTimeout(500);

    // Type "/" to open the slash menu
    await page.keyboard.type(' /');
    await page.waitForTimeout(1000);

    // Take screenshot of the menu
    await page.screenshot({ path: 'test-results/screenshots/slash-menu.png', fullPage: false });
    console.log('   Slash menu screenshot: test-results/screenshots/slash-menu.png');

    // Look for both options in the menu
    const dynamicValueOption = await page.locator('text="Dynamic Value"').count();
    const dynamicValueInlineOption = await page.locator('text="Dynamic Value (Inline)"').count();

    console.log(`   "Dynamic Value" option: ${dynamicValueOption > 0 ? 'Found' : 'Not found'}`);
    console.log(`   "Dynamic Value (Inline)" option: ${dynamicValueInlineOption > 0 ? 'Found' : 'Not found'}`);

    console.log('\n✅ Test complete! Keeping browser open for 15 seconds...');
    await page.waitForTimeout(15000);

  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({ path: 'test-results/screenshots/inline-test-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
