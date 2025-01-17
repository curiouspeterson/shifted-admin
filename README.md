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
