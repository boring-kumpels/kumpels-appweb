# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Development & Build
- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Database Operations
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema changes to database
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio database browser

### Data Management Scripts
- `npm run db:populate` - Populate database with sample data
- `npm run db:cleanup` - Clean up database data
- `npm run db:import-patients` - Import patients from CSV files
- `npm run db:test` - Run test setup script

## Architecture Overview

### Core Technology Stack
- **Framework**: Next.js 15 with App Router
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Supabase Auth with custom user roles
- **UI**: Tailwind CSS + shadcn/ui components
- **State Management**: TanStack Query for server state

### User Role System
Four distinct user roles with different access levels:
- `SUPERADMIN` - Full system access including user management
- `NURSE` - Limited to patient operations and statistics
- `PHARMACY_VALIDATOR` - Pharmacy-focused patient and statistics access  
- `PHARMACY_REGENT` - Enhanced pharmacy access with general status

Each role has role-specific routes under `/dashboard`, `/nurse`, `/pharmacy`, and `/regent`.

### Database Schema Overview
- **Patients**: Core patient data with external ID, demographics, bed assignments
- **Beds**: Organized by lines (LINE_1 through LINE_5) with unique bed numbers
- **Daily Processes**: Track daily medication workflow sessions
- **Medication Processes**: 5-step workflow (PREDESPACHO → ALISTAMIENTO → VALIDACION → ENTREGA → DEVOLUCION)
- **Profiles**: User profile data linked to Supabase auth users

### API Structure
REST APIs follow `/api/[resource]` pattern:
- `/api/patients` - Patient CRUD operations with filtering
- `/api/medication-processes` - Medication workflow management
- `/api/daily-processes` - Daily process session management
- `/api/beds` and `/api/lines` - Facility structure management

### Key Patterns

#### Authentication Flow
- Uses Supabase auth with server-side session validation
- Role-based access control enforced at API and route level
- Custom middleware for protected routes

#### Process Workflow
The medication process follows a strict 5-step workflow where each step has specific role permissions defined in `src/lib/medication-process-permissions.ts`.

#### Component Organization
- `/components/dashboard` - Main application features
- `/components/ui` - Reusable UI components (shadcn/ui)
- `/components/sidebar` - Navigation with role-based menus
- `/components/auth` - Authentication-related components

#### Data Fetching
- Uses TanStack Query for client-side state management
- Custom hooks in `/hooks` directory for data operations
- Server components for initial data loading

### File Upload & Storage
- Supabase Storage for avatar uploads
- Image optimization with Next.js Image component
- Storage bucket: "avatars"

### Type Safety
- Comprehensive TypeScript types in `/types` directory
- Prisma-generated types for database models
- Enum types synchronized between Prisma schema and TypeScript

## Important Notes

### Database Connection
- Uses both pooled (`DATABASE_URL`) and direct (`DIRECT_URL`) connections
- Pooled connection for application queries via PgBouncer
- Direct connection for migrations and schema operations

### Environment Variables
Key variables required for operation:
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `DATABASE_URL` and `DIRECT_URL` for Prisma
- `NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET` for file uploads

### Testing & Validation
Always run both `npm run build` and `npm run lint` before committing changes to ensure code quality and type safety.