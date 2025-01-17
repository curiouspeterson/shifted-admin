# 24/7 Dispatch Center Scheduling Application

A comprehensive web application for managing employee schedules in 24/7 dispatch centers. Built with Next.js, TypeScript, and Supabase.

## Features

### Core Functionality
- 🔐 Secure authentication with email verification
- 👥 Employee management and role-based access control
- 📅 Bi-weekly schedule generation and management
- ⏰ Time-off request system
- 🔄 Shift management with various durations (4h, 10h, 12h)
- 📊 Staffing requirements tracking

### Technical Features
- Server-side rendering with Next.js 14
- Type-safe database operations with Supabase
- Real-time updates and notifications
- Responsive design with Tailwind CSS
- Modern UI components with shadcn/ui
- Comprehensive form validation with Zod

## Getting Started

### Prerequisites
- Node.js 18+
- npm/yarn
- Supabase account

### Environment Variables
Create a `.env.local` file with:

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
JWT_SECRET=
SUPABASE_ACCESS_TOKEN=
SUPABASE_DB_PASSWORD=

```

## Architecture

### Frontend
- Next.js 14 with App Router
- TypeScript for type safety
- Tailwind CSS for styling
- shadcn/ui component library
- Client-side state management with Zustand

### Backend
- Supabase for database postgres and authentication.
- Row-level security policies
- Optimized database indexes
- Server actions for API endpoints

```

## Project Structure

Directory structure:
└── curiouspeterson-shifted-admin/
    ├── README.md
    ├── components.json
    ├── instrumentation.ts
    ├── jest.config.js
    ├── jest.setup.js
    ├── jest.setup.ts
    ├── middleware.ts
    ├── next.config.js
    ├── output.txt
    ├── package.json
    ├── postcss.config.js
    ├── tailwind.config.ts
    ├── tsconfig.json
    ├── tsconfig.test.json
    ├── .cursorrules
    ├── .eslintignore
    ├── .eslintrc.json
    ├── app/
    │   ├── error.tsx
    │   ├── global-error.tsx
    │   ├── globals.css
    │   ├── layout.tsx
    │   ├── loading.tsx
    │   ├── not-found.tsx
    │   ├── page.tsx
    │   ├── providers.tsx
    │   ├── sw.ts
    │   ├── (auth)/
    │   │   ├── actions.ts
    │   │   ├── callback/
    │   │   │   └── route.ts
    │   │   ├── sign-in/
    │   │   │   ├── components.tsx
    │   │   │   └── page.tsx
    │   │   └── sign-up/
    │   │       └── page.tsx
    │   ├── __tests__/
    │   │   ├── sw.test.ts
    │   │   ├── components/
    │   │   │   ├── shifts/
    │   │   │   │   └── offline-shift-list.test.tsx
    │   │   │   └── ui/
    │   │   │       └── offline-indicator.test.tsx
    │   │   ├── hooks/
    │   │   │   └── use-offline-data.test.ts
    │   │   └── lib/
    │   │       └── storage/
    │   │           └── indexed-db.test.ts
    │   ├── actions/
    │   │   ├── data.ts
    │   │   └── employees.ts
    │   ├── admin/
    │   │   └── error-reports/
    │   │       ├── page.tsx
    │   │       └── components/
    │   │           ├── error-chart.tsx
    │   │           ├── error-filters.tsx
    │   │           ├── error-list.tsx
    │   │           └── error-metrics.tsx
    │   ├── api/
    │   │   ├── auth/
    │   │   │   ├── register/
    │   │   │   │   └── route.ts
    │   │   │   ├── sign-in/
    │   │   │   │   └── route.ts
    │   │   │   ├── sign-out/
    │   │   │   │   └── route.ts
    │   │   │   └── sign-up/
    │   │   │       └── route.ts
    │   │   ├── availability/
    │   │   │   └── route.ts
    │   │   ├── debug/
    │   │   │   └── headers/
    │   │   │       └── route.ts
    │   │   ├── docs/
    │   │   │   ├── route.ts
    │   │   │   └── ui/
    │   │   │       └── route.ts
    │   │   ├── employees/
    │   │   │   ├── route.ts
    │   │   │   └── [id]/
    │   │   │       └── route.ts
    │   │   ├── requests/
    │   │   │   ├── route.ts
    │   │   │   └── [id]/
    │   │   │       └── route.ts
    │   │   ├── schedules/
    │   │   │   ├── route.ts
    │   │   │   └── [id]/
    │   │   │       ├── route.ts
    │   │   │       ├── assignments/
    │   │   │       │   ├── route.ts
    │   │   │       │   └── [assignmentId]/
    │   │   │       │       └── route.ts
    │   │   │       └── requirements/
    │   │   │           └── route.ts
    │   │   ├── sentry-example-api/
    │   │   │   └── route.ts
    │   │   ├── shifts/
    │   │   │   └── route.ts
    │   │   ├── time-requirements/
    │   │   │   └── route.ts
    │   │   └── users/
    │   │       └── route.ts
    │   ├── components/
    │   │   ├── Modal.tsx
    │   │   ├── cached-content.tsx
    │   │   ├── dashboard-nav.tsx
    │   │   ├── employee-form.tsx
    │   │   ├── loading.tsx
    │   │   ├── offline-fallback.tsx
    │   │   ├── request-form.tsx
    │   │   ├── service-worker-status.tsx
    │   │   ├── staffing-requirements-editor.tsx
    │   │   ├── sync-status.tsx
    │   │   ├── test-modal.tsx
    │   │   ├── theme-provider.tsx
    │   │   ├── employees/
    │   │   │   └── employee-form.tsx
    │   │   ├── error/
    │   │   │   ├── ErrorBoundary.tsx
    │   │   │   └── error-boundary.tsx
    │   │   ├── forms/
    │   │   │   ├── assignment-form.tsx
    │   │   │   ├── index.ts
    │   │   │   ├── base/
    │   │   │   │   ├── base-form.tsx
    │   │   │   │   ├── date-field.tsx
    │   │   │   │   ├── date-picker.tsx
    │   │   │   │   ├── form-control.tsx
    │   │   │   │   ├── form-date-picker.tsx
    │   │   │   │   ├── form-field-wrapper.tsx
    │   │   │   │   ├── form-field.tsx
    │   │   │   │   ├── form-input.tsx
    │   │   │   │   ├── form-select.tsx
    │   │   │   │   ├── form-wrapper.tsx
    │   │   │   │   ├── index.ts
    │   │   │   │   ├── select-field.tsx
    │   │   │   │   └── textarea-field.tsx
    │   │   │   └── examples/
    │   │   │       ├── assignment-form.tsx
    │   │   │       └── index.ts
    │   │   ├── monitoring/
    │   │   │   ├── dashboard.tsx
    │   │   │   ├── performance-dashboard.tsx
    │   │   │   └── task-monitoring-dashboard.tsx
    │   │   ├── request/
    │   │   │   └── request-form.tsx
    │   │   ├── schedule/
    │   │   │   ├── schedule-filters.tsx
    │   │   │   ├── schedule-form.tsx
    │   │   │   └── schedule-list.tsx
    │   │   ├── shifts/
    │   │   │   ├── offline-shift-list.tsx
    │   │   │   ├── shift-form.tsx
    │   │   │   └── shift-list.tsx
    │   │   ├── sync/
    │   │   │   └── sync-status-indicator.tsx
    │   │   └── ui/
    │   │       ├── LoadingSpinner.tsx
    │   │       ├── OfflineIndicator.tsx
    │   │       ├── alert.tsx
    │   │       ├── badge.tsx
    │   │       ├── base-input.tsx
    │   │       ├── button.tsx
    │   │       ├── calendar.tsx
    │   │       ├── card.tsx
    │   │       ├── charts.tsx
    │   │       ├── checkbox.tsx
    │   │       ├── date-picker.tsx
    │   │       ├── date-range-picker.tsx
    │   │       ├── date-time-picker.tsx
    │   │       ├── dialog.tsx
    │   │       ├── form-date-picker.tsx
    │   │       ├── form-input-wrapper.tsx
    │   │       ├── form-input.tsx
    │   │       ├── form.tsx
    │   │       ├── index.ts
    │   │       ├── input.tsx
    │   │       ├── label.tsx
    │   │       ├── loading-spinner.tsx
    │   │       ├── modal.tsx
    │   │       ├── offline-indicator.tsx
    │   │       ├── page-header.tsx
    │   │       ├── popover.tsx
    │   │       ├── progress.tsx
    │   │       ├── select.tsx
    │   │       ├── skeleton.tsx
    │   │       ├── sonner.tsx
    │   │       ├── spinner.tsx
    │   │       ├── switch.tsx
    │   │       ├── table.tsx
    │   │       ├── tabs.tsx
    │   │       ├── textarea.tsx
    │   │       ├── toast.tsx
    │   │       └── charts/
    │   │           ├── bar-chart.tsx
    │   │           └── line-chart.tsx
    │   ├── dashboard/
    │   │   ├── layout.tsx
    │   │   ├── page.tsx
    │   │   ├── availability/
    │   │   │   └── page.tsx
    │   │   ├── employees/
    │   │   │   ├── page.tsx
    │   │   │   └── [id]/
    │   │   │       ├── edit-employee-form.tsx
    │   │   │       ├── not-found.tsx
    │   │   │       └── page.tsx
    │   │   ├── requests/
    │   │   │   └── page.tsx
    │   │   ├── requirements/
    │   │   │   └── page.tsx
    │   │   ├── schedules/
    │   │   │   ├── page.tsx
    │   │   │   ├── [id]/
    │   │   │   │   ├── error.tsx
    │   │   │   │   ├── page.tsx
    │   │   │   │   ├── schedule-details-client.tsx
    │   │   │   │   ├── assignments/
    │   │   │   │   │   └── new/
    │   │   │   │   │       └── page.tsx
    │   │   │   │   ├── components/
    │   │   │   │   │   ├── async-schedule-content.tsx
    │   │   │   │   │   ├── loading.tsx
    │   │   │   │   │   ├── schedule-header.tsx
    │   │   │   │   │   ├── schedule-timeline.tsx
    │   │   │   │   │   └── staffing-requirements.tsx
    │   │   │   │   └── utils/
    │   │   │   │       ├── data-fetching.ts
    │   │   │   │       └── requirements.ts
    │   │   │   ├── _components/
    │   │   │   │   ├── create-schedule-button.tsx
    │   │   │   │   ├── schedule-filters.tsx
    │   │   │   │   └── schedule-list.tsx
    │   │   │   ├── edit/
    │   │   │   │   └── [id]/
    │   │   │   │       ├── edit-schedule-client.tsx
    │   │   │   │       └── page.tsx
    │   │   │   └── new/
    │   │   │       └── page.tsx
    │   │   └── shifts/
    │   │       └── page.tsx
    │   ├── employees/
    │   │   ├── add-employee-button.tsx
    │   │   ├── employee-list.tsx
    │   │   ├── error.tsx
    │   │   ├── layout.tsx
    │   │   ├── loading.tsx
    │   │   ├── page.tsx
    │   │   └── types.ts
    │   ├── hooks/
    │   │   ├── use-background-sync.ts
    │   │   ├── use-form-error.ts
    │   │   ├── use-network.ts
    │   │   ├── use-offline-data.ts
    │   │   ├── use-offline-fallback.ts
    │   │   ├── use-offline-sync.ts
    │   │   ├── use-schedule-form.ts
    │   │   ├── use-service-worker.ts
    │   │   ├── use-sync-queue.ts
    │   │   └── form/
    │   │       ├── index.ts
    │   │       └── use-form.ts
    │   ├── lib/
    │   │   ├── actions.ts
    │   │   ├── rate-limit.ts
    │   │   ├── supabase-client.ts
    │   │   ├── actions/
    │   │   │   ├── assignment.ts
    │   │   │   ├── employee.ts
    │   │   │   ├── schedule.client.ts
    │   │   │   ├── schedule.ts
    │   │   │   └── schedule/
    │   │   │       ├── client.ts
    │   │   │       ├── client.tsx
    │   │   │       └── index.ts
    │   │   ├── api/
    │   │   │   ├── auth.ts
    │   │   │   ├── cache.ts
    │   │   │   ├── database.ts
    │   │   │   ├── docs.ts
    │   │   │   ├── error-handler.ts
    │   │   │   ├── errors.ts
    │   │   │   ├── handler.ts
    │   │   │   ├── index.ts
    │   │   │   ├── logger.ts
    │   │   │   ├── middleware.ts
    │   │   │   ├── openapi.ts
    │   │   │   ├── rate-limit.ts
    │   │   │   ├── route-handler.ts
    │   │   │   ├── types.ts
    │   │   │   ├── validation.ts
    │   │   │   ├── cache/
    │   │   │   │   ├── config.ts
    │   │   │   │   ├── index.ts
    │   │   │   │   └── service.ts
    │   │   │   ├── database/
    │   │   │   │   ├── assignments.ts
    │   │   │   │   ├── base-repository.ts
    │   │   │   │   ├── base.ts
    │   │   │   │   ├── employees.ts
    │   │   │   │   ├── schedules.ts
    │   │   │   │   ├── shifts.ts
    │   │   │   │   ├── time-requirements.ts
    │   │   │   │   └── base/
    │   │   │   │       └── repository.ts
    │   │   │   └── repositories/
    │   │   │       ├── index.ts
    │   │   │       ├── schedule-repository.ts
    │   │   │       └── schedule.ts
    │   │   ├── auth/
    │   │   │   └── use-auth.ts
    │   │   ├── cache/
    │   │   │   └── cache-manager.ts
    │   │   ├── constants/
    │   │   │   └── http.ts
    │   │   ├── context/
    │   │   │   └── app-context.tsx
    │   │   ├── database/
    │   │   │   ├── database.types.ts
    │   │   │   ├── index.ts
    │   │   │   ├── indexed-d-b.ts
    │   │   │   ├── mappers.ts
    │   │   │   ├── __tests__/
    │   │   │   │   ├── setup.ts
    │   │   │   │   ├── base/
    │   │   │   │   │   └── repository.test.ts
    │   │   │   │   ├── integration/
    │   │   │   │   │   ├── concurrent.test.ts
    │   │   │   │   │   └── transaction.test.ts
    │   │   │   │   └── performance/
    │   │   │   │       └── benchmark.test.ts
    │   │   │   ├── base/
    │   │   │   │   ├── error-mapper.ts
    │   │   │   │   ├── errors.ts
    │   │   │   │   ├── logging.ts
    │   │   │   │   ├── repository.ts
    │   │   │   │   ├── retry.ts
    │   │   │   │   ├── transaction.ts
    │   │   │   │   ├── type-mapping.ts
    │   │   │   │   └── types.ts
    │   │   │   ├── mappers/
    │   │   │   │   ├── assignment.ts
    │   │   │   │   ├── employee.ts
    │   │   │   │   ├── schedule.ts
    │   │   │   │   └── shift-mapper.ts
    │   │   │   ├── migrations/
    │   │   │   │   ├── README.md
    │   │   │   │   ├── 20240116000000_add_rls_policies.sql
    │   │   │   │   ├── 20240116000000_add_rls_policies_down.sql
    │   │   │   │   └── test/
    │   │   │   │       └── 20240116000000_add_rls_policies.test.sql
    │   │   │   ├── repositories/
    │   │   │   │   ├── assignment.ts
    │   │   │   │   ├── employee.ts
    │   │   │   │   ├── schedule-repository.ts
    │   │   │   │   ├── schedule.ts
    │   │   │   │   └── shift.ts
    │   │   │   ├── schemas/
    │   │   │   │   ├── schedule.ts
    │   │   │   │   └── shift.ts
    │   │   │   ├── sql/
    │   │   │   │   ├── rls_helpers.sql
    │   │   │   │   └── rls_policies.sql
    │   │   │   └── supabase/
    │   │   │       ├── helpers.ts
    │   │   │       ├── type-mapping.ts
    │   │   │       └── types.ts
    │   │   ├── errors/
    │   │   │   ├── analytics.ts
    │   │   │   ├── api.ts
    │   │   │   ├── base.ts
    │   │   │   ├── database.ts
    │   │   │   ├── index.ts
    │   │   │   ├── middleware-errors.ts
    │   │   │   ├── monitoring.ts
    │   │   │   ├── reporting.ts
    │   │   │   ├── try.ts
    │   │   │   ├── types.ts
    │   │   │   ├── utils.ts
    │   │   │   └── validation.ts
    │   │   ├── hooks/
    │   │   │   ├── use-auth.ts
    │   │   │   ├── use-employees.ts
    │   │   │   ├── use-query.ts
    │   │   │   ├── use-schedule-assignments.ts
    │   │   │   ├── use-schedule.ts
    │   │   │   ├── use-shifts.ts
    │   │   │   └── use-time-requirements.ts
    │   │   ├── logging/
    │   │   │   └── error-logger.ts
    │   │   ├── middleware/
    │   │   │   └── error-handler.ts
    │   │   ├── monitoring/
    │   │   │   └── sentry.ts
    │   │   ├── offline/
    │   │   │   └── utils/
    │   │   │       ├── background-sync.ts
    │   │   │       ├── indexed-db.ts
    │   │   │       ├── network.ts
    │   │   │       ├── offline-fallback.ts
    │   │   │       ├── offline-storage.ts
    │   │   │       └── service-worker.ts
    │   │   ├── providers/
    │   │   │   ├── providers.tsx
    │   │   │   └── schedule-provider.tsx
    │   │   ├── scheduling/
    │   │   │   └── utils/
    │   │   │       ├── schedule.ts
    │   │   │       └── schedule.types.ts
    │   │   ├── schemas/
    │   │   │   ├── api.ts
    │   │   │   ├── assignment.ts
    │   │   │   ├── employee.ts
    │   │   │   ├── forms.ts
    │   │   │   ├── index.ts
    │   │   │   ├── schedule.ts
    │   │   │   ├── shift.ts
    │   │   │   ├── time-requirement.ts
    │   │   │   ├── base/
    │   │   │   │   ├── assignment.ts
    │   │   │   │   ├── employee.ts
    │   │   │   │   ├── index.ts
    │   │   │   │   ├── schedule.ts
    │   │   │   │   ├── shift-requirements.ts
    │   │   │   │   └── shift.ts
    │   │   │   └── forms/
    │   │   │       ├── assignment.ts
    │   │   │       ├── index.ts
    │   │   │       └── schedule.ts
    │   │   ├── server/
    │   │   │   ├── actions.ts
    │   │   │   └── cache.ts
    │   │   ├── storage/
    │   │   │   └── indexed-db.ts
    │   │   ├── stores/
    │   │   │   └── schedule-store.ts
    │   │   ├── supabase/
    │   │   │   ├── README.md
    │   │   │   ├── admin.ts
    │   │   │   ├── client-side.ts
    │   │   │   ├── constants.ts
    │   │   │   ├── cookies.ts
    │   │   │   ├── database.types.ts
    │   │   │   ├── generated-types.ts
    │   │   │   ├── index.ts
    │   │   │   ├── provider.tsx
    │   │   │   ├── queries.ts
    │   │   │   ├── server-side.ts
    │   │   │   ├── server.ts
    │   │   │   ├── supabase-client.ts
    │   │   │   ├── types.ts
    │   │   │   ├── utils.ts
    │   │   │   ├── client/
    │   │   │   │   ├── index.ts
    │   │   │   │   ├── provider.tsx
    │   │   │   │   └── hooks/
    │   │   │   │       ├── use-mutation.ts
    │   │   │   │       └── use-query.ts
    │   │   │   ├── hooks/
    │   │   │   │   └── index.ts
    │   │   │   ├── middleware/
    │   │   │   │   └── index.ts
    │   │   │   ├── server/
    │   │   │   │   └── index.ts
    │   │   │   └── types/
    │   │   │       └── database.ts
    │   │   ├── sw/
    │   │   │   ├── register.ts
    │   │   │   └── types.ts
    │   │   ├── sync/
    │   │   │   ├── background-sync-service.ts
    │   │   │   ├── local-storage.ts
    │   │   │   ├── storage.ts
    │   │   │   ├── sync-queue.ts
    │   │   │   ├── use-background-sync.ts
    │   │   │   └── __tests__/
    │   │   │       ├── background-sync.test.ts
    │   │   │       └── mocks/
    │   │   │           └── supabase.ts
    │   │   ├── types/
    │   │   │   ├── actions.d.ts
    │   │   │   ├── api.ts
    │   │   │   ├── background-sync.d.ts
    │   │   │   ├── components.d.ts
    │   │   │   ├── database.d.ts
    │   │   │   ├── database.ts
    │   │   │   ├── employee.ts
    │   │   │   ├── hooks.d.ts
    │   │   │   ├── index.ts
    │   │   │   ├── json.ts
    │   │   │   ├── network.ts
    │   │   │   ├── scheduling.ts
    │   │   │   ├── shift.ts
    │   │   │   ├── supabase.d.ts
    │   │   │   ├── types.ts
    │   │   │   └── ui.d.ts
    │   │   └── utils/
    │   │       ├── index.ts
    │   │       ├── revalidate.ts
    │   │       ├── toast.ts
    │   │       ├── api/
    │   │       │   └── fetcher.ts
    │   │       ├── core/
    │   │       │   ├── cn.ts
    │   │       │   ├── date.ts
    │   │       │   ├── index.ts
    │   │       │   ├── performance.ts
    │   │       │   ├── string.ts
    │   │       │   └── validation.ts
    │   │       ├── errors/
    │   │       │   ├── error.ts
    │   │       │   └── index.ts
    │   │       └── ui/
    │   │           ├── form.ts
    │   │           └── toast.ts
    │   ├── offline/
    │   │   └── page.tsx
    │   ├── pages/
    │   │   └── index.ts
    │   ├── providers/
    │   │   └── query-provider.tsx
    │   ├── schedules/
    │   │   ├── page.tsx
    │   │   ├── components/
    │   │   │   ├── schedule-filters.tsx
    │   │   │   └── schedule-list.tsx
    │   │   └── new/
    │   │       └── page.tsx
    │   ├── styles/
    │   │   └── datepicker.css
    │   └── types/
    │       ├── actions.d.ts
    │       ├── database.ts
    │       ├── supabase.d.ts
    │       └── ui.d.ts
    ├── components/
    │   ├── employees/
    │   │   ├── AddEmployeeButton.tsx
    │   │   ├── EmployeeForm.tsx
    │   │   └── EmployeeList.tsx
    │   └── ui/
    │       ├── button.tsx
    │       ├── dialog.tsx
    │       ├── form.tsx
    │       ├── input.tsx
    │       ├── label.tsx
    │       ├── select.tsx
    │       ├── separator.tsx
    │       └── table.tsx
    ├── documentation/
    │   ├── environment-variables.md
    │   ├── forms.md
    │   ├── implementation-status.md
    │   └── known-issues.md
    ├── lib/
    │   ├── utils.ts
    │   └── supabase/
    │       ├── client.ts
    │       ├── server.ts
    │       └── utils.ts
    ├── public/
    │   ├── fallback-ce627215c0e4a9af.js
    │   ├── manifest.json
    │   └── offline.html
    ├── scripts/
    │   └── generate-types.ts
    ├── supabase/
    │   ├── README.md
    │   ├── config.toml
    │   ├── .gitignore
    │   ├── functions/
    │   │   ├── get_error_metrics.sql
    │   │   ├── get_performance_metrics.sql
    │   │   ├── get_rate_limit_metrics.sql
    │   │   └── increment_rate_limit.sql
    │   └── migrations/
    │       ├── 20240115_create_utility_functions.sql
    │       ├── 20240116_create_employees.sql
    │       ├── 20240117_create_schedules.sql
    │       ├── 20240118_create_shifts.sql
    │       ├── 20240119_seed_shifts.sql
    │       ├── 20240120_create_utilities.sql
    │       ├── 20250116220252_add_department_to_employees.sql
    │       └── 20250116220712_create_schedule_assignments.sql
    └── types/
        └── jest.d.ts


## Features in Development
- Schedule optimization algorithm
- Shift swapping system
- Advanced reporting features
- Email notifications
- Performance monitoring

## Contributing
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License
This project is proprietary software.

## Support
For support, please contact the development team.