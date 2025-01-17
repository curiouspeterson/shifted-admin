/**
 * HTTP Status Code Constants
 * Last Updated: 2025-01-17
 * 
 * Centralized HTTP status codes following RFC 7231 standards.
 */

// 2xx Success
export const HTTP_STATUS_OK = 200;
export const HTTP_STATUS_CREATED = 201;
export const HTTP_STATUS_NO_CONTENT = 204;

// 4xx Client Errors
export const HTTP_STATUS_BAD_REQUEST = 400;
export const HTTP_STATUS_UNAUTHORIZED = 401;
export const HTTP_STATUS_FORBIDDEN = 403;
export const HTTP_STATUS_NOT_FOUND = 404;
export const HTTP_STATUS_CONFLICT = 409;
export const HTTP_STATUS_TOO_MANY_REQUESTS = 429;

// 5xx Server Errors
export const HTTP_STATUS_INTERNAL_SERVER_ERROR = 500;
export const HTTP_STATUS_SERVICE_UNAVAILABLE = 503; 