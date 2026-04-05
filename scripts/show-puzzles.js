import { generateScramble, invertScramble } from '../src/cube/scrambler.js';
import { getDailySquare } from '../src/words/squares.js';
import { dayName, scrambleMoves } from '../src/utils/date.js';

// Show puzzles for each day of the week starting from Monday 2026-04-06
const dates = [
  '2026-04-06', // Monday - 1 move
  '2026-04-07', // Tuesday - 2 moves
  '2026-04-08', // Wednesday - 3 moves
  '2026-04-09', // Thursday - 4 moves
  '2026-04-10', // Friday - 5 moves
  '2026-04-11', // Saturday - 6 moves
  '2026-04-05', // Sunday - 7 moves (today)
];

for (const ds of dates) {
  const date = new Date(ds + 'T00:00:00Z');
  const day = dayName(date);
  const moves = scrambleMoves(date);
  const square = getDailySquare(date);
  const { moves: scramble } = generateScramble(date);
  const solution = invertScramble(scramble);

  const grid = `${square.slice(0,3)} / ${square.slice(3,6)} / ${square.slice(6,9)}`;

  console.log(`\n${day} (${ds}) — ${moves}-move puzzle`);
  console.log(`  Target: ${grid}`);
  console.log(`  Scramble: ${scramble.join(' ')}`);
  console.log(`  Solution: ${solution.join(' ')}`);
  console.log(`  URL: http://localhost:5173/?date=${ds}`);
}
