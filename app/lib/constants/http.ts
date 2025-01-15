/**
 * HTTP Status Codes
 * Last Updated: 2024-03
 * 
 * This module defines constants for HTTP status codes used across the API.
 * Each constant includes a description of its typical usage.
 */

// 2xx Success
export const HTTP_STATUS_OK = 200;                    // Request succeeded
export const HTTP_STATUS_CREATED = 201;               // Resource created
export const HTTP_STATUS_ACCEPTED = 202;              // Request accepted but not completed
export const HTTP_STATUS_NO_CONTENT = 204;            // Request succeeded with no content to return

// 3xx Redirection
export const HTTP_STATUS_MOVED_PERMANENTLY = 301;     // Resource permanently moved
export const HTTP_STATUS_FOUND = 302;                 // Resource temporarily moved
export const HTTP_STATUS_NOT_MODIFIED = 304;          // Resource not modified since last request

// 4xx Client Errors
export const HTTP_STATUS_BAD_REQUEST = 400;           // Invalid request format/syntax
export const HTTP_STATUS_UNAUTHORIZED = 401;          // Authentication required
export const HTTP_STATUS_FORBIDDEN = 403;             // Authenticated but not authorized
export const HTTP_STATUS_NOT_FOUND = 404;             // Resource not found
export const HTTP_STATUS_METHOD_NOT_ALLOWED = 405;    // HTTP method not allowed
export const HTTP_STATUS_CONFLICT = 409;              // Request conflicts with current state
export const HTTP_STATUS_GONE = 410;                  // Resource no longer available
export const HTTP_STATUS_PRECONDITION_FAILED = 412;   // Precondition check failed
export const HTTP_STATUS_PAYLOAD_TOO_LARGE = 413;     // Request payload too large
export const HTTP_STATUS_UNSUPPORTED_MEDIA_TYPE = 415;// Media type not supported
export const HTTP_STATUS_TOO_MANY_REQUESTS = 429;     // Rate limit exceeded

// 5xx Server Errors
export const HTTP_STATUS_INTERNAL_SERVER_ERROR = 500; // Unexpected server error
export const HTTP_STATUS_NOT_IMPLEMENTED = 501;       // Functionality not implemented
export const HTTP_STATUS_BAD_GATEWAY = 502;           // Invalid response from upstream server
export const HTTP_STATUS_SERVICE_UNAVAILABLE = 503;   // Service temporarily unavailable
export const HTTP_STATUS_GATEWAY_TIMEOUT = 504;       // Upstream server timeout

/**
 * Status Code Categories
 * Utility functions to check status code types
 */
export const isSuccessStatus = (status: number) => status >= 200 && status < 300;
export const isRedirectStatus = (status: number) => status >= 300 && status < 400;
export const isClientErrorStatus = (status: number) => status >= 400 && status < 500;
export const isServerErrorStatus = (status: number) => status >= 500 && status < 600; 