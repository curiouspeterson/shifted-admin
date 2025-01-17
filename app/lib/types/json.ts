/**
 * JSON Types and Validation
 * Last Updated: 2025-01-16
 * 
 * Central definition of JSON-related types and validation utilities.
 * This file serves as the single source of truth for JSON types
 * across the application.
 */

/**
 * Strongly typed JSON value
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

/**
 * Type guard to check if a value is a valid JSON value
 */
export function isJson(value: unknown): value is Json {
  if (value === null) return true;
  
  switch (typeof value) {
    case 'string':
    case 'number':
    case 'boolean':
      return true;
      
    case 'object':
      if (Array.isArray(value)) {
        return value.every(isJson);
      }
      if (value === null) return true;
      return Object.values(value).every(v => v === undefined || isJson(v));
      
    default:
      return false;
  }
}

/**
 * Type guard to check if a value is a JSON object
 */
export function isJsonObject(value: unknown): value is { [key: string]: Json | undefined } {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Type guard to check if a value is a JSON array
 */
export function isJsonArray(value: unknown): value is Json[] {
  return Array.isArray(value) && value.every(isJson);
}

/**
 * Safely parse a JSON string with type checking
 */
export function parseJson(value: string): Json {
  try {
    const parsed = JSON.parse(value);
    if (!isJson(parsed)) {
      throw new Error('Invalid JSON structure');
    }
    return parsed;
  } catch (error) {
    throw new Error(`Failed to parse JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Safely stringify a JSON value
 */
export function stringifyJson(value: Json): string {
  return JSON.stringify(value);
} 