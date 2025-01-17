/**
 * UI Component Type Declarations
 * Last Updated: 2025-03-19
 * 
 * Central type declarations for UI components.
 * Provides type definitions for all shared UI components
 * and their variants.
 */

import type { ComponentPropsWithoutRef, HTMLAttributes } from 'react'
import type { VariantProps } from 'class-variance-authority'
import type * as DialogPrimitive from '@radix-ui/react-dialog'
import type * as LabelPrimitive from '@radix-ui/react-label'
import type * as SelectPrimitive from '@radix-ui/react-select'
import type { ControllerProps, FieldPath, FieldValues } from 'react-hook-form'

// Button Component Types
declare module '@/components/ui/button' {
  interface ButtonProps extends Omit<
    ComponentPropsWithoutRef<'button'>,
    'onClick' | 'onMouseDown' | 'onMouseUp' | 'onMouseEnter' | 'onMouseLeave'
  > {
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
    size?: 'default' | 'sm' | 'lg' | 'icon'
    isLoading?: boolean
  }

  interface ClientButtonProps extends Omit<ButtonProps, 'onClick'> {
    onClick?: () => void
  }

  export function Button(props: ButtonProps): React.ReactElement
  export function ClientButton(props: ClientButtonProps): React.ReactElement
  export function buttonVariants(props?: {
    variant?: ButtonProps['variant']
    size?: ButtonProps['size']
    className?: string
  }): string

  export type { ButtonProps, ClientButtonProps }
}

// Card Component Types
declare module '@/components/ui/card' {
  export const Card: React.ForwardRefExoticComponent<HTMLAttributes<HTMLDivElement>>
  export const CardHeader: React.ForwardRefExoticComponent<HTMLAttributes<HTMLDivElement>>
  export const CardTitle: React.ForwardRefExoticComponent<HTMLAttributes<HTMLHeadingElement>>
  export const CardDescription: React.ForwardRefExoticComponent<HTMLAttributes<HTMLParagraphElement>>
  export const CardContent: React.ForwardRefExoticComponent<HTMLAttributes<HTMLDivElement>>
  export const CardFooter: React.ForwardRefExoticComponent<HTMLAttributes<HTMLDivElement>>
}

// Dialog Component Types
declare module '@/components/ui/dialog' {
  export const Dialog: typeof DialogPrimitive.Root
  export const DialogTrigger: typeof DialogPrimitive.Trigger
  export const DialogContent: typeof DialogPrimitive.Content
  export const DialogHeader: React.FC<React.HTMLAttributes<HTMLDivElement>>
  export const DialogFooter: React.FC<React.HTMLAttributes<HTMLDivElement>>
  export const DialogTitle: typeof DialogPrimitive.Title
  export const DialogDescription: typeof DialogPrimitive.Description
}

// Form Component Types
declare module '@/components/ui/form' {
  export const Form: React.FC<React.PropsWithChildren>
  export const FormField: <
    TFieldValues extends FieldValues = FieldValues,
    TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
  >(
    props: ControllerProps<TFieldValues, TName>
  ) => React.ReactElement
  export const FormItem: React.ForwardRefExoticComponent<HTMLAttributes<HTMLDivElement>>
  export const FormLabel: React.ForwardRefExoticComponent<ComponentPropsWithoutRef<'label'>>
  export const FormControl: React.ForwardRefExoticComponent<ComponentPropsWithoutRef<'div'>>
  export const FormDescription: React.ForwardRefExoticComponent<HTMLAttributes<HTMLParagraphElement>>
  export const FormMessage: React.ForwardRefExoticComponent<HTMLAttributes<HTMLParagraphElement>>
}

// Input Component Types
declare module '@/components/ui/input' {
  type InputProps = ComponentPropsWithoutRef<'input'>
  export const Input: React.ForwardRefExoticComponent<InputProps>
}

// Badge Component Types
declare module '@/components/ui/badge' {
  const badgeVariants: (props?: {
    variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success'
  }) => string

  type BadgeProps = HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>

  export const Badge: React.ForwardRefExoticComponent<BadgeProps>
  export { badgeVariants }
}

// Label Component Types
declare module '@/components/ui/label' {
  export const Label: React.ForwardRefExoticComponent<
    ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
  >
}

// Select Component Types
declare module '@/components/ui/select' {
  export const Select: typeof SelectPrimitive.Root
  export const SelectGroup: typeof SelectPrimitive.Group
  export const SelectValue: typeof SelectPrimitive.Value
  export const SelectTrigger: typeof SelectPrimitive.Trigger
  export const SelectContent: typeof SelectPrimitive.Content
  export const SelectLabel: typeof SelectPrimitive.Label
  export const SelectItem: typeof SelectPrimitive.Item
  export const SelectSeparator: typeof SelectPrimitive.Separator
}

// Skeleton Component Types
declare module '@/components/ui/skeleton' {
  interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
    className?: string
  }
  export const Skeleton: React.ForwardRefExoticComponent<SkeletonProps>
} 