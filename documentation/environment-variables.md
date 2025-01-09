# Environment Variables Documentation

This document outlines all environment variables required for the 24/7 Dispatch Center Scheduling App.

## Required Variables

### Supabase Configuration
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # Only for secure server-side operations
```

### Application Configuration
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Your application URL
NEXT_PUBLIC_APP_NAME="Dispatch Center Scheduler"
```

### Email Configuration (Optional)
```env
EMAIL_SERVER_HOST=smtp.example.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your_smtp_username
EMAIL_SERVER_PASSWORD=your_smtp_password
EMAIL_FROM=noreply@yourdomain.com
```

## Development vs Production

### Development
- Use `.env.local` for local development
- Keep sensitive keys secure and never commit them to version control
- Use development/staging Supabase project

### Production
- Set environment variables in your hosting platform (e.g., Vercel)
- Use production Supabase project
- Ensure all required variables are set before deployment

## Security Notes

1. Never commit `.env` files to version control
2. Keep service role key secure and only use for server-side operations
3. Use appropriate access policies in Supabase
4. Regularly rotate keys and credentials

## Adding New Variables

When adding new environment variables:

1. Add them to this documentation
2. Update `.env.example` if it exists
3. Update deployment configuration
4. Notify team members

## Troubleshooting

Common issues and their solutions:

1. "Configuration Error: There is no Supabase client set"
   - Check if NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set correctly

2. "Invalid API key"
   - Verify Supabase keys are correct
   - Check if you're using the right project

3. "Missing environment variables"
   - Copy all required variables from this document
   - Ensure they're set in your environment 