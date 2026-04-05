import { test, expect } from '@playwright/test';

const MOBILE_DEVICES = [
  { name: 'iPhone SE', width: 375, height: 667 },
  { name: 'iPhone 14', width: 390, height: 844 },
  { name: 'Pixel 7', width: 412, height: 915 },
  { name: 'iPad Mini', width: 768, height: 1024 },
];

for (const device of MOBILE_DEVICES) {
  test(`${device.name} (${device.width}x${device.height}) renders correctly`, async ({ page }) => {
    test.setTimeout(20000);
    await page.setViewportSize({ width: device.width, height: device.height });
    await page.goto('http://localhost:5173');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForTimeout(1500);

    // Dismiss tutorial
    const closeBtn = page.locator('#close-help');
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
      await page.waitForTimeout(300);
    }

    // Check key elements are visible and not overflowing
    const header = page.locator('.header h1');
    expect(await header.isVisible()).toBe(true);

    const target = page.locator('.target-display');
    expect(await target.isVisible()).toBe(true);

    const stats = page.locator('.stats-bar');
    expect(await stats.isVisible()).toBe(true);

    const canvas = page.locator('.cube-canvas');
    expect(await canvas.isVisible()).toBe(true);
    const canvasBox = await canvas.boundingBox();
    // Canvas should fit within viewport
    expect(canvasBox.x).toBeGreaterThanOrEqual(0);
    expect(canvasBox.x + canvasBox.width).toBeLessThanOrEqual(device.width + 5);

    const buttons = page.locator('.move-buttons');
    expect(await buttons.isVisible()).toBe(true);

    const actions = page.locator('.action-buttons');
    expect(await actions.isVisible()).toBe(true);

    // Check no horizontal scroll
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth, 'No horizontal overflow').toBeLessThanOrEqual(device.width + 2);

    // Try solving with a button click
    page.on('dialog', d => d.accept());
    const topBtn = page.locator('.move-group').filter({ hasText: 'Top' }).locator('.move-btn').first();
    await topBtn.click();
    await page.waitForTimeout(400);
    const moveCount = await page.locator('#move-count').textContent();
    expect(parseInt(moveCount)).toBe(1);

    await page.screenshot({ path: `tests/e2e/mobile-${device.name.replace(/\s/g, '-')}.png`, fullPage: true });
    console.log(`${device.name}: OK`);
  });
}
