# Nevada DMV Appointment Monitor

## Overview

This is a web application that monitors Nevada DMV appointment availability across multiple locations and sends email notifications when appointments become available. The system provides automated checking at configurable intervals and includes a dashboard for management and monitoring.

## Recent Changes

**January 8, 2025**
- ✅ Email system configured and tested successfully
- ✅ All 6 Nevada DMV locations enabled (Henderson, West Flamingo, North Decatur)
- ✅ 5-minute check interval system with manual on/off toggle
- ✅ Browser dependencies installed and Puppeteer configured for Replit
- ✅ System ready for automated appointment monitoring

## User Preferences

Preferred communication style: Simple, everyday language.

### Email Configuration
- Notification Email: `psn@bobbygill.co.uk`
- SMTP Server: `smtp.gmail.com`
- SMTP Port: `587`
- Uses Gmail app password authentication
- Test email functionality: ✅ Working

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Build Tool**: Vite for development and production builds
- **UI Library**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens and dark mode support
- **State Management**: TanStack React Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with TypeScript and ES modules
- **Framework**: Express.js for REST API endpoints
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Validation**: Zod schemas shared between client and server
- **Session Storage**: In-memory storage with interface for future database migration
- **Web Scraping**: Puppeteer for automated appointment checking

### Data Storage Solutions
- **Database**: PostgreSQL (configured via Drizzle but using in-memory storage currently)
- **ORM**: Drizzle ORM with schema-first approach
- **Migrations**: Drizzle Kit for database schema management
- **Data Models**: DMV locations, email configuration, monitoring settings, activity logs, and monitoring statistics

### Core Services
- **Appointment Checker**: Puppeteer-based service that scrapes DMV booking websites
- **Email Service**: Nodemailer integration for SMTP notifications
- **Monitoring Service**: Cron job scheduler for automated appointment checking
- **Storage Service**: Abstracted storage interface supporting both in-memory and database persistence

### Key Features
- **Multi-location Monitoring**: Track multiple DMV locations simultaneously
- **Configurable Scheduling**: Adjustable check intervals and date ranges
- **Email Notifications**: SMTP-based alerts when appointments are found
- **Activity Logging**: Comprehensive logging of all monitoring activities
- **Real-time Dashboard**: Live status updates and statistics
- **Business Rules**: Configurable business days only filtering

## External Dependencies

### Database Services
- **Neon Database**: PostgreSQL serverless database provider
- **Connection**: Uses `@neondatabase/serverless` for database connectivity

### Email Services
- **SMTP Support**: Configurable SMTP servers (Gmail, custom servers)
- **Nodemailer**: Email sending library with authentication support

### Web Scraping
- **Puppeteer**: Headless Chrome automation for DMV website interaction
- **Target Sites**: Henderson DMV, West Flamingo DMV, North Decatur DMV booking systems

### UI and Development
- **Radix UI**: Headless component library for accessible UI primitives
- **Lucide Icons**: Icon library for consistent iconography
- **Google Fonts**: Inter font family for typography
- **Replit Integration**: Development environment optimizations and banner integration

### Build and Development Tools
- **TypeScript**: Static type checking across frontend and backend
- **ESBuild**: Production bundling for server code
- **PostCSS**: CSS processing with Tailwind and Autoprefixer
- **TSX**: TypeScript execution for development server