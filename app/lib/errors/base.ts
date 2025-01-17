/**
 * Base Error Types
 * Last updated: 2025-01-17
 */

import { HTTP_STATUS_INTERNAL_SERVER_ERROR } from '../api/constants';

export interface ErrorConfig {
  message: string;
  status?: number;
  code?: string;
  details?: Record<string, unknown> | undefined;
}

export class AppError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: Record<string, unknown> | undefined;

  constructor(config: ErrorConfig) {
    super(config.message);
    this.status = config.status ?? HTTP_STATUS_INTERNAL_SERVER_ERROR;
    this.code = config.code ?? 'INTERNAL_SERVER_ERROR';
    this.details = config.details;
    
    // Maintain proper prototype chain
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = this.constructor.name;
  }

  toJSON() {
    return {
      message: this.message,
      status: this.status,
      code: this.code,
      ...(this.details && { details: this.details })
    };
  }
} 