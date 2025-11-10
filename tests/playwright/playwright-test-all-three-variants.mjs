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

    console.log('3. Testing all three variants...\n');

    // Test 1: Dynamic Value (with custom React tooltip)
    console.log('   Testing "Dynamic Value" (Custom React Tooltip):');
    const dynamicValueCount = await page.locator('span:has-text("Dynamic Value")').count();
    console.log(`   - Found ${dynamicValueCount} instance(s)`);

    if (dynamicValueCount > 0) {
      const element = page.locator('span:has-text("Dynamic Value")').first();
      await element.scrollIntoViewIfNeeded();
      await element.hover();
      await page.waitForTimeout(1500);

      // Check if custom tooltip is visible
      const tooltipVisible = await page.locator('span:has-text("Phone Number")').count();
      console.log(`   - Custom tooltip visible: ${tooltipVisible > 0 ? 'YES' : 'NO'}`);
    }

    // Test 2: Dynamic Value (Inline) - shows full value in chip
    console.log('\n   Testing "Dynamic Value (Inline)":');
    const inlineValueCount = await page.locator('span:has-text("Phone Number:")').count();
    console.log(`   - Found ${inlineValueCount} instance(s) showing full details in chip`);

    if (inlineValueCount > 0) {
      const text = await page.locator('span:has-text("Phone Number:")').first().textContent();
      console.log(`   - Text content: "${text}"`);
    }

    // Test 3: Dynamic Value (Simple) - shows "Dynamic Value" with browser tooltip
    console.log('\n   Testing "Dynamic Value (Simple)":');
    const simpleValueElements = await page.locator('span[title*="Phone Number"]').all();
    console.log(`   - Found ${simpleValueElements.length} instance(s) with browser tooltip`);

    for (let i = 0; i < simpleValueElements.length; i++) {
      const tooltipText = await simpleValueElements[i].getAttribute('title');
      const displayText = await simpleValueElements[i].textContent();
      console.log(`   - Element ${i + 1}: displays "${displayText}", tooltip "${tooltipText}"`);
    }

    // Check slash menu for all three options
    console.log('\n4. Checking slash menu for all three options...');

    // Click into the content editor
    const contentEditor = page.locator('[data-block-type="richText"]').first();
    await contentEditor.click();
    await page.waitForTimeout(500);

    // Type "/" to open the slash menu
    await page.keyboard.type(' /');
    await page.waitForTimeout(1500);

    const dynamicValueOption = await page.locator('text="Dynamic Value"').count();
    const dynamicValueInlineOption = await page.locator('text="Dynamic Value (Inline)"').count();
    const dynamicValueSimpleOption = await page.locator('text="Dynamic Value (Simple)"').count();

    console.log(`   - "Dynamic Value": ${dynamicValueOption > 0 ? 'Found' : 'Not found'}`);
    console.log(`   - "Dynamic Value (Inline)": ${dynamicValueInlineOption > 0 ? 'Found' : 'Not found'}`);
    console.log(`   - "Dynamic Value (Simple)": ${dynamicValueSimpleOption > 0 ? 'Found' : 'Not found'}`);

    // Take screenshots
    await page.screenshot({ path: 'test-results/screenshots/all-three-variants-menu.png', fullPage: false });
    console.log('\n   Screenshot saved: test-results/screenshots/all-three-variants-menu.png');

    // Close the menu
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    // Take full page screenshot
    await page.screenshot({ path: 'test-results/screenshots/all-three-variants-display.png', fullPage: true });
    console.log('   Screenshot saved: test-results/screenshots/all-three-variants-display.png');

    console.log('\n✅ Test complete! All three variants tested.');
    console.log('   1. Dynamic Value - Custom React tooltip (hover to see)');
    console.log('   2. Dynamic Value (Inline) - Full details shown in chip');
    console.log('   3. Dynamic Value (Simple) - Browser tooltip with details');

    console.log('\nKeeping browser open for 20 seconds...');
    await page.waitForTimeout(20000);

  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({ path: 'test-results/screenshots/all-three-variants-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
