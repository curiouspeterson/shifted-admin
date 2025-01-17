# 24/7 Dispatch Center Scheduling Application

A modern, offline-capable web application for managing employee schedules in 24/7 dispatch centers. Built with Next.js 14, TypeScript, and Supabase.

## Core Features

### Schedule Management

- 📅 Bi-weekly schedule generation and management
- ⏰ Flexible shift durations (4h, 10h, 12h)
- 📊 Real-time staffing requirements tracking
- 🔄 Shift swapping and assignment management
- 📱 Mobile-responsive interface

### Employee Management

- 👥 Comprehensive employee profiles
- 🔐 Role-based access control
- 📋 Time-off request system
- 📈 Availability tracking
- 🏢 Department organization

### Offline Capabilities

- 💻 Full offline functionality
- 🔄 Background sync
- 📱 PWA support
- 💾 Local data persistence
- 🔌 Automatic online/offline switching

### Technical Features

- ⚡ Server-side rendering with Next.js 14 App Router
- 🔒 Type-safe database operations with Supabase
- 🎯 Real-time updates and notifications
- 🎨 Modern UI with Tailwind CSS and shadcn/ui
- ✅ Comprehensive form validation with Zod
- 📊 Performance monitoring and error tracking
- 🔄 Background sync with Service Workers
- 💾 IndexedDB for offline storage

## Tech Stack

### Frontend

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui
- React Hook Form
- Zustand
- Service Workers

### Backend

- Supabase (PostgreSQL)
- Row Level Security
- TypeScript
- Server Actions
- Edge Functions

### Testing

- Jest
- React Testing Library
- Integration Tests
- Performance Benchmarks

## Project Structure

app/                  # Next.js application code
├── (auth)           # Authentication routes
├── api              # API routes
├── components       # Shared components
├── dashboard        # Main application views
├── lib             # Core utilities and services
└── types           # TypeScript definitions

The codebase is well-organized into the following main directories:

app: Contains the main application code, following the Next.js App Router structure.
api: API routes handling data fetching and mutations.
components: Reusable UI components.
dashboard: Dashboard-specific pages and components.
employees: Employee management pages and components.
hooks: Custom React hooks.
lib: Utility functions, types, and services.
providers: Context providers for global state and functionality.
schedules: Schedule management pages and components.
styles: Global styles and CSS files.
__tests__: Test files.
components: Reusable UI components (duplicated from app/components).
documentation: Project documentation.
lib: Utility functions, types, and services (duplicated from app/lib).
public: Static assets and service worker files.
scripts: Utility scripts (e.g., type generation).
supabase: Supabase configuration, migrations, and functions.
types: Global type definitions.
5. Detailed Component Breakdown

UI Components (app/components/ui):

alert.tsx: Alert component with variants (default, destructive, success, warning).
badge.tsx: Badge component for displaying status labels.
button.tsx: Base button component with variants and size options.
button-client.tsx: Client-side wrapper for the Button component.
calendar.tsx: Calendar component for date selection.
card.tsx: Card component for grouping content.
dialog.tsx: Dialog component for modal interactions.
form.tsx: Form components for building forms (FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage).
form-date-picker.tsx: Date picker component for forms.
form-input.tsx: Input component for forms.
form-input-wrapper.tsx: Wrapper for form inputs.
index.ts: Index file for exporting UI components.
input.tsx: Input component.
label.tsx: Label component.
loading-spinner.tsx: Loading spinner component.
modal.tsx: Modal component.
offline-indicator.tsx: Indicator for offline status.
page-header.tsx: Page header component.
popover.tsx: Popover component.
progress.tsx: Progress bar component.
select.tsx: Select component.
skeleton.tsx: Skeleton loading component.
sonner.tsx: Wrapper for the sonner toast notification library.
switch.tsx: Switch component.
table.tsx: Table component.
tabs.tsx: Tabs component.
textarea.tsx: Textarea component.
toast.tsx: Toast component.
button/:
button-client.tsx: Client-side wrapper for button.
button-server.tsx: Server-side base button component.
index.ts: Index for button components.
charts/:
bar-chart.tsx: Bar chart component.
line-chart.tsx: Line chart component.
toast/:
index.tsx: Toast component.
Form Components (app/components/forms):

assignment-form.tsx: Form for creating/editing assignments.
base/:
base-form.tsx: Generic base form component.
date-field.tsx: Date field component for forms.
date-picker.tsx: Date picker component for forms.
form-control.tsx: Form control component.
form-date-picker.tsx: Form field wrapper for date picker.
form-field.tsx: Base form field component.
form-field-wrapper.tsx: Wrapper for form fields.
form-input.tsx: Form input component.
form-select.tsx: Form select component.
form-wrapper.tsx: Wrapper for forms.
index.ts: Index for base form components.
select-field.tsx: Select field component for forms.
textarea-field.tsx: Textarea field component for forms.
examples/:
assignment-form.tsx: Example assignment form.
index.ts: Index for example forms.
schedule-form.tsx: Form for creating/editing schedules.
Other Components:

cached-content.tsx: Component for displaying cached content with age and refresh options.
dashboard-nav.tsx: Navigation component for the dashboard.
employee-form.tsx: Form for creating/editing employees.
loading.tsx: Loading component with different variants.
offline-fallback.tsx: Fallback component for offline states.
request-form.tsx: Form for submitting time-off requests.
service-worker-status.tsx: Displays service worker status.
staffing-requirements-editor.tsx: Editor for staffing requirements.
sync-indicator.tsx: Indicator for sync status.
sync-status.tsx: Displays sync status.
test-modal.tsx: Example modal component.
theme-provider.tsx: Theme provider for the application.
Hooks:

use-background-sync.ts: Hook for managing background sync.
use-form-error.ts: Hook for handling form errors.
use-network.ts: Hook for monitoring network status.
use-offline-data.ts: Hook for managing offline data.
use-offline-fallback.ts: Hook for handling offline fallbacks.
`use-offline-sync.

## Getting Started

### Prerequisites

- Node.js 18+
- npm/yarn
- Supabase account

### Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
JWT_SECRET=
SUPABASE_ACCESS_TOKEN=
SUPABASE_DB_PASSWORD=
```

### Installation

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables
4. Run migrations: `npm run migrate`
5. Start development server: `npm run dev`

## Development Status

### Completed Features

- ✅ Core authentication
- ✅ Employee management
- ✅ Schedule management
- ✅ Offline support
- ✅ Background sync
- ✅ Error handling
- ✅ Performance monitoring

### In Development

- ⏳ Schedule optimization algorithm
- ⏳ Advanced reporting features
- ⏳ Email notification system
- ⏳ Enhanced performance monitoring
- ⏳ AI-powered scheduling suggestions

## Testing again

```bash
# Run unit tests
npm run test

# Run integration tests
npm run test:integration

# Run performance tests
npm run test:performance
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Documentation

- [API Documentation](./documentation/api.md)
- [Environment Setup](./documentation/environment-variables.md)
- [Forms Guide](./documentation/forms.md)
- [Implementation Status](./documentation/implementation-status.md)

## Support

For support, please contact the development team through:

- Issue Tracker
- Development Chat
- Email Support

## License

This project is proprietary software. All rights reserved.
