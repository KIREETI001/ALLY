// ALLY theme tokens. Single source of truth for colours used across the app.
// Mirrors the original C palette in the prototype.

export const C = {
  pri: '#1B6B7B',
  dark: '#0D3D47',
  light: '#2E8FA3',
  pale: '#E0F2F6',
  bg: '#F0F6F8',
  card: '#FFFFFF',
  text: '#1A2B35',
  sub: '#5A7A8A',
  border: '#DDE8EC',
  warn: '#F59E0B',
  warnBg: '#FEF3C7',
  ok: '#10B981',
  okBg: '#D1FAE5',
  err: '#EF4444',
  errBg: '#FEE2E2',
  pur: '#7C3AED',
  purBg: '#EDE9FE',
  gold: '#D97706',
  navy: '#1E3A5F',
} as const;

export type ColorKey = keyof typeof C;

// Task type → pill colour
export function typeStyle(t: string): { bg: string; tc: string } {
  const styles: Record<string, { bg: string; tc: string }> = {
    Medication: { bg: '#DBEAFE', tc: '#1D4ED8' },
    Physio: { bg: C.okBg, tc: '#065F46' },
    'Wound Care': { bg: C.errBg, tc: '#991B1B' },
    Meals: { bg: C.warnBg, tc: '#92400E' },
    Monitoring: { bg: C.purBg, tc: '#5B21B6' },
  };
  return styles[t] ?? { bg: '#F3F4F6', tc: '#6B7280' };
}

// Burnout band thresholds — used by lib/burnout.ts and HomeTab banner
export const BURNOUT_BANDS = {
  low:    { max: 35, label: 'Low',      bg: C.okBg,   fg: '#065F46', bar: C.ok },
  mod:    { max: 65, label: 'Moderate', bg: C.warnBg, fg: '#92400E', bar: C.warn },
  high:   { max: 100,label: 'High',     bg: C.errBg,  fg: '#991B1B', bar: C.err },
} as const;
