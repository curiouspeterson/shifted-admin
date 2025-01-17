/**
 * Component Type Declarations
 * Last Updated: 2024
 * 
 * Type declarations for UI components and their exports.
 */

/**
 * Component Type Definitions
 * Last Updated: 2025-01-16
 * 
 * Type definitions for UI components. These types extend base HTML attributes
 * and are intentionally kept as branded types for future extensibility.
 */

import { ButtonHTMLAttributes, InputHTMLAttributes, HTMLAttributes } from 'react'
import { VariantProps } from 'class-variance-authority'

// Button Component
declare module '@/components/ui/button' {
  import { ButtonHTMLAttributes } from 'react';
  import { VariantProps } from 'class-variance-authority';

  const buttonVariants: (props?: {
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
    size?: 'default' | 'sm' | 'lg' | 'icon';
  }) => string;

  export interface ButtonProps
    extends ButtonHTMLAttributes<HTMLButtonElement>,
      VariantProps<typeof buttonVariants> {
    asChild?: boolean;
  }

  export const Button: React.ForwardRefExoticComponent<ButtonProps>;
  export { buttonVariants };
}

// Card Component
declare module '@/components/ui/card' {
  import { HTMLAttributes } from 'react';

  export const Card: React.ForwardRefExoticComponent<HTMLAttributes<HTMLDivElement>>;
  export const CardHeader: React.ForwardRefExoticComponent<HTMLAttributes<HTMLDivElement>>;
  export const CardTitle: React.ForwardRefExoticComponent<HTMLAttributes<HTMLHeadingElement>>;
  export const CardDescription: React.ForwardRefExoticComponent<HTMLAttributes<HTMLParagraphElement>>;
  export const CardContent: React.ForwardRefExoticComponent<HTMLAttributes<HTMLDivElement>>;
  export const CardFooter: React.ForwardRefExoticComponent<HTMLAttributes<HTMLDivElement>>;
}

// Dialog Component
declare module '@/components/ui/dialog' {
  import * as DialogPrimitive from '@radix-ui/react-dialog';

  export const Dialog: typeof DialogPrimitive.Root;
  export const DialogTrigger: typeof DialogPrimitive.Trigger;
  export const DialogContent: typeof DialogPrimitive.Content;
  export const DialogHeader: React.FC<React.HTMLAttributes<HTMLDivElement>>;
  export const DialogFooter: React.FC<React.HTMLAttributes<HTMLDivElement>>;
  export const DialogTitle: typeof DialogPrimitive.Title;
  export const DialogDescription: typeof DialogPrimitive.Description;
}

// Form Component
declare module '@/components/ui/form' {
  import { ControllerProps, FieldPath, FieldValues } from 'react-hook-form';

  export const Form: React.FC<React.PropsWithChildren>;
  export const FormField: <
    TFieldValues extends FieldValues = FieldValues,
    TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
  >(
    props: ControllerProps<TFieldValues, TName>
  ) => React.ReactElement;
  export const FormItem: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement>>;
  export const FormLabel: React.ForwardRefExoticComponent<React.ComponentPropsWithoutRef<'label'>>;
  export const FormControl: React.ForwardRefExoticComponent<React.ComponentPropsWithoutRef<'div'>>;
  export const FormDescription: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLParagraphElement>>;
  export const FormMessage: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLParagraphElement>>;
}

// Input Component
declare module '@/components/ui/input' {
  type InputProps = InputHTMLAttributes<HTMLInputElement>
  export const Input: React.ForwardRefExoticComponent<InputProps>
}

// Badge Component
declare module '@/components/ui/badge' {
  const badgeVariants: (props?: {
    variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success'
  }) => string

  type BadgeProps = HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>

  export const Badge: React.ForwardRefExoticComponent<BadgeProps>
  export { badgeVariants }
}

// Label Component
declare module '@/components/ui/label' {
  import * as LabelPrimitive from '@radix-ui/react-label';

  export const Label: React.ForwardRefExoticComponent<
    React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
  >;
}

// Select Component
declare module '@/components/ui/select' {
  import * as SelectPrimitive from '@radix-ui/react-select';

  export const Select: typeof SelectPrimitive.Root;
  export const SelectGroup: typeof SelectPrimitive.Group;
  export const SelectValue: typeof SelectPrimitive.Value;
  export const SelectTrigger: typeof SelectPrimitive.Trigger;
  export const SelectContent: typeof SelectPrimitive.Content;
  export const SelectLabel: typeof SelectPrimitive.Label;
  export const SelectItem: typeof SelectPrimitive.Item;
  export const SelectSeparator: typeof SelectPrimitive.Separator;
}

// Skeleton Component
declare module '@/components/ui/skeleton' {
  import { HTMLAttributes } from 'react';

  export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {}
  export const Skeleton: React.ForwardRefExoticComponent<SkeletonProps>;
} 