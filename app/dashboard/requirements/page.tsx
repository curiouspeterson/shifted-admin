import { Suspense } from 'react';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { StaffingRequirementsEditor } from '@/components/StaffingRequirementsEditor';
import { TimeBasedRequirement } from '@/lib/types/scheduling';
import { revalidatePath } from 'next/cache';

async function updateRequirement(requirement: TimeBasedRequirement) {
  'use server';
  
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });
  
  const { error } = await supabase
    .from('time_based_requirements')
    .update({
      min_employees: requirement.min_employees,
      max_employees: requirement.max_employees,
      min_supervisors: requirement.min_supervisors,
      updated_at: new Date().toISOString()
    })
    .eq('id', requirement.id);

  if (error) {
    throw new Error('Failed to update requirement');
  }

  revalidatePath('/dashboard/requirements');
}

async function RequirementsContent() {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });
  
  const { data: requirements } = await supabase
    .from('time_based_requirements')
    .select('*')
    .order('day_of_week')
    .order('start_time');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Staffing Requirements</h1>
        <p className="text-muted-foreground">
          Manage minimum staffing levels for each time block and day of the week
        </p>
      </div>
      <StaffingRequirementsEditor 
        requirements={requirements || []}
        onUpdate={updateRequirement}
        isEditable={true}
      />
    </div>
  );
}

export default function RequirementsPage() {
  return (
    <div className="container py-6">
      <Suspense fallback={<div>Loading requirements...</div>}>
        <RequirementsContent />
      </Suspense>
    </div>
  );
}
