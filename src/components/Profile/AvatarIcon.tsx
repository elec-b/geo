// Componente que renderiza un avatar de perfil
import { AVATAR_MAP, DEFAULT_AVATAR } from '../../data/avatars';
import type { AvatarId } from '../../stores/types';

const SIZES = {
  sm: '1.5rem',
  md: '2.5rem',
  lg: '3.5rem',
} as const;

interface AvatarIconProps {
  avatarId: AvatarId;
  size?: keyof typeof SIZES;
  className?: string;
}

export function AvatarIcon({ avatarId, size = 'md', className }: AvatarIconProps) {
  const def = AVATAR_MAP.get(avatarId) ?? AVATAR_MAP.get(DEFAULT_AVATAR)!;
  const dim = SIZES[size];

  return (
    <img
      src={def.path}
      alt={def.label}
      className={className}
      style={{ width: dim, height: dim, objectFit: 'contain' }}
      draggable={false}
    />
  );
}
