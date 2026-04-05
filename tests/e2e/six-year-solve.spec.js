/**
 * E2E test: solve every daily puzzle for 6 years (2,190 days).
 * Batched into groups of 30 days per test for efficiency.
 * Each puzzle: override date → load → apply solution via buttons → verify Solved! banner.
 */
import { test, expect } from '@playwright/test';
import { generateScramble, invertScramble } from '../../src/cube/scrambler.js';
import { getDailySquare } from '../../src/words/squares.js';
import { dayName, scrambleMoves } from '../../src/utils/date.js';

const MOVE_TO_BUTTON = {
  'U':  { label: 'Top',    idx: 0 }, "U'": { label: 'Top',    idx: 1 },
  'D':  { label: 'Bottom', idx: 0 }, "D'": { label: 'Bottom', idx: 1 },
  'L':  { label: 'Left',   idx: 0 }, "L'": { label: 'Left',   idx: 1 },
  'R':  { label: 'Right',  idx: 0 }, "R'": { label: 'Right',  idx: 1 },
  'F':  { label: 'Front',  idx: 0 }, "F'": { label: 'Front',  idx: 1 },
  'B':  { label: 'Back',   idx: 0 }, "B'": { label: 'Back',   idx: 1 },
};

const TOTAL_DAYS = 365 * 6; // 2190 days
const BATCH_SIZE = 30;
const START = new Date('2026-04-05T00:00:00Z');

// Pre-generate all puzzle solutions
const allPuzzles = [];
for (let d = 0; d < TOTAL_DAYS; d++) {
  const date = new Date(START);
  date.setUTCDate(date.getUTCDate() + d);
  const ds = date.toISOString().slice(0, 10);
  const day = dayName(date);
  const moveCount = scrambleMoves(date);
  const { moves: scramble } = generateScramble(date);
  const solution = invertScramble(scramble);
  allPuzzles.push({ ds, day, moveCount, solution });
}

// Create batched tests
const batchCount = Math.ceil(TOTAL_DAYS / BATCH_SIZE);
for (let batch = 0; batch < batchCount; batch++) {
  const startIdx = batch * BATCH_SIZE;
  const endIdx = Math.min(startIdx + BATCH_SIZE, TOTAL_DAYS);
  const firstDate = allPuzzles[startIdx].ds;
  const lastDate = allPuzzles[endIdx - 1].ds;

  test(`Days ${firstDate} to ${lastDate} (${endIdx - startIdx} puzzles)`, async ({ page }) => {
    test.setTimeout(180000); // 3 min per batch
    page.on('dialog', d => d.accept());

    let passed = 0;
    let failed = 0;

    for (let i = startIdx; i < endIdx; i++) {
      const puzzle = allPuzzles[i];

      // Override Date to target date
      await page.addInitScript(`{
        const _target = new Date('${puzzle.ds}T12:00:00Z');
        const _Orig = Date;
        Date = new Proxy(_Orig, {
          construct(t, a) { return a.length === 0 ? new _Orig(_target) : new _Orig(...a); },
          apply(t, th, a) { return a.length === 0 ? _Orig.call(th, _target) : _Orig.call(th, ...a); }
        });
        Date.now = () => _target.getTime();
        Date.UTC = _Orig.UTC; Date.parse = _Orig.parse; Date.prototype = _Orig.prototype;
      }`);

      await page.goto('http://localhost:5173');
      await page.evaluate(() => localStorage.clear());
      await page.reload();
      await page.waitForTimeout(800);

      // Dismiss tutorial modal if visible
      const helpModal = page.locator('#help-modal.visible');
      if (await helpModal.isVisible().catch(() => false)) {
        await page.locator('#close-help').click();
        await page.waitForTimeout(200);
      }

      // Verify correct day
      const dayText = await page.locator('#day-label').textContent();
      expect(dayText, `${puzzle.ds}: wrong day`).toBe(puzzle.day);

      // Apply solution
      for (const move of puzzle.solution) {
        const { label, idx } = MOVE_TO_BUTTON[move];
        const group = page.locator('.move-group').filter({ hasText: label });
        await group.locator('.move-btn').nth(idx).click();
        await page.waitForTimeout(280);
      }
      await page.waitForTimeout(300);

      // Verify solved with rank
      const banner = await page.locator('#win-banner').isVisible();
      if (banner) {
        const rankTitle = await page.locator('.win-rank-title').textContent();
        if (!rankTitle.includes('Genius')) {
          console.log(`  ${puzzle.ds}: rank = ${rankTitle} (expected Genius for par solve)`);
        }
        passed++;
      } else {
        failed++;
        // Take screenshot on failure
        await page.screenshot({ path: `tests/e2e/fail-${puzzle.ds}.png` });
        console.log(`✗ ${puzzle.ds} ${puzzle.day} (${puzzle.moveCount}-move) - NOT SOLVED`);
      }
    }

    console.log(`Batch ${firstDate}..${lastDate}: ${passed}/${endIdx - startIdx} passed`);
    expect(failed, `${failed} puzzles failed in batch`).toBe(0);
  });
}
