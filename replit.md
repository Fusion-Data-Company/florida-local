# The Florida Local - Business Community Platform

## Overview

The Florida Local is a comprehensive platform connecting Florida-based entrepreneurs and local businesses. It serves as a digital community hub for showcasing business profiles, selling products, engaging via social feeds, and gaining visibility through a spotlight system. The platform aims to foster local commerce, community building, and business growth through digital presence and networking opportunities.

## User Preferences

Preferred communication style: Simple, everyday language.

**CRITICAL: Stripe Integration**
- NEVER ask for Stripe API keys or testing secrets
- Stripe integration is placeholdered/removed - do NOT implement it
- All Stripe routes and functionality are commented out with placeholders
- Testing should NEVER be blocked by missing Stripe configuration
- **DO NOT use run_test tool** - Replit's test infrastructure requires Stripe secrets even when Stripe is removed
- Verify functionality through manual testing and architect review only

## System Architecture

**Frontend:** Built with React 18, TypeScript, Vite, Wouter for routing, and TanStack Query for state management. UI uses shadcn/ui components (Radix UI) and Tailwind CSS for responsive design.

**Backend:** Express.js with TypeScript, providing RESTful APIs. It utilizes Replit's OpenID Connect authentication, PostgreSQL with Drizzle ORM for data, and Redis for sessions, rate limiting, and job queues.

**Key Features & Implementations:**
- **UI/UX:** Elite Luxury UI transformation with premium marble textures, advanced CSS effects, performance-optimized animations, full accessibility (WCAG AA compliance, prefers-reduced-motion support), glass morphism, floating animations, and luxury typography.
- **E-commerce:** Cart, checkout (manual only - Stripe removed), vendor portal for product management, and an orders system.
- **Social:** User-generated content (posts, updates), likes, comments, following, and real-time messaging via WebSockets.
- **Spotlight System:** A three-tier rotation system using weighted algorithms and community voting to feature businesses.
- **Security:** API key management, webhook signatures, hardened CSP, strict CORS, and session-based WebSocket authentication.
- **Monitoring:** Sentry for error tracking, PostHog for analytics, and Winston for logging.
- **Background Jobs:** Email queues and image processing workers.
- **Database:** PostgreSQL with Drizzle ORM for type-safe operations, including comprehensive profiles, user management, product catalog, messaging, and spotlight data.

**Deployment Configuration:** 
- Production deployment uses `npm run build` which creates `client/dist/` (Vite output) and `dist/index.js` (server).
- **Auto-healing Build Process:** `server/index.ts` includes `ensureStaticAssets()` function that automatically copies `client/dist/` to `dist/public/` on production startup. This ensures static files are in the correct location even if the build process doesn't copy them.
- The `build-deploy.sh` script provides manual deployment with explicit file copying, but is not required due to the auto-healing mechanism in production.
- **Authentication Flow:** Users authenticate via Replit OAuth and are redirected to `/` (Discover page) after successful login. Production domain `florida-local-elite.replit.app` is automatically supported through dynamic hostname detection.

## External Dependencies

**Core Frameworks:**
- Vite (frontend build)
- Express.js (backend API)
- React 18 (frontend)
- TanStack Query (client-side state management)

**Database & ORM:**
- PostgreSQL (Neon serverless)
- Drizzle ORM
- `connect-pg-simple` (PostgreSQL session storage)

**Authentication:**
- Replit Authentication (OpenID Connect)
- Passport.js
- `express-session`

**UI & Styling:**
- shadcn/ui (Radix UI based)
- Tailwind CSS
- Lucide React (icons)
- React Hook Form with Zod (form validation)

**External API Integrations:**
- Google My Business API (OAuth, business sync, review management)
- SendGrid (transactional emails)
- TaxJar (1099 generation, sales tax reporting)
- ~~Stripe Connect~~ (REMOVED - placeholders only, DO NOT implement)
- Object Storage (dynamic product images)

**Monitoring & Analytics:**
- Sentry
- PostHog