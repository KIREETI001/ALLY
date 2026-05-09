export default function Pill({ label, bg, tc, sm }: { label: string; bg: string; tc: string; sm?: boolean }) {
  return (
    <span
      style={{
        fontSize: sm ? 10 : 11,
        background: bg,
        color: tc,
        padding: sm ? '1px 6px' : '2px 8px',
        borderRadius: 8,
        fontWeight: 600,
        display: 'inline-block',
      }}
    >
      {label}
    </span>
  );
}
