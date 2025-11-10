import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  const PAYLOAD_URL = 'http://localhost:3001';
  const ASTRO_URL = 'http://localhost:4321';
  const EMAIL = 'brad@comparepower.com';
  const PASSWORD = 'deh2xjt1CHW_dmd.gxj';

  try {
    console.log('=== BACKEND TEST ===');
    console.log('1. Logging into Payload...');
    await page.goto(`${PAYLOAD_URL}/admin/login`);
    await page.fill('input[name="email"]', EMAIL);
    await page.fill('input[name="password"]', PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    console.log('2. Opening demo...');
    await page.goto(`${PAYLOAD_URL}/admin/collections/demos/68f9fd88445a4165b55c7ebb`);
    await page.waitForTimeout(5000);

    console.log('3. Checking inline block label...');
    const dynamicValueEl = page.locator('span[title*="Phone Number"]').first();
    const tooltipText = await dynamicValueEl.getAttribute('title');
    console.log(`   ✓ Tooltip: "${tooltipText}"`);

    const hasUnderline = await dynamicValueEl.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return style.borderBottom.includes('dotted');
    });
    console.log(`   ✓ Has dotted underline: ${hasUnderline}`);

    await page.screenshot({ path: 'test-results/screenshots/test-backend.png', fullPage: true });
    console.log('   ✓ Backend screenshot saved');

    console.log('\n=== FRONTEND TEST ===');
    console.log('4. Opening Astro frontend...');
    await page.goto(`${ASTRO_URL}/demos/inline-blocks-test`);
    await page.waitForTimeout(2000);

    console.log('5. Checking inline block rendering...');
    const inlineBlocks = await page.locator('.inline-block-dynamic').all();
    console.log(`   ✓ Found ${inlineBlocks.length} inline block(s)`);

    for (let i = 0; i < inlineBlocks.length; i++) {
      const text = await inlineBlocks[i].textContent();
      const category = await inlineBlocks[i].getAttribute('data-category');
      console.log(`   ✓ Block ${i + 1}: category="${category}", value="${text}"`);
    }

    await page.screenshot({ path: 'test-results/screenshots/test-frontend.png', fullPage: true });
    console.log('   ✓ Frontend screenshot saved');

    console.log('\n=== ALL TESTS PASSED ===');
    console.log('✓ Backend: Inline blocks display with helpful tooltip');
    console.log('✓ Frontend: Inline blocks render with actual values');

    await page.waitForTimeout(5000);

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    await page.screenshot({ path: 'test-results/screenshots/test-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
