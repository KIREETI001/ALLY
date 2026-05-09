import { C } from '@/lib/theme';

interface AvatarProps {
  initials: string;
  color?: string;
  size?: number;
}

export default function Avatar({ initials, color = C.pri, size = 28 }: AvatarProps) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        background: color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.38,
        fontWeight: 700,
        color: 'white',
        flexShrink: 0,
      }}
    >
      {initials.slice(0, 2)}
    </div>
  );
}
