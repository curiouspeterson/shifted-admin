# Supabase Configuration

Last Updated: March 2024

This directory contains the Supabase project configuration, including database migrations, functions, seed data, and type definitions.

## Directory Structure

```
supabase/
├── functions/     # PostgreSQL functions and triggers
├── migrations/    # Database migrations
├── seed/         # Seed data for development
└── types/        # Generated TypeScript types
```

## Setup

1. Install the Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Link your project:
   ```bash
   supabase link --project-ref your-project-ref
   ```

3. Start the local development server:
   ```bash
   supabase start
   ```

## Development Workflow

### Database Changes

1. Create a new migration:
   ```bash
   supabase migration new your-migration-name
   ```

2. Apply migrations:
   ```bash
   supabase db push
   ```

3. Reset database (development only):
   ```bash
   supabase db reset
   ```

### Functions

1. Create a new function in `functions/`:
   ```sql
   -- functions/your_function_name.sql
   create or replace function your_function_name()
   returns void
   language plpgsql
   as $$
   begin
     -- Your function logic here
   end;
   $$;
   ```

2. Deploy functions:
   ```bash
   supabase functions deploy
   ```

### Type Generation

1. Generate TypeScript types:
   ```bash
   supabase gen types typescript --local > ../app/lib/supabase/database.types.ts
   ```

## Environment Variables

Required environment variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Best Practices

1. **Migrations**
   - Use meaningful names for migration files
   - Include both up and down migrations
   - Test migrations locally before deploying

2. **Functions**
   - Document function parameters and return types
   - Include error handling
   - Use appropriate security policies

3. **Types**
   - Keep generated types in sync with the database
   - Don't modify generated types manually
   - Use types consistently in the application

4. **Security**
   - Never commit sensitive keys
   - Use RLS policies for table access
   - Regularly audit security policies

## Common Tasks

### Adding a New Table

1. Create a migration:
   ```sql
   create table public.your_table (
     id uuid primary key default gen_random_uuid(),
     created_at timestamptz default now(),
     updated_at timestamptz default now()
   );

   -- Add RLS policies
   alter table public.your_table enable row level security;
   ```

2. Create policies:
   ```sql
   create policy "Users can view their own data"
   on public.your_table
   for select
   using (auth.uid() = user_id);
   ```

3. Generate updated types

### Modifying a Table

1. Create a migration:
   ```sql
   -- Add a column
   alter table public.your_table
   add column new_column text;

   -- Modify a column
   alter table public.your_table
   alter column existing_column set data type integer;
   ```

2. Update related functions and policies
3. Generate updated types

## Troubleshooting

Common issues and solutions:

1. **Migration Conflicts**
   - Reset the database locally
   - Check migration order
   - Verify migration history

2. **Type Generation Errors**
   - Ensure database is running
   - Check schema validity
   - Verify table permissions

3. **Function Deployment Issues**
   - Check syntax errors
   - Verify function dependencies
   - Check deployment logs

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/) 