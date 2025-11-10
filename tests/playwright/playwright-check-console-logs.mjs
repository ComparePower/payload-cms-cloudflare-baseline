import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Collect console logs
  const consoleLogs = [];
  page.on('console', msg => {
    const text = msg.text();
    console.log('BROWSER CONSOLE:', text);
    consoleLogs.push(text);

    // Look for our DynamicValueLabel props log
    if (text.includes('DynamicValueLabel props:')) {
      console.log('\n========== FOUND LABEL PROPS LOG ==========');
      console.log(text);
      console.log('===========================================\n');
    }
  });

  // Also collect errors
  page.on('pageerror', error => {
    console.log('BROWSER ERROR:', error.message);
  });

  const PAYLOAD_URL = 'http://localhost:3001';
  const EMAIL = 'brad@comparepower.com';
  const PASSWORD = 'deh2xjt1CHW_dmd.gxj';

  try {
    console.log('1. Navigating to Payload admin...');
    await page.goto(`${PAYLOAD_URL}/admin`);
    await page.waitForTimeout(2000);

    console.log('2. Logging in...');
    await page.fill('input[name="email"]', EMAIL);
    await page.fill('input[name="password"]', PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    console.log('3. Navigating to Demos collection...');
    await page.goto(`${PAYLOAD_URL}/admin/collections/demos`);
    await page.waitForTimeout(2000);

    console.log('4. Opening the Inline Blocks Test demo...');
    await page.click('text=Inline Blocks Test');
    await page.waitForTimeout(3000);

    console.log('5. Waiting for page to fully load and console logs...');
    await page.waitForTimeout(5000);

    console.log('\n========== ALL CONSOLE LOGS ==========');
    consoleLogs.forEach((log, i) => {
      console.log(`${i + 1}. ${log}`);
    });
    console.log('======================================\n');

    // Take a screenshot
    await page.screenshot({ path: 'test-results/screenshots/payload-console-debug.png', fullPage: true });
    console.log('Screenshot saved to test-results/screenshots/payload-console-debug.png');

    // Keep browser open for inspection
    console.log('\nKeeping browser open for 30 seconds for inspection...');
    await page.waitForTimeout(30000);

  } catch (error) {
    console.error('Error:', error.message);
    await page.screenshot({ path: 'test-results/screenshots/playwright-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
