import { z } from 'zod';
import { scheduleSchema, assignmentSchema } from './schedule';

// Schedule creation form schema
export const scheduleFormSchema = scheduleSchema
  .omit({
    id: true,
    created_at: true,
    created_by: true,
    published_at: true,
    published_by: true,
    version: true
  })
  .extend({
    name: z.string().min(1, 'Schedule name is required'),
    description: z.string().optional(),
  });

// Assignment creation form schema
export const assignmentFormSchema = assignmentSchema
  .omit({
    id: true,
    created_at: true,
    updated_at: true,
    employee: true,
    shift: true,
  })
  .extend({
    employee_id: z.string().uuid('Invalid employee ID'),
    shift_id: z.string().uuid('Invalid shift ID'),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
      message: 'Date must be in YYYY-MM-DD format',
    }),
    is_supervisor_shift: z.boolean().default(false),
    overtime_hours: z.number().min(0).nullable(),
    overtime_status: z.enum(['none', 'pending', 'approved', 'rejected']).nullable(),
  });

// Infer TypeScript types from schemas
export type ScheduleFormData = z.infer<typeof scheduleFormSchema>;
export type AssignmentFormData = z.infer<typeof assignmentFormSchema>;

// Form error schema
export const formErrorSchema = z.object({
  message: z.string(),
  errors: z.record(z.string()).optional(),
}); 