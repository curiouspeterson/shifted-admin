/**
 * API Documentation UI Route Handler
 * Last Updated: 2025-01-17
 * 
 * Serves the Swagger UI for API documentation with proper caching.
 */

import { RateLimiter } from '@/lib/rate-limiting'
import { createRouteHandler, type ApiResponse } from '@/lib/api'
import { cacheConfigs } from '@/lib/cache'
import { NextResponse } from 'next/server'

// Rate limiter: 100 requests per minute
const rateLimiter = new RateLimiter({
  points: 100,
  duration: 60, // 1 minute
  blockDuration: 300, // 5 minutes
  keyPrefix: 'docs-ui'
})

// Cache configuration for docs UI
const docsUiCacheConfig = {
  ...cacheConfigs.static,
  prefix: 'api:docs:ui'
}

interface SwaggerUIResponse {
  html: string
}

export const GET = createRouteHandler({
  rateLimit: rateLimiter,
  handler: async () => {
    try {
      const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content="Shifted Admin API Documentation" />
    <title>Shifted Admin API</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
</head>
<body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js" crossorigin></script>
    <script>
        window.onload = () => {
            window.ui = SwaggerUIBundle({
                url: '/api/docs',
                dom_id: '#swagger-ui',
                deepLinking: true,
                presets: [
                    SwaggerUIBundle.presets.apis,
                    SwaggerUIBundle.SwaggerUIStandalonePreset
                ],
                plugins: [
                    SwaggerUIBundle.plugins.DownloadUrl
                ],
                layout: "BaseLayout",
                supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch'],
                defaultModelsExpandDepth: 2,
                defaultModelExpandDepth: 2,
                displayRequestDuration: true,
                docExpansion: "list",
                filter: true,
                showExtensions: true,
                showCommonExtensions: true,
                tryItOutEnabled: true
            });
        };
    </script>
    <style>
        body {
            margin: 0;
            background: #fafafa;
        }
        .swagger-ui .topbar {
            background-color: #000;
            padding: 10px 0;
        }
        .swagger-ui .info {
            margin: 20px 0;
        }
        .swagger-ui .scheme-container {
            background-color: #fff;
            box-shadow: 0 1px 2px 0 rgba(0,0,0,0.1);
        }
    </style>
</body>
</html>`

      return NextResponse.json<ApiResponse<SwaggerUIResponse>>(
        { data: { html } },
        {
          headers: {
            'Content-Type': 'text/html',
            'Cache-Control': docsUiCacheConfig.control
          }
        }
      )
    } catch (error) {
      console.error('Failed to serve Swagger UI:', error)
      return NextResponse.json<ApiResponse<SwaggerUIResponse>>(
        { error: 'Failed to generate documentation UI' },
        { status: 500 }
      )
    }
  }
}) 