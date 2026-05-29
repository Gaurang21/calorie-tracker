import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-[15px] font-medium transition-all disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'text-white shadow-[0_6px_18px_var(--brand-glow)] hover:-translate-y-0.5 hover:shadow-[0_8px_22px_var(--brand-glow)] active:translate-y-0',
        secondary: '',
        ghost: '',
        destructive: 'text-white',
        link: 'underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-5 py-2.5',
        sm: 'h-8 px-3 text-[13px]',
        lg: 'h-12 px-6 text-base',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size, asChild = false, style, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    // Apply variant-specific inline styles to plug into CSS-variable theming.
    const variantStyle: React.CSSProperties =
      variant === 'default'
        ? { backgroundColor: 'var(--brand)' }
        : variant === 'secondary'
        ? { backgroundColor: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)' }
        : variant === 'ghost'
        ? { backgroundColor: 'transparent', color: 'var(--text-soft)' }
        : variant === 'destructive'
        ? { backgroundColor: 'var(--danger)' }
        : {};
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        style={{ ...variantStyle, ...style }}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
