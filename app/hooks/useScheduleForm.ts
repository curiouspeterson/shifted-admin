/**
 * Schedule Form Hook
 * Last Updated: 2024-03-20 02:10 PST
 * 
 * This hook provides form state management and error handling for schedule forms.
 */

import { useCallback } from 'react';
import { useFormError } from './use-form-error';
import { scheduleInputSchema } from '@/lib/schemas/schedule';
import { createSchedule } from '@/lib/actions/schedule';
import { toast } from '@/components/ui/toast';

export interface ScheduleFormData {
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  status: 'draft' | 'published';
  is_active: boolean;
}

const defaultScheduleData: ScheduleFormData = {
  name: '',
  description: '',
  start_date: '',
  end_date: '',
  status: 'draft',
  is_active: true,
};

export function useScheduleForm(initialData: Partial<ScheduleFormData> = {}) {
  const {
    errors,
    setError,
    clearErrors,
    validateData,
  } = useFormError<ScheduleFormData>();

  const handleSubmit = useCallback(async (data: Partial<ScheduleFormData>) => {
    clearErrors();

    try {
      const validatedData = await validateData(data, scheduleInputSchema);
      const result = await createSchedule(validatedData);

      toast({
        title: 'Schedule created successfully',
        variant: 'success',
      });

      return result;
    } catch (error) {
      if (error instanceof Error) {
        setError('root', error.message);
        toast({
          title: 'Error creating schedule',
          description: error.message,
          variant: 'error',
        });
      }
      throw error;
    }
  }, [clearErrors, setError, validateData]);

  return {
    defaultData: { ...defaultScheduleData, ...initialData },
    errors,
    handleSubmit,
  };
} 