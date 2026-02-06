# Smart Travel Frontend

A modern Next.js application for Vietnam personalized travel experiences, restructured from the original HTML/JavaScript codebase.

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **State Management**: Zustand
- **HTTP Client**: Axios
- **UI Components**: Custom components with headless approach
- **Icons**: Font Awesome

## Project Structure

```
frontend/
├── app/                      # Next.js App Router
│   ├── (full-page)/         # Route group for auth pages
│   ├── (main)/              # Route group for main app
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Homepage
│   ├── globals.css          # Global styles
│   └── providers.tsx        # App providers
├── components/
│   ├── ui/                  # Reusable UI components
│   ├── common/              # Shared components
│   └── forms/               # Form components
├── features/
│   └── auth/                # Authentication feature module
├── lib/
│   ├── axios.ts             # API client configuration
│   ├── env.ts               # Environment variables
│   └── utils.ts             # Utility functions
├── services/
│   ├── auth.service.ts      # Authentication API calls
│   └── travel.service.ts    # Travel API calls
├── store/
│   ├── useAuthStore.ts      # Authentication state
│   └── useAppStore.ts       # Application state
├── hooks/
│   ├── useClientOnly.ts     # Client-side rendering hook
│   └── useToast.ts          # Toast notifications
├── types/
│   ├── api.d.ts             # API response types
│   └── domain.d.ts          # Domain types
└── public/                  # Static assets
```

## Features

- ✅ Modern TypeScript architecture
- ✅ Component-based structure
- ✅ Responsive design with Tailwind CSS
- ✅ Authentication system
- ✅ Multi-language support (English/Vietnamese)
- ✅ Currency conversion (USD/VND)
- ✅ Search functionality for travel, hotels, and flights
- ✅ State management with Zustand
- ✅ Form validation and error handling
- ✅ Toast notifications
- ✅ Modal system
- ✅ API integration ready

## Setup Instructions

1. **Install dependencies**:
   ```bash
   cd frontend
   npm install
   ```

2. **Environment Configuration**:
   Create a `.env.local` file in the frontend directory:
   ```env
   NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
   ```

3. **Run development server**:
   ```bash
   npm run dev
   ```

4. **Build for production**:
   ```bash
   npm run build
   npm start
   ```

## Key Components

### Authentication
- Login/Register forms with validation
- JWT token management
- Protected routes
- User session persistence

### Search System
- Multi-step travel search form
- Hotel booking search
- Flight search
- Form validation and error handling

### UI Components
- Modal system with backdrop
- Button variants and states
- Input fields with validation
- Select dropdowns
- Loading states

### State Management
- Authentication store (login, logout, user data)
- Application store (language, currency, config)
- Persistent storage with localStorage

### Services
- API client with interceptors
- Authentication service
- Travel service
- Error handling

## Translation System

The app supports Vietnamese and English languages with dynamic content switching.

## Styling

Uses Tailwind CSS v4 with:
- Custom component styles
- Responsive design
- Dark/light theme ready
- CSS custom properties

## API Integration

Ready to connect with Django backend:
- Authentication endpoints
- Travel search endpoints
- Configuration endpoints
- Error handling and loading states

## Development Notes

- Components are fully typed with TypeScript
- Follows React best practices
- Uses modern hooks and patterns
- Optimized for performance
- SEO-friendly with Next.js
- Accessible design patterns