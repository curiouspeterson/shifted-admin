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
  CardTitle
} from '@/components/ui/card';
import { ErrorMetrics } from './components/error-metrics';
import { ErrorList } from './components/error-list';
import { ErrorChart } from './components/error-chart';
import { ErrorFilters } from './components/error-filters';

export const metadata = {
  title: 'Error Reports | Admin Dashboard',
  description: 'View and analyze application errors and exceptions',
};

export default function ErrorReportsPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Error Reports</h1>
        <p className="text-muted-foreground">
          Monitor and analyze application errors and exceptions
        </p>
      </div>

      <div className="mb-6">
        <ErrorFilters />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <ErrorMetrics />
      </div>

      <Tabs defaultValue="overview" className="mt-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="errors">Error List</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Error Overview</CardTitle>
              <CardDescription>
                Error occurrence trends and patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ErrorChart />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="errors">
          <Card>
            <CardHeader>
              <CardTitle>Error List</CardTitle>
              <CardDescription>
                Detailed list of all recorded errors
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ErrorList />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>Error Trends</CardTitle>
              <CardDescription>
                Analysis of error patterns and frequencies
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Implement error trends visualization */}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}