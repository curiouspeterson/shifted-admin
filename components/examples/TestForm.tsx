'use client';

/**
 * Test Form Component
 * Last Updated: 2024-03
 * 
 * A demonstration component showcasing the implementation of our form
 * components and hooks.
 * 
 * Features:
 * - Form validation
 * - Error handling
 * - Field components
 * - Submit handling
 */

import * as React from 'react';
import * as z from 'zod';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useForm } from '@/lib/hooks';

// Form schema with validation
const testFormSchema = z.object({
  username: z.string().min(2, {
    message: 'Username must be at least 2 characters.',
  }),
  email: z.string().email({
    message: 'Please enter a valid email address.',
  }),
});

type TestFormValues = z.infer<typeof testFormSchema>;

/**
 * Test Form Component
 * Demonstrates form functionality using our components
 */
export function TestForm() {
  const form = useForm<TestFormValues>({
    schema: testFormSchema,
    defaultValues: {
      username: '',
      email: '',
    },
    onSubmit: async (values: TestFormValues) => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log(values);
    },
  });

  const onSubmit = form.handleSubmit;

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="space-y-6">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="Enter username" {...field} />
              </FormControl>
              <FormDescription>
                This is your public display name.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="Enter email"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                We'll never share your email.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? 'Submitting...' : 'Submit'}
        </Button>
      </form>
    </Form>
  );
} 