/**
 * Schedule Form Hook
 * Last Updated: 2024-03-20 00:10 PST
 * 
 * This hook provides form state and error handling for schedule forms.
 */

'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { scheduleInputSchema, type ScheduleInput, type Schedule, ScheduleStatus } from '@/lib/schemas/schedule';
import { useFormError } from './useFormError';
import { createSchedule } from '@/lib/actions/schedule/client';
import { createError } from '@/lib/errors/utils';
import { ErrorCodes } from '@/lib/errors/types';

interface UseScheduleFormProps {
  initialData?: Partial<ScheduleInput>;
  onSuccess?: (data: Schedule) => void;
  onError?: (error: unknown) => void;
}

interface UseScheduleFormReturn {
  data: Partial<ScheduleInput>;
  error: ReturnType<typeof useFormError>['error'];
  isSubmitting: boolean;
  setFieldValue: (field: keyof ScheduleInput, value: any) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  reset: () => void;
}

const defaultScheduleData: Partial<ScheduleInput> = {
  status: ScheduleStatus.DRAFT,
  is_active: true,
};

/**
 * Schedule form hook
 */
export function useScheduleForm({
  initialData = defaultScheduleData,
  onSuccess,
  onError,
}: UseScheduleFormProps = {}): UseScheduleFormReturn {
  const router = useRouter();
  const [data, setData] = useState<Partial<ScheduleInput>>(initialData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const {
    error,
    clearError,
    handleError,
  } = useFormError<ScheduleInput>({
    onError,
  });

  /**
   * Update form field value
   */
  const setFieldValue = useCallback((field: keyof ScheduleInput, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
    clearError();
  }, [clearError]);

  /**
   * Reset form to initial state
   */
  const reset = useCallback(() => {
    setData(initialData);
    clearError();
    setIsSubmitting(false);
  }, [initialData, clearError]);

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setIsSubmitting(true);

    try {
      // Check required fields
      if (!data.name?.trim()) {
        throw createError(
          ErrorCodes.VALIDATION_ERROR,
          'Name is required'
        );
      }

      if (!data.start_date) {
        throw createError(
          ErrorCodes.VALIDATION_ERROR,
          'Start date is required'
        );
      }

      if (!data.end_date) {
        throw createError(
          ErrorCodes.VALIDATION_ERROR,
          'End date is required'
        );
      }

      if (new Date(data.start_date) > new Date(data.end_date)) {
        throw createError(
          ErrorCodes.VALIDATION_ERROR,
          'End date must be after start date'
        );
      }

      // Create complete schedule data
      const scheduleData: ScheduleInput = {
        name: data.name,
        start_date: data.start_date,
        end_date: data.end_date,
        status: data.status || ScheduleStatus.DRAFT,
        is_active: data.is_active ?? true,
        version: data.version,
        description: data.description,
        created_by: data.created_by,
        updated_by: data.updated_by,
        created_at: data.created_at,
        updated_at: data.updated_at,
        id: data.id,
      };

      // Create schedule
      const result = await createSchedule(scheduleData);
      if (result) {
        onSuccess?.(result);
        reset();
        router.refresh();
      }
    } catch (error) {
      handleError(error);
    } finally {
      setIsSubmitting(false);
    }
  }, [data, onSuccess, reset, router, handleError, clearError]);

  return {
    data,
    error,
    isSubmitting,
    setFieldValue,
    handleSubmit,
    reset,
  };
} 