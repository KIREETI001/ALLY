// Burnout score computation.
//
// Calibration: take the last 7 days of mood logs and combine with task
// completion rate. Lower mood scores and lower completion rates push the
// burnout score up. Score returned in [0, 100] where higher = more burnout.

import type { MoodLog } from './types';

interface BurnoutInput {
  recentMoods: MoodLog[];        // last 7 days
  totalTasks: number;
  doneTasks: number;
}

interface BurnoutResult {
  score: number;                // 0-100
  band: 'low' | 'mod' | 'high';
  reason: string;               // short caregiver-facing explanation
}

const LOW_MAX = 35;
const MOD_MAX = 65;

export function computeBurnout(input: BurnoutInput): BurnoutResult {
  const { recentMoods, totalTasks, doneTasks } = input;

  // Mood component: invert mood (1-5 scale) so low mood → high burnout.
  // If no mood data yet, default to neutral mid-band component.
  let moodComponent = 50;
  if (recentMoods.length > 0) {
    const avg = recentMoods.reduce((s, m) => s + m.mood, 0) / recentMoods.length;
    // mood 5 → 0, mood 1 → 100. Linear.
    moodComponent = Math.round(((5 - avg) / 4) * 100);
  }

  // Completion component: low completion → high burnout signal.
  const completionRate = totalTasks > 0 ? doneTasks / totalTasks : 1;
  // 100% done → 0, 0% done → 60 (capped — completion alone shouldn't max out the score)
  const completionComponent = Math.round((1 - completionRate) * 60);

  // Weight mood more than completion (mood is the more direct signal)
  const score = Math.min(100, Math.max(0, Math.round(moodComponent * 0.7 + completionComponent * 0.3)));

  let band: BurnoutResult['band'];
  if (score <= LOW_MAX) band = 'low';
  else if (score <= MOD_MAX) band = 'mod';
  else band = 'high';

  let reason = '';
  if (band === 'low') reason = "You're holding up. Keep checking in.";
  else if (band === 'mod') reason = 'A few signs of strain — small breaks help.';
  else reason = 'You may be running on empty. Please consider respite or talking to someone.';

  return { score, band, reason };
}
