import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const variantClasses = {
  primary: 'lexia-primary-action bg-primary text-primary-foreground hover:bg-primary/90',
  secondary: 'lexia-secondary-action border-2 border-secondary/40 text-secondary hover:bg-secondary/10',
  neutral: 'lexia-neutral-action border-2 hover:bg-muted/50',
};

export default function GameActionButton({
  gameVariant = 'primary',
  className,
  children,
  ...props
}) {
  return (
    <Button
      className={cn(
        'rounded-2xl transition-all',
        variantClasses[gameVariant] || variantClasses.primary,
        className,
      )}
      {...props}
    >
      {children}
    </Button>
  );
}
