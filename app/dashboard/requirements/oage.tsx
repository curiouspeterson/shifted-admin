import { Suspense } from 'react';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { StaffingRequirements } from '@/components/StaffingRequirements';
import { TimeBasedRequirement } from '@/lib/types/scheduling';

async function RequirementsContent() {
  const supabase = createServerComponentClient({ cookies });
  
  const { data: requirements } = await supabase
    .from('time_based_requirements')
    .select('*')
    .order('day_of_week')
    .order('start_time');

  async function updateRequirement(requirement: TimeBasedRequirement) {
    'use server';
    
    const response = await fetch('/api/requirements', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requirement)
    });

    if (!response.ok) {
      throw new Error('Failed to update requirement');
    }

    return response.json();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Staffing Requirements</h1>
        <p className="text-muted-foreground">
          Manage minimum staffing levels for each time block and day of the week
        </p>
      </div>
      <StaffingRequirements 
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
