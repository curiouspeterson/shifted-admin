/**
 * Shift Form Component
 * Last Updated: 2024-01-16
 * 
 * A form component for creating and editing shifts with
 * validation and offline support.
 */

'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FormInput } from '@/components/ui/form-input'
import { FormDatePicker } from '@/components/ui/form-date-picker'
import { Badge } from '@/components/ui/badge'
import { Plus, X } from 'lucide-react'

const shiftSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
  requirements: z.array(z.string()).min(1, 'At least one requirement is needed')
})

type ShiftFormData = z.infer<typeof shiftSchema>

interface ShiftFormProps {
  onSubmit: (data: ShiftFormData) => void
  isSubmitting?: boolean
  isOffline?: boolean
}

export function ShiftForm({
  onSubmit,
  isSubmitting = false,
  isOffline = false
}: ShiftFormProps) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors }
  } = useForm<ShiftFormData>({
    resolver: zodResolver(shiftSchema),
    defaultValues: {
      startDate: '',
      endDate: '',
      requirements: []
    }
  })

  const requirements = watch('requirements')

  const addRequirement = (requirement: string) => {
    if (!requirement.trim()) return
    setValue('requirements', [...requirements, requirement.trim()])
  }

  const removeRequirement = (index: number) => {
    setValue(
      'requirements',
      requirements.filter((_, i) => i !== index)
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Shift</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormDatePicker
              id="startDate"
              name="startDate"
              label="Start Date"
              control={control}
              error={errors.startDate?.message}
              required
            />
            <FormDatePicker
              id="endDate"
              name="endDate"
              label="End Date"
              control={control}
              error={errors.endDate?.message}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Requirements
              {errors.requirements && (
                <span className="text-red-500 ml-1">
                  {errors.requirements.message}
                </span>
              )}
            </label>
            
            <div className="flex gap-2">
              <FormInput
                id="requirement"
                label=""
                placeholder="Add requirement"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    const input = e.currentTarget as HTMLInputElement
                    addRequirement(input.value)
                    input.value = ''
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => {
                  const input = document.getElementById('requirement') as HTMLInputElement
                  addRequirement(input.value)
                  input.value = ''
                }}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 mt-2">
              {requirements.map((req, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  {req}
                  <button
                    type="button"
                    onClick={() => removeRequirement(index)}
                    className="hover:text-red-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Shift'}
            </Button>
          </div>

          {isOffline && (
            <p className="text-sm text-yellow-600 mt-2">
              You are offline. Changes will be saved locally and synced when back online.
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  )
} 