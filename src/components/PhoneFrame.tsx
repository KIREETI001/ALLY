'use client';

import { type ReactNode } from 'react';
import { C } from '@/lib/theme';

// The "phone frame" wrapper — keeps the prototype's mobile-first feel
// while still working at desktop. On narrow screens it expands to fill the viewport.
export default function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: '#D8E4E8',
        padding: 16,
        fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
      }}
    >
      <div
        className="ally-phone"
        style={{
          width: 390,
          height: 844,
          background: C.bg,
          borderRadius: 44,
          overflow: 'hidden',
          boxShadow: '0 40px 100px rgba(0,0,0,.35),0 0 0 12px #1A2530',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* notch */}
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 120, height: 34, background: '#1A2530', borderRadius: '0 0 20px 20px', zIndex: 20 }} />
        <div style={{ position: 'absolute', top: 0, left: 20, right: 20, height: 48, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingBottom: 6, zIndex: 15, pointerEvents: 'none' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'white' }}>9:41</span>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {children}
        </div>
      </div>
      {/* Mobile responsive overrides */}
      <style jsx global>{`
        @media (max-width: 480px) {
          .ally-phone {
            width: 100% !important;
            height: 100vh !important;
            border-radius: 0 !important;
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
}
