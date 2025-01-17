/**
 * Schedule Detail Page
 * Last Updated: 2024-03-21
 * 
 * Server Component that displays schedule details, assignments, and requirements.
 * Uses Partial Prerendering for static content and streaming for dynamic data.
 * Implements granular suspense boundaries and proper caching strategies.
 */

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { getScheduleDetails } from './utils/data-fetching';
import { HeaderLoader } from './components/loading';
import ScheduleHeader from './components/schedule-header';
import AsyncScheduleContent from './components/async-schedule-content';

interface SchedulePageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata(
  { params }: SchedulePageProps
): Promise<Metadata> {
  try {
    const response = await getScheduleDetails(params.id);
    
    if (response.status !== 'success') {
      return {
        title: 'Schedule Details',
        description: 'View and manage schedule details',
      };
    }
    
    const schedule = response.data;
    const startDate = new Date(schedule.start_date).toLocaleDateString();
    const endDate = new Date(schedule.end_date).toLocaleDateString();
    
    return {
      title: `Schedule ${startDate} - ${endDate}`,
      description: `View and manage schedule details for ${startDate} to ${endDate}`,
      openGraph: {
        title: `Schedule ${startDate} - ${endDate}`,
        description: `View and manage schedule details for ${startDate} to ${endDate}`,
        type: 'website',
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Schedule Details',
      description: 'View and manage schedule details',
    };
  }
}

export default async function SchedulePage({ params }: SchedulePageProps) {
  // Fetch static data first
  const scheduleResponse = await getScheduleDetails(params.id);
  
  if (scheduleResponse.status === 'notFound') {
    notFound();
  }
  
  if (scheduleResponse.status === 'error') {
    throw new Error(scheduleResponse.error.message);
  }
  
  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header with static data */}
      <Suspense fallback={<HeaderLoader />}>
        <ScheduleHeader schedule={scheduleResponse.data} />
      </Suspense>
      
      {/* Dynamic content with streaming */}
      <AsyncScheduleContent scheduleId={params.id} />
    </div>
  );
} 