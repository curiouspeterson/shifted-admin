/**
 * Auth Validation Schemas
 * Last Updated: 2025-01-17
 * 
 * Defines validation schemas for authentication-related requests.
 */

import { z } from 'zod'

export const registerRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1)
})

export const registerResponseSchema = z.object({
  user: z.object({
    id: z.string(),
    email: z.string().email(),
    firstName: z.string(),
    lastName: z.string()
  })
})

export const loginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
})

export const loginResponseSchema = z.object({
  user: z.object({
    id: z.string(),
    email: z.string().email(),
    firstName: z.string(),
    lastName: z.string()
  }),
  token: z.string()
})

export type RegisterRequest = z.infer<typeof registerRequestSchema>
export type RegisterResponse = z.infer<typeof registerResponseSchema>
export type LoginRequest = z.infer<typeof loginRequestSchema>
export type LoginResponse = z.infer<typeof loginResponseSchema> 