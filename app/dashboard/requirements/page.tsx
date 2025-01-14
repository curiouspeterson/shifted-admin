/**
 * Staffing Requirements Page
 * Last Updated: 2024
 * 
 * This page component provides an interface for managing staffing requirements
 * across different time blocks and days of the week. It allows supervisors to
 * set and update minimum staffing levels, maximum staff counts, and supervisor
 * requirements for each time period.
 * 
 * Features:
 * - Server-side rendering of requirements data
 * - Real-time updates with automatic revalidation
 * - Suspense-based loading states
 * - Error handling for database operations
 * - Role-based access control
 * 
 * Component Structure:
 * - RequirementsPage: Top-level page component with Suspense wrapper
 * - RequirementsContent: Main content component that fetches and displays data
 * - StaffingRequirementsEditor: Reusable editor component for requirements
 */

import { Suspense } from 'react';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { StaffingRequirementsEditor } from '@/components/StaffingRequirementsEditor';
import { TimeBasedRequirement } from '@/lib/types/scheduling';
import { revalidatePath } from 'next/cache';

/**
 * Updates a single time-based staffing requirement
 * 
 * Server action that updates the staffing levels for a specific time block.
 * Automatically revalidates the requirements page after successful update.
 * 
 * @param requirement - The requirement object with updated values
 * @throws Error if the database update fails
 */
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

/**
 * Main content component for the requirements page
 * 
 * Fetches requirements data from Supabase and renders the editor component.
 * Uses server-side data fetching for optimal performance and SEO.
 * 
 * @returns JSX element containing the requirements editor interface
 */
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

/**
 * Top-level page component for staffing requirements
 * 
 * Wraps the main content in a Suspense boundary for loading states
 * and provides consistent page layout with container padding.
 * 
 * @returns JSX element for the complete requirements page
 */
export default function RequirementsPage() {
  return (
    <div className="container py-6">
      <Suspense fallback={<div>Loading requirements...</div>}>
        <RequirementsContent />
      </Suspense>
    </div>
  );
}
