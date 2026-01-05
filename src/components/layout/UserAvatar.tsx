/**
 * UserAvatar Component
 *
 * Simple avatar showing user's first initial.
 * Used in navigation sidebar and mobile drawer.
 */

interface UserAvatarProps {
  email: string;
}

export function UserAvatar({ email }: UserAvatarProps) {
  const initial = email.charAt(0).toUpperCase();

  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
      {initial}
    </div>
  );
}
