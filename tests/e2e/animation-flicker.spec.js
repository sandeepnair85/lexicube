/**
 * Test for visual flicker during face rotation animation.
 * Takes rapid screenshots during a move to detect if stickers
 * show wrong content between animation end and state update.
 */
import { test, expect } from '@playwright/test';

test('check for flicker during move animation', async ({ page }) => {
  test.setTimeout(30000);
  page.on('dialog', d => d.accept());

  await page.goto('http://localhost:5173');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForTimeout(1500);

  // Dismiss tutorial
  const closeBtn = page.locator('#close-help');
  if (await closeBtn.isVisible().catch(() => false)) {
    await closeBtn.click();
    await page.waitForTimeout(300);
  }

  // Inject observer to track sticker texture changes on the canvas
  // Since it's WebGL we can't read pixels easily, but we can intercept
  // the updateLetters calls
  await page.evaluate(() => {
    window._updateLog = [];
    window._animLog = [];

    // Patch to detect animation lifecycle
    const origRAF = window.requestAnimationFrame;
    let frameCount = 0;
    window.requestAnimationFrame = function(cb) {
      frameCount++;
      return origRAF.call(window, cb);
    };

    // Watch for move count changes (indicates state update)
    const mc = document.getElementById('move-count');
    const obs = new MutationObserver(() => {
      window._updateLog.push({
        time: performance.now(),
        moveCount: mc.textContent,
        event: 'move-count-changed'
      });
    });
    obs.observe(mc, { childList: true, characterData: true, subtree: true });
  });

  // Take screenshot before move
  await page.screenshot({ path: 'tests/e2e/flicker-0-before.png' });

  // Click Top CW button and rapidly screenshot during animation
  const topBtn = page.locator('.move-group').filter({ hasText: 'Top' }).locator('.move-btn').first();

  // Start a rapid screenshot loop BEFORE clicking
  const screenshotPromises = [];
  const startTime = Date.now();

  // Click the button
  await topBtn.click();

  // Take screenshots at various points during/after the animation
  for (let i = 1; i <= 8; i++) {
    await page.waitForTimeout(50);
    await page.screenshot({ path: `tests/e2e/flicker-${i}-${Date.now() - startTime}ms.png` });
  }

  // Wait for animation to fully complete
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'tests/e2e/flicker-9-final.png' });

  // Check the update log
  const log = await page.evaluate(() => window._updateLog);
  console.log('Update events during animation:');
  for (const entry of log) {
    console.log(`  ${Math.round(entry.time)}ms: ${entry.event} -> moveCount=${entry.moveCount}`);
  }

  // Now test: do a move and check if updateLetters is called multiple times
  // by watching the Three.js material updates
  await page.evaluate(() => {
    window._textureUpdateCount = 0;
    window._textureUpdateTimes = [];

    // Monkey-patch CanvasRenderingContext2D.fillText to count texture creations
    const origFillText = CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.fillText = function(...args) {
      window._textureUpdateCount++;
      window._textureUpdateTimes.push(performance.now());
      return origFillText.apply(this, args);
    };
  });

  // Do another move
  const beforeCount = await page.evaluate(() => window._textureUpdateCount);
  await topBtn.click();
  await page.waitForTimeout(100); // during animation
  const duringCount = await page.evaluate(() => window._textureUpdateCount);
  await page.waitForTimeout(400); // after animation
  const afterCount = await page.evaluate(() => window._textureUpdateCount);

  console.log(`\nTexture updates (fillText calls):`);
  console.log(`  Before click: ${beforeCount}`);
  console.log(`  During animation (100ms): ${duringCount} (+${duringCount - beforeCount})`);
  console.log(`  After animation (500ms): ${afterCount} (+${afterCount - duringCount})`);

  // Each updateLetters call creates 54 textures (one per sticker)
  // If we see 108+ updates, it means updateLetters was called twice
  const totalUpdates = afterCount - beforeCount;
  const updateCalls = Math.round(totalUpdates / 54);
  console.log(`  Total: ${totalUpdates} texture updates = ~${updateCalls} updateLetters() calls`);

  if (updateCalls > 1) {
    console.log('\n  ** FLICKER DETECTED: updateLetters called multiple times per move **');

    // Check timing
    const times = await page.evaluate(() => window._textureUpdateTimes);
    const relevantTimes = times.slice(-totalUpdates);
    if (relevantTimes.length >= 108) {
      const firstBatch = relevantTimes[53]; // end of first batch
      const secondBatch = relevantTimes[54]; // start of second batch
      console.log(`  First updateLetters ends at: ${Math.round(firstBatch)}ms`);
      console.log(`  Second updateLetters starts at: ${Math.round(secondBatch)}ms`);
      console.log(`  Gap: ${Math.round(secondBatch - firstBatch)}ms`);
    }
  } else {
    console.log('\n  No flicker: updateLetters called exactly once per move');
  }

  expect(true).toBe(true); // diagnostic test, always passes
});
