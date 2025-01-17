/**
 * Error Reporting Dashboard
 * Last Updated: 2025-01-17
 * 
 * This page provides an interface for viewing and analyzing error reports.
 * It integrates with our error logging system and Sentry for comprehensive error tracking.
 */

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui';
import { ErrorChart } from './components/error-chart';
import { ErrorFilters } from './components/error-filters';
import { ErrorMetrics } from './components/error-metrics';
import { ErrorList } from './components/error-list';

export const metadata = {
  title: 'Error Reports | Shifted Admin',
  description: 'View and analyze error reports.',
};

export default function ErrorReportsPage(): React.ReactElement {
  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-bold">Error Reports</h1>
          <p className="text-muted-foreground">
            View and analyze application errors
          </p>
        </div>

        <ErrorMetrics />

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-4">
            <ErrorFilters />
            <Card>
              <CardHeader>
                <CardTitle>Error Trends</CardTitle>
                <CardDescription>
                  Error frequency over time by severity
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                <ErrorChart data={[]} />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="details">
            <Card>
              <CardHeader>
                <CardTitle>Error Details</CardTitle>
                <CardDescription>
                  Detailed list of all errors
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ErrorList />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}