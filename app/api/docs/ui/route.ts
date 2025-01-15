/**
 * Swagger UI Route
 * Last Updated: 2024-03
 * 
 * This route serves the Swagger UI for the API documentation.
 * Features:
 * - Long-term caching for static content
 * - CORS enabled for cross-origin access
 * - HTML content type headers
 * - No authentication required (public access)
 */

import { NextResponse } from 'next/server';
import { HTTP_STATUS_OK, HTTP_STATUS_INTERNAL_SERVER_ERROR } from '@/lib/constants/http';
import { AppError } from '@/lib/errors';

// HTML template for Swagger UI
const swaggerHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="description" content="24/7 Dispatch Center API Documentation" />
  <title>24/7 Dispatch Center API</title>
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
        defaultModelsExpandDepth: 1,
        defaultModelExpandDepth: 1,
        defaultModelRendering: 'model',
        displayOperationId: false,
        displayRequestDuration: true,
        docExpansion: 'list',
        filter: true,
        showExtensions: true,
        showCommonExtensions: true,
        tryItOutEnabled: true,
      });
    };
  </script>
  <style>
    body {
      margin: 0;
      padding: 0;
    }
    .swagger-ui .topbar {
      display: none;
    }
    .swagger-ui .info {
      margin: 30px 0;
    }
    .swagger-ui .info .title {
      color: #3b4151;
    }
    .swagger-ui .scheme-container {
      box-shadow: none;
      padding: 0;
    }
  </style>
</body>
</html>
`;

/**
 * GET /api/docs/ui
 * Serves the Swagger UI HTML page
 */
export async function GET() {
  try {
    const headers = new Headers();
    
    // Set content type to HTML
    headers.set('Content-Type', 'text/html');
    
    // Enable CORS
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type');
    
    // Enable caching
    headers.set('Cache-Control', 'public, max-age=86400'); // 24 hours
    headers.set('X-Cache-TTL', '86400');

    return new NextResponse(swaggerHtml, {
      status: HTTP_STATUS_OK,
      headers,
    });
  } catch (error) {
    throw new AppError(
      'Failed to serve Swagger UI',
      HTTP_STATUS_INTERNAL_SERVER_ERROR,
      'Error generating documentation UI'
    );
  }
}

/**
 * OPTIONS /api/docs/ui
 * Handles CORS preflight requests
 */
export async function OPTIONS() {
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type');
  
  return new NextResponse(null, {
    status: HTTP_STATUS_OK,
    headers,
  });
} 