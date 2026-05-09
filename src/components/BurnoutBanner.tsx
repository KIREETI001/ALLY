'use client';

import { Flame } from 'lucide-react';
import { BURNOUT_BANDS } from '@/lib/theme';

interface BurnoutBannerProps {
  score: number;
  band: 'low' | 'mod' | 'high';
  reason: string;
}

export default function BurnoutBanner({ score, band, reason }: BurnoutBannerProps) {
  const cfg = BURNOUT_BANDS[band];
  return (
    <div style={{ background: cfg.bg, borderRadius: 14, padding: '12px 15px', marginBottom: 14, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
      <Flame size={20} color={cfg.bar} style={{ flexShrink: 0, marginTop: 2 }} />
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: cfg.fg }}>Burnout: {cfg.label}</span>
          <span style={{ fontSize: 12, color: cfg.fg, opacity: 0.85 }}>{score}/100</span>
        </div>
        <div style={{ height: 4, background: 'rgba(255,255,255,.5)', borderRadius: 2, marginTop: 8 }}>
          <div style={{ width: `${score}%`, height: '100%', background: cfg.bar, borderRadius: 2, transition: 'width 240ms ease' }} />
        </div>
        <div style={{ fontSize: 12, color: cfg.fg, marginTop: 6, lineHeight: 1.4 }}>{reason}</div>
      </div>
    </div>
  );
}
