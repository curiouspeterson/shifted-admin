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

/
├── app/
│   ├── __tests__/
│   │   └── sw.test.ts
│   ├── components/
│   │   ├── error-boundary/
│   │   ├── forms/
│   │   │   ├── base/
│   │   │   │   ├── FormInput.tsx
│   │   │   │   ├── DateField.tsx
│   │   │   │   ├── FormDatePicker.tsx
│   │   │   │   └── TextareaField.tsx
│   │   │   ├── AssignmentForm.tsx
│   │   │   ├── ScheduleForm.tsx
│   │   │   └── index.ts
│   │   ├── ui/
│   │   │   ├── calendar.tsx
│   │   │   ├── form.tsx
│   │   │   └── table.tsx
│   │   └── theme-provider.tsx
│   ├── dashboard/
│   │   └── schedules/
│   │       └── _components/
│   │           └── create-schedule-button.tsx
│   ├── employees/
│   │   └── employee-list.tsx
│   ├── lib/
│   │   ├── api/
│   │   │   ├── database/
│   │   │   │   ├── base/
│   │   │   │   │   ├── repository.ts
│   │   │   │   │   └── transaction.ts
│   │   │   │   └── schedules.ts
│   │   │   ├── docs.ts
│   │   │   └── repositories/
│   │   │       ├── schedule.ts
│   │   │       └── index.ts
│   │   ├── errors/
│   │   │   ├── base/
│   │   │   ├── types/
│   │   │   ├── utils/
│   │   │   └── index.ts
│   │   ├── logging/
│   │   │   └── errorLogger.ts
│   │   ├── offline/
│   │   │   └── utils/
│   │   │       ├── background-sync.ts
│   │   │       ├── indexed-db.ts
│   │   │       ├── network.ts
│   │   │       └── service-worker.ts
│   │   ├── schemas/
│   │   │   ├── base/
│   │   │   │   └── index.ts
│   │   │   ├── forms/
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   ├── supabase/
│   │   │   ├── database.types.ts
│   │   │   └── README.md
│   │   └── utils/
│   │       ├── core/
│   │       │   └── index.ts
│   │       └── index.ts
│   ├── providers/
│   │   └── query-provider.tsx
│   ├── styles/
│   │   └── globals.css
│   └── layout.tsx
├── documentation/
│   ├── implementation-status.md
│   ├── known-issues.md
│   └── new-plan.md
├── public/
│   ├── sw.js
│   └── workbox-*.js
├── scripts/
│   └── generate-types.ts
├── supabase/
│   ├── functions/
│   ├── migrations/
│   ├── seed/
│   ├── types/
│   ├── .gitignore
│   └── README.md
├── .cursorrules
├── .eslintrc.json
├── .gitignore
├── jest.config.js
├── jest.setup.js
├── jest.setup.ts
├── middleware.ts
├── next.config.js
├── package.json
├── postcss.config.js
├── README.md
├── tsconfig.json
└── tsconfig.test.json

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