'use client';

import * as React from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { cn, getInitials, generateAvatarColor } from '@/lib/utils';

const AvatarRoot = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn('relative flex h-8 w-8 shrink-0 overflow-hidden rounded-full', className)}
    {...props}
  />
));
AvatarRoot.displayName = AvatarPrimitive.Root.displayName;

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn('aspect-square h-full w-full object-cover', className)}
    {...props}
  />
));
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      'flex h-full w-full items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold',
      className
    )}
    {...props}
  />
));
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

// High-level User Avatar component
interface UserAvatarProps {
  user?: { name?: string; avatar?: string } | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showOnline?: boolean;
}

const sizeClasses = {
  xs: 'h-5 w-5 text-[9px]',
  sm: 'h-7 w-7 text-xs',
  md: 'h-8 w-8 text-xs',
  lg: 'h-10 w-10 text-sm',
  xl: 'h-14 w-14 text-base',
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  size = 'md',
  className,
  showOnline = false,
}) => {
  const name = user?.name || 'Unknown';
  const initials = getInitials(name);
  const colorClass = generateAvatarColor(name);

  return (
    <div className={cn('relative inline-flex', className)}>
      <AvatarRoot className={cn(sizeClasses[size])}>
        {user?.avatar && <AvatarImage src={user.avatar} alt={name} />}
        <AvatarFallback className={cn(colorClass, 'text-white font-semibold')}>
          {initials}
        </AvatarFallback>
      </AvatarRoot>
      {showOnline && (
        <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-green-500 ring-2 ring-background" />
      )}
    </div>
  );
};

// Avatar group (stacked)
interface AvatarGroupProps {
  users: Array<{ name?: string; avatar?: string }>;
  max?: number;
  size?: 'xs' | 'sm' | 'md';
}

export const AvatarGroup: React.FC<AvatarGroupProps> = ({ users, max = 3, size = 'sm' }) => {
  const visible = users.slice(0, max);
  const remaining = users.length - max;

  return (
    <div className="flex items-center">
      {visible.map((user, i) => (
        <div key={i} className={cn('avatar-item relative inline-flex', i > 0 && '-ml-2')}>
          <UserAvatar user={user} size={size} className="ring-2 ring-background" />
        </div>
      ))}
      {remaining > 0 && (
        <div
          className={cn(
            '-ml-2 flex items-center justify-center rounded-full bg-muted text-muted-foreground text-[10px] font-semibold ring-2 ring-background',
            sizeClasses[size]
          )}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
};

export { AvatarRoot, AvatarImage, AvatarFallback };
