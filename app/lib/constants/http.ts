/**
 * HTTP Status Codes
 * Last Updated: 2025-01-17
 * 
 * Common HTTP status codes used throughout the application.
 */

// 2xx Success
export const HTTP_STATUS_OK = 200;
export const HTTP_STATUS_CREATED = 201;
export const HTTP_STATUS_ACCEPTED = 202;
export const HTTP_STATUS_NO_CONTENT = 204;

// 3xx Redirection
export const HTTP_STATUS_MOVED_PERMANENTLY = 301;
export const HTTP_STATUS_FOUND = 302;
export const HTTP_STATUS_NOT_MODIFIED = 304;
export const HTTP_STATUS_TEMPORARY_REDIRECT = 307;
export const HTTP_STATUS_PERMANENT_REDIRECT = 308;

// 4xx Client Errors
export const HTTP_STATUS_BAD_REQUEST = 400;
export const HTTP_STATUS_UNAUTHORIZED = 401;
export const HTTP_STATUS_FORBIDDEN = 403;
export const HTTP_STATUS_NOT_FOUND = 404;
export const HTTP_STATUS_METHOD_NOT_ALLOWED = 405;
export const HTTP_STATUS_CONFLICT = 409;
export const HTTP_STATUS_GONE = 410;
export const HTTP_STATUS_PRECONDITION_FAILED = 412;
export const HTTP_STATUS_PAYLOAD_TOO_LARGE = 413;
export const HTTP_STATUS_UNSUPPORTED_MEDIA_TYPE = 415;
export const HTTP_STATUS_TOO_MANY_REQUESTS = 429;

// 5xx Server Errors
export const HTTP_STATUS_INTERNAL_SERVER_ERROR = 500;
export const HTTP_STATUS_NOT_IMPLEMENTED = 501;
export const HTTP_STATUS_BAD_GATEWAY = 502;
export const HTTP_STATUS_SERVICE_UNAVAILABLE = 503;
export const HTTP_STATUS_GATEWAY_TIMEOUT = 504;

/**
 * Maps HTTP status codes to their default messages
 */
export const HTTP_STATUS_MESSAGES = {
  [HTTP_STATUS_OK]: 'OK',
  [HTTP_STATUS_CREATED]: 'Created',
  [HTTP_STATUS_ACCEPTED]: 'Accepted',
  [HTTP_STATUS_NO_CONTENT]: 'No Content',
  [HTTP_STATUS_MOVED_PERMANENTLY]: 'Moved Permanently',
  [HTTP_STATUS_FOUND]: 'Found',
  [HTTP_STATUS_NOT_MODIFIED]: 'Not Modified',
  [HTTP_STATUS_TEMPORARY_REDIRECT]: 'Temporary Redirect',
  [HTTP_STATUS_PERMANENT_REDIRECT]: 'Permanent Redirect',
  [HTTP_STATUS_BAD_REQUEST]: 'Bad Request',
  [HTTP_STATUS_UNAUTHORIZED]: 'Unauthorized',
  [HTTP_STATUS_FORBIDDEN]: 'Forbidden',
  [HTTP_STATUS_NOT_FOUND]: 'Not Found',
  [HTTP_STATUS_METHOD_NOT_ALLOWED]: 'Method Not Allowed',
  [HTTP_STATUS_CONFLICT]: 'Conflict',
  [HTTP_STATUS_GONE]: 'Gone',
  [HTTP_STATUS_PRECONDITION_FAILED]: 'Precondition Failed',
  [HTTP_STATUS_PAYLOAD_TOO_LARGE]: 'Payload Too Large',
  [HTTP_STATUS_UNSUPPORTED_MEDIA_TYPE]: 'Unsupported Media Type',
  [HTTP_STATUS_TOO_MANY_REQUESTS]: 'Too Many Requests',
  [HTTP_STATUS_INTERNAL_SERVER_ERROR]: 'Internal Server Error',
  [HTTP_STATUS_NOT_IMPLEMENTED]: 'Not Implemented',
  [HTTP_STATUS_BAD_GATEWAY]: 'Bad Gateway',
  [HTTP_STATUS_SERVICE_UNAVAILABLE]: 'Service Unavailable',
  [HTTP_STATUS_GATEWAY_TIMEOUT]: 'Gateway Timeout'
} as const; 