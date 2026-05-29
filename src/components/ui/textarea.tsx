import * as React from 'react';
import { cn } from '@/lib/utils';

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, style, ...props }, ref) => (
    <textarea
      className={cn(
        'flex min-h-[100px] w-full rounded-2xl px-4 py-3 text-[15px] outline-none transition-colors',
        'placeholder:opacity-60',
        'focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-1',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      style={{
        backgroundColor: 'var(--surface-2)',
        color: 'var(--text)',
        border: '1px solid transparent',
        ...style,
      }}
      ref={ref}
      {...props}
    />
  )
);
Textarea.displayName = 'Textarea';

export { Textarea };
