/**
 * Button Client Component
 * Last Updated: 2025-03-19
 * 
 * Client-side wrapper for the button component.
 */

'use client'

import { Button as BaseButton } from '@/app/components/ui/button'
import type { ButtonProps } from '@/app/components/ui/button'

export function Button(props: ButtonProps) {
  return <BaseButton {...props} />
}

Button.displayName = 'Button' 