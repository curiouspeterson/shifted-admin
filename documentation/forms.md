# Form Components and Patterns
Last Updated: 2024-03

This document outlines the form components and patterns used in the application.

## Overview

The form system consists of:
- Generic form hook for state management and validation
- Base form components for consistent UI
- Zod schema validation
- Type-safe form handling
- Standardized error handling

## Form Hook

The `useForm` hook provides a unified way to handle form state and validation:

```typescript
const {
  form,
  isLoading,
  error,
  handleSubmit,
  reset,
} = useForm<typeof mySchema>({
  schema: mySchema,
  defaultValues: {
    // Initial form values
  },
  onSubmit: async (data) => {
    // Handle form submission
  },
  onSuccess: () => {
    // Handle success
  },
  onError: (error) => {
    // Handle error
  },
});
```

## Base Components

### FormWrapper

Provides loading states and error handling:

```typescript
<FormWrapper
  isLoading={isLoading}
  error={error}
  onSubmit={handleSubmit}
>
  {/* Form fields */}
</FormWrapper>
```

### FormInput

Text input with validation:

```typescript
<FormInput
  name="fieldName"
  label="Field Label"
  description="Help text"
  placeholder="Enter value"
/>
```

### FormSelect

Dropdown selection:

```typescript
<FormSelect
  name="status"
  label="Status"
  options={[
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
  ]}
/>
```

### FormDatePicker

Date selection with validation:

```typescript
<FormDatePicker
  name="date"
  label="Select Date"
  minDate={new Date()}
  maxDate={new Date('2025-12-31')}
/>
```

## Validation

Forms use Zod for schema validation:

```typescript
const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  age: z.number().min(18, 'Must be 18 or older'),
}).refine((data) => {
  // Custom validation
  return true;
}, {
  message: 'Custom validation failed',
});
```

## Error Handling

Errors are handled consistently:

1. Validation Errors:
   - Displayed inline with fields
   - Clear error messages
   - Field highlighting

2. Submission Errors:
   - Shown at form level
   - Detailed error information
   - Recovery options

## Example Implementation

See `components/forms/examples/ScheduleForm.tsx` for a complete example that demonstrates:
- Form hook usage
- All base components
- Validation
- Error handling
- Loading states
- Success handling

## Best Practices

1. Form State:
   - Use the form hook for state management
   - Avoid local state when possible
   - Handle loading states properly

2. Validation:
   - Define schemas separately
   - Use meaningful error messages
   - Add custom validation when needed

3. Error Handling:
   - Always handle submission errors
   - Provide clear error messages
   - Include recovery options

4. Types:
   - Use TypeScript for type safety
   - Infer types from schemas
   - Define proper interfaces

5. Components:
   - Use base components consistently
   - Follow accessibility guidelines
   - Maintain consistent styling

## Migration Guide

When migrating existing forms:

1. Replace direct React Hook Form usage with `useForm`
2. Update validation to use Zod schemas
3. Replace form elements with base components
4. Add proper error handling
5. Update types to use schema inference

## Notes

- Forms are client components (`'use client'`)
- Base components handle accessibility
- Validation is type-safe
- Error handling is standardized
- Loading states are managed automatically 