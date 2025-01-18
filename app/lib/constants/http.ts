/**
 * HTTP Constants
 * Last Updated: 2025-03-19
 * 
 * Common HTTP status codes and related constants.
 */

// 2xx Success
export const HTTP_STATUS_OK = 200;
export const HTTP_STATUS_CREATED = 201;
export const HTTP_STATUS_ACCEPTED = 202;
export const HTTP_STATUS_NO_CONTENT = 204;

// 3xx Redirection
export const HTTP_STATUS_MOVED_PERMANENTLY = 301;
export const HTTP_STATUS_FOUND = 302;
export const HTTP_STATUS_SEE_OTHER = 303;
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
export const HTTP_STATUS_UNPROCESSABLE_ENTITY = 422;
export const HTTP_STATUS_TOO_MANY_REQUESTS = 429;

// 5xx Server Errors
export const HTTP_STATUS_INTERNAL_SERVER_ERROR = 500;
export const HTTP_STATUS_NOT_IMPLEMENTED = 501;
export const HTTP_STATUS_BAD_GATEWAY = 502;
export const HTTP_STATUS_SERVICE_UNAVAILABLE = 503;
export const HTTP_STATUS_GATEWAY_TIMEOUT = 504; 