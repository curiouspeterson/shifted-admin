/**
 * UI Component Type Declarations
 * Last Updated: 2025-01-17
 * 
 * Type declarations for UI components to resolve module import issues.
 */

declare module '@/components/ui/button' {
  import type { ComponentPropsWithoutRef } from 'react';

  interface ButtonProps extends Omit<
    ComponentPropsWithoutRef<'button'>,
    'onClick' | 'onMouseDown' | 'onMouseUp' | 'onMouseEnter' | 'onMouseLeave'
  > {
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
    size?: 'default' | 'sm' | 'lg' | 'icon';
    isLoading?: boolean;
  }

  interface ClientButtonProps extends Omit<ButtonProps, 'onClick'> {
    onClick?: () => void;
  }

  export function Button(props: ButtonProps): React.ReactElement;
  export function ClientButton(props: ClientButtonProps): React.ReactElement;
  export function buttonVariants(props?: {
    variant?: ButtonProps['variant'];
    size?: ButtonProps['size'];
    className?: string;
  }): string;

  export type { ButtonProps, ClientButtonProps };
}

declare module '@/components/ui/card' {
  export * from '../../components/ui/card';
}

declare module '@/components/ui/dialog' {
  export * from '../../components/ui/dialog';
}

declare module '@/components/ui/form' {
  export * from '../../components/ui/form';
}

declare module '@/components/ui/input' {
  export * from '../../components/ui/input';
}

declare module '@/components/ui/label' {
  export * from '../../components/ui/label';
}

declare module '@/components/ui/select' {
  export * from '../../components/ui/select';
}

declare module '@/components/ui/badge' {
  export * from '../../components/ui/badge';
}

declare module '@/components/ui/skeleton' {
  export * from '../../components/ui/skeleton';
} 