# Supabase Integration

Last Updated: March 2024

This directory contains the application-level integration with Supabase, including client configurations, hooks, and utilities.

## Directory Structure

```
app/lib/supabase/
├── client/       # Browser client configuration
├── server/       # Server client configuration
├── middleware/   # Middleware client configuration
├── hooks/        # React hooks for Supabase
├── utils.ts      # Utility functions
├── constants.ts  # Shared constants
└── database.types.ts  # Generated database types
```

## Usage

### Client-Side Usage

```typescript
import { createBrowserClient, useSession } from '@/lib/supabase'

// Create a client instance
const supabase = createBrowserClient()

// Use authentication hooks
function MyComponent() {
  const { session, user, loading } = useSession()
  
  if (loading) return <div>Loading...</div>
  if (!session) return <div>Please sign in</div>
  
  return <div>Welcome {user.email}</div>
}
```

### Server-Side Usage

```typescript
import { createServerClient } from '@/lib/supabase'

// In a Server Component or API Route
async function getData() {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('your_table')
    .select('*')
    
  if (error) throw error
  return data
}
```

### Middleware Usage

```typescript
import { createMiddlewareClient } from '@/lib/supabase'
import { type NextRequest, NextResponse } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient(req, res)
  
  const { data: { session } } = await supabase.auth.getSession()
  
  // Your middleware logic here
  
  return res
}
```

## Features

### Authentication

- Session management
- Role-based access control
- Secure cookie handling
- Automatic token refresh

### Real-time Subscriptions

```typescript
import { useRealtimeSubscription } from '@/lib/supabase'

function LiveData() {
  useRealtimeSubscription('your_table', (payload) => {
    console.log('Change received:', payload)
  })
  
  return <div>Listening for changes...</div>
}
```

### Data Fetching

```typescript
import { useQuery } from '@/lib/supabase'

function DataList() {
  const { data, loading, error } = useQuery('your_table')
  
  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>
  
  return (
    <ul>
      {data?.map(item => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  )
}
```

## Error Handling

The integration includes a custom `SupabaseError` class for consistent error handling:

```typescript
import { SupabaseError } from '@/lib/supabase/utils'

try {
  // Your Supabase operation
} catch (error) {
  if (error instanceof SupabaseError) {
    console.error(`${error.code}: ${error.message}`)
  }
}
```

## Constants

Shared constants are available for consistent usage:

```typescript
import { TABLES, STATUS, ERROR_CODES } from '@/lib/supabase/constants'

// Table names
const tableName = TABLES.SCHEDULES

// Status values
const status = STATUS.PUBLISHED

// Error codes
const errorCode = ERROR_CODES.AUTH.NO_SESSION
```

## Type Safety

The integration provides full TypeScript support:

```typescript
import type { Database } from '@/lib/supabase/database.types'

// Type-safe table access
type Schedule = Database['public']['Tables']['schedules']['Row']
type Employee = Database['public']['Tables']['employees']['Row']
```

## Best Practices

1. **Client Creation**
   - Use the appropriate client for each context (browser, server, middleware)
   - Don't create multiple client instances unnecessarily
   - Handle client creation errors

2. **Authentication**
   - Always verify authentication in protected routes
   - Use role-based access control
   - Handle session expiration gracefully

3. **Data Fetching**
   - Use the provided hooks for consistent data fetching
   - Handle loading and error states
   - Implement proper error boundaries

4. **Real-time**
   - Clean up subscriptions when components unmount
   - Handle connection errors
   - Use appropriate channels for different updates

5. **Error Handling**
   - Use the custom error types
   - Provide meaningful error messages
   - Log errors appropriately

## Troubleshooting

Common issues and solutions:

1. **Authentication Issues**
   - Check environment variables
   - Verify cookie settings
   - Check session expiration

2. **Type Errors**
   - Regenerate types after schema changes
   - Check for null values
   - Use proper type assertions

3. **Real-time Issues**
   - Check WebSocket connection
   - Verify channel configuration
   - Check subscription cleanup

## Resources

- [Next.js App Router Documentation](https://nextjs.org/docs/app)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- [Supabase Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers) 