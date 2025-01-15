/**
 * OpenAPI Documentation Utility
 * Last Updated: 2024-03
 * 
 * This module provides utilities for generating OpenAPI documentation
 * from route handlers and schemas.
 */

import { OpenAPIV3 } from 'openapi-types';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { HTTP_STATUS_OK, HTTP_STATUS_CREATED, HTTP_STATUS_BAD_REQUEST } from '../constants/http';

// Valid HTTP methods for OpenAPI paths
type HttpMethod = 'get' | 'put' | 'post' | 'delete' | 'options' | 'head' | 'patch' | 'trace';

/**
 * OpenAPI document configuration
 */
export interface OpenAPIConfig {
  title: string;
  version: string;
  description?: string;
  servers?: OpenAPIV3.ServerObject[];
  tags?: OpenAPIV3.TagObject[];
  security?: OpenAPIV3.SecurityRequirementObject[];
}

/**
 * Route documentation configuration
 */
export interface RouteDocConfig {
  /**
   * Operation summary
   */
  summary: string;

  /**
   * Operation description
   */
  description?: string;

  /**
   * Operation tags
   */
  tags?: string[];

  /**
   * Whether the operation requires authentication
   */
  requireAuth?: boolean;

  /**
   * Whether the operation requires supervisor role
   */
  requireSupervisor?: boolean;

  /**
   * Query parameters schema
   */
  querySchema?: z.ZodType<any>;

  /**
   * Request body schema
   */
  bodySchema?: z.ZodType<any>;

  /**
   * Response schema
   */
  responseSchema?: z.ZodType<any>;

  /**
   * Rate limit configuration
   */
  rateLimit?: {
    limit: number;
    window: number;
  };

  /**
   * Cache configuration
   */
  cache?: {
    ttl: number;
    public?: boolean;
  };
}

/**
 * OpenAPI document generator
 */
export class OpenAPIGenerator {
  private document: OpenAPIV3.Document;

  constructor(config: OpenAPIConfig) {
    this.document = {
      openapi: '3.0.3',
      info: {
        title: config.title,
        version: config.version,
        description: config.description,
      },
      servers: config.servers || [
        {
          url: '/',
          description: 'Current environment',
        },
      ],
      tags: config.tags || [],
      paths: {},
      components: {
        schemas: {
          Error: {
            type: 'object',
            properties: {
              error: {
                type: 'string',
              },
              data: {
                type: 'object',
                nullable: true,
              },
              metadata: {
                type: 'object',
                properties: {
                  errorCode: {
                    type: 'string',
                  },
                  validation: {
                    type: 'object',
                    additionalProperties: {
                      type: 'array',
                      items: {
                        type: 'string',
                      },
                    },
                  },
                },
              },
            },
          } as OpenAPIV3.SchemaObject,
        },
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
      security: config.security || [
        {
          bearerAuth: [],
        },
      ],
    };
  }

  /**
   * Add a route to the documentation
   */
  addRoute(
    path: string,
    method: string,
    config: RouteDocConfig
  ): void {
    const operation: OpenAPIV3.OperationObject = {
      summary: config.summary,
      description: config.description,
      tags: config.tags,
      security: config.requireAuth ? [{ bearerAuth: [] }] : [],
      parameters: [],
      responses: {
        [HTTP_STATUS_OK]: {
          description: 'Successful response',
          content: {
            'application/json': {
              schema: config.responseSchema
                ? (zodToJsonSchema(config.responseSchema) as OpenAPIV3.SchemaObject)
                : {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'object',
                      },
                      error: {
                        type: 'object',
                        nullable: true,
                      },
                    },
                  } as OpenAPIV3.SchemaObject,
            },
          },
        },
        [HTTP_STATUS_BAD_REQUEST]: {
          description: 'Bad request',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
      },
    };

    // Add query parameters
    if (config.querySchema) {
      const querySchema = zodToJsonSchema(config.querySchema) as OpenAPIV3.SchemaObject;
      if ('properties' in querySchema) {
        Object.entries(querySchema.properties || {}).forEach(([name, schema]) => {
          operation.parameters?.push({
            name,
            in: 'query',
            schema: schema as OpenAPIV3.SchemaObject,
            required: Array.isArray(querySchema.required) && querySchema.required.includes(name),
          });
        });
      }
    }

    // Add request body
    if (config.bodySchema) {
      operation.requestBody = {
        required: true,
        content: {
          'application/json': {
            schema: zodToJsonSchema(config.bodySchema) as OpenAPIV3.SchemaObject,
          },
        },
      };
    }

    // Add rate limit documentation
    if (config.rateLimit) {
      operation.description = `${operation.description || ''}\n\nRate limit: ${
        config.rateLimit.limit
      } requests per ${config.rateLimit.window} seconds`;
    }

    // Add cache documentation
    if (config.cache) {
      operation.description = `${operation.description || ''}\n\nCache TTL: ${
        config.cache.ttl
      } seconds (${config.cache.public ? 'public' : 'private'})`;
    }

    // Add role requirement
    if (config.requireSupervisor) {
      operation.description = `${
        operation.description || ''
      }\n\nRequires supervisor role`;
    }

    // Add path to document
    if (!this.document.paths[path]) {
      this.document.paths[path] = {};
    }

    // Ensure the method is a valid HTTP method
    const methodKey = method.toLowerCase() as HttpMethod;
    if (!this.isValidHttpMethod(methodKey)) {
      throw new Error(`Invalid HTTP method: ${method}`);
    }

    // Update the path item with the operation
    const pathItem = this.document.paths[path] as Record<HttpMethod, OpenAPIV3.OperationObject>;
    pathItem[methodKey] = operation;
  }

  /**
   * Add a schema to the documentation
   */
  addSchema(name: string, schema: z.ZodType<any>): void {
    if (!this.document.components) {
      this.document.components = {};
    }
    if (!this.document.components.schemas) {
      this.document.components.schemas = {};
    }
    this.document.components.schemas[name] = zodToJsonSchema(schema) as OpenAPIV3.SchemaObject;
  }

  /**
   * Get the complete OpenAPI document
   */
  getDocument(): OpenAPIV3.Document {
    return this.document;
  }

  /**
   * Check if a string is a valid HTTP method
   */
  private isValidHttpMethod(method: string): method is HttpMethod {
    return ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'].includes(method);
  }
}

/**
 * Create an OpenAPI document generator
 */
export function createOpenAPIGenerator(config: OpenAPIConfig) {
  return new OpenAPIGenerator(config);
} 