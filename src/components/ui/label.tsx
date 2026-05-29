import * as React from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';
import { cn } from '@/lib/utils';

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, style, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(
      'text-[13px] font-medium block mb-1.5 peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
      className
    )}
    style={{ color: 'var(--text-muted)', ...style }}
    {...props}
  />
));
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
