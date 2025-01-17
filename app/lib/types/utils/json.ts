/**
 * JSON Utility Types
 * Last Updated: 2025-03-19
 * 
 * Defines types for handling JSON data in a type-safe way.
 * These types are used throughout the application for
 * serialization and deserialization of data.
 */

/**
 * JSON primitive types
 */
export type JsonPrimitive = string | number | boolean | null

/**
 * JSON object type
 */
export type JsonObject = { [key: string]: Json }

/**
 * JSON array type
 */
export type JsonArray = Json[]

/**
 * JSON value type
 * Represents any valid JSON value
 */
export type Json = JsonPrimitive | JsonObject | JsonArray

/**
 * Type guard for JSON primitive values
 */
export function isJsonPrimitive(value: unknown): value is JsonPrimitive {
  return (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  )
}

/**
 * Type guard for JSON objects
 */
export function isJsonObject(value: unknown): value is JsonObject {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.values(value).every(v => isJson(v))
  )
}

/**
 * Type guard for JSON arrays
 */
export function isJsonArray(value: unknown): value is JsonArray {
  return Array.isArray(value) && value.every(v => isJson(v))
}

/**
 * Type guard for any JSON value
 */
export function isJson(value: unknown): value is Json {
  return (
    isJsonPrimitive(value) ||
    isJsonObject(value) ||
    isJsonArray(value)
  )
}

/**
 * Helper type to extract JSON keys
 */
export type JsonKeys<T> = {
  [K in keyof T]: T[K] extends Json ? K : never
}[keyof T]

/**
 * Helper type to make all properties JSON compatible
 */
export type JsonCompatible<T> = {
  [K in keyof T]: T[K] extends Json ? T[K] : never
} 