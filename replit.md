# The Florida Local - Business Community Platform

## Overview

The Florida Local is a comprehensive platform designed to connect Florida-based entrepreneurs and local businesses. It serves as a digital community hub enabling businesses to showcase profiles, sell products, engage through social feeds, and gain visibility via a spotlight system. The platform's core purpose is to foster local commerce, community building, and business growth by providing digital presence and networking opportunities.

## Recent Changes (October 23, 2025)

**YouTube Video Background Migration (PRODUCTION-READY):**
- Migrated all video backgrounds from 2.5GB local files to YouTube-hosted videos for Autoscale deployment compatibility
- Created YouTubeBackground component with autoplay, loop, muted embed and fallback gradient
- Updated 6 pages with YouTube URLs: Home (discover-bg: Z8ioWqthS-o), Login Error & Create Business (Jacksonville: I0qV37ezBJc), Florida Local Elite (Trees/Fountain: 5RVvKpX9eBU), Subscription & Community (Cityscape Georgia: 5xnaoI0cXjs)
- Removed client/public/Videos folder (2.5GB) and cleaned up build scripts
- Repository size reduced from 26GB to ~181MB source code
- Files modified: client/src/components/youtube-background.tsx (new), all 6 page components, scripts/build-production.sh, vite.config.ts, .gitignore
- Architect verified: PASS - Production-ready, no broken references, embeds correctly configured

**Text Readability Enhancement (COMPREHENSIVE):**
- Fixed all text readability issues across Subscription, Florida Local Elite, Marketplace, Home, and Landing pages
- **Subscription page**: Added dark semi-transparent backgrounds to stats boxes, strengthened text shadows (0.7-1.0 opacity), improved muted-foreground contrast
- **Florida Local Elite page**: Added black/40 backdrop-blur backgrounds to featured cards, strengthened text shadows to rgba(0,0,0,1), bolded text on photo backgrounds
- **Marketplace page**: Increased background opacity (white/90) on description text and search panels, enhanced glass morphism with stronger backdrop blur
- **Home/Discover page**: Strengthened holographic card text shadows from subtle to strong (0 4px 8px rgba(0,0,0,0.8)), improved font weights to medium/bold
- **Landing/Hero Section**: Added white/80-90 blurred panels with dark text for beach backgrounds, made stats badges more opaque (white/90), improved placeholder text contrast (slate-700)
- Design approach: Consistent high-opacity text shadows (0 4px 8px), semi-transparent backgrounds for readability, stronger font weights (medium/semibold/bold)
- Files modified: client/src/pages/subscription.tsx, client/src/pages/florida-local-elite.tsx, client/src/pages/marketplace.tsx, client/src/pages/home.tsx, client/src/components/hero-section.tsx
- Architect verified: PASS - All text now readable against media-heavy backdrops with consistent contrast

## Recent Changes (October 21, 2025)

**Voice Shopping Modal Integration:**
- Integrated AI voice shopping assistant with navigation headers (both standard and elite)
- Added VoiceShopModal component that wraps VoiceCommerce in a dialog
- Implemented autoStart functionality - voice assistant automatically begins listening when modal opens
- Users can now access voice shopping by clicking the microphone icon beside the cart icon
- Modal provides seamless hands-free shopping experience without leaving the current page
- Files modified: client/src/components/voice-commerce.tsx, client/src/components/voice-shop-modal.tsx, client/src/components/navigation-header.tsx, client/src/components/elite-navigation-header.tsx
- Architect verified: PASS - production ready

**Sign In Button Fix (CRITICAL):**
- Fixed critical bug preventing Sign In button from responding to clicks
- Root cause: Overly-broad CSS selector `[style*="z-index: 1"]` was applying `pointer-events: none !important` to ALL elements with "1" in their z-index value (10000, 1000, 100, etc.)
- Solution: Replaced broad selector with scoped `.video-overlay-passthrough` class targeting only video background containers
- Affected components: elite-navigation-header.tsx, landing.tsx, hero-section.tsx
- Video backgrounds still function correctly across all 7 pages while Sign In button is now clickable
- Files modified: client/src/components/video-background.tsx, client/src/styles/magic.css, client/src/index.css
- Architect verified: PASS - production ready

## Recent Changes (October 20, 2025)

**Authentication Fix:**
- Fixed OAuth redirect loop by changing session cookie `sameSite` setting from 'none' (production) to 'lax' (all environments)
- 'lax' is correct for OAuth flows that redirect back to the same domain (allows cookies on top-level navigation)
- Session cookie configuration: `httpOnly: true`, `secure: production only`, `sameSite: 'lax'`

**Video Background Fallback:**
- Added graceful fallback for missing video backgrounds (Videos folder excluded from production builds)
- Video component now displays animated gradient background when video files unavailable
- Fallback uses CSS animation (gradient-shift) for visual continuity

**Deployment Optimization:**
- Successfully reduced Docker image size from 8+ GiB to 102MB (98.7% reduction)
- Optimized logo images (PNG → WebP): 2.5MB → 0.38MB total
- Excluded Videos directory (2.5GB) and attached_assets (81MB) from production builds
- Enhanced JavaScript bundle optimization with tree-shaking and disabled source maps

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

**Frontend:** React 18, TypeScript, Vite, Wouter for routing, TanStack Query for state management. UI components are built with shadcn/ui (Radix UI) and styled with Tailwind CSS for responsive design.

**Backend:** Express.js with TypeScript, providing RESTful APIs. It leverages Replit's OpenID Connect authentication, PostgreSQL with Drizzle ORM for data persistence, and Redis for sessions, rate limiting, and job queues.

**UI/UX Decisions:**
- Elite Luxury UI transformation with premium marble textures, advanced CSS effects, performance-optimized animations, full accessibility (WCAG AA compliance, prefers-reduced-motion support), glass morphism, floating animations, and luxury typography.
- AI Tools Page features an ultra-elite cyberpunk metallic futuristic theme with a 3D animated hero section (Three.js with optimized metallic boxes), dark metallic gradients, cyan/purple energy borders, three-layer overlay system, and 3D lift animations.

**Technical Implementations & Feature Specifications:**
- **E-commerce:** Includes a cart, checkout (manual only, Stripe removed), vendor portal for product management, and an orders system.
- **Social Features:** User-generated content (posts, updates), likes, comments, following, and real-time messaging via WebSockets.
- **Spotlight System:** A three-tier rotation system utilizing weighted algorithms and community voting to feature businesses.
- **Security:** API key management, webhook signatures, hardened CSP, strict CORS, and session-based WebSocket authentication.
- **Monitoring:** Sentry for error tracking, PostHog for analytics, and Winston for logging.
- **Background Jobs:** Email queues and image processing workers.
- **Database:** PostgreSQL with Drizzle ORM for type-safe operations across profiles, user management, product catalog, messaging, and spotlight data.
- **Deployment Configuration:** Production server infrastructure rebuilt for enterprise-grade reliability. Utilizes a verified build process (`scripts/build-production.sh`) generating `dist/index.js` and `dist/public/` for server and client bundles respectively. Includes deployment size optimizations by excluding large assets and optimizing images.
- **Server Architecture:** Modular and deterministic with a unified `server/bootstrap.ts` initialization system. Features robust database connection pooling with retry logic, multi-tier session storage (`server/session/index.ts`) with fallback (Redis → PostgreSQL → Memory), and a dynamic OIDC authentication module (`server/auth/index.ts`) supporting all `REPLIT_DOMAINS`.
- **Authentication Flow:** Users authenticate via Replit OAuth and are redirected to the Discover page post-login. Dynamic hostname detection ensures flexible deployment.
- **Error Handling:** Sanitized client responses, full server-side error logging, graceful handling, and connection leak prevention.

## External Dependencies

**Core Frameworks:**
- Vite
- Express.js
- React 18
- TanStack Query

**Database & ORM:**
- PostgreSQL (Neon serverless)
- Drizzle ORM
- `connect-pg-simple`

**Authentication:**
- Replit Authentication (OpenID Connect)
- Passport.js
- `express-session`

**UI & Styling:**
- shadcn/ui (Radix UI based)
- Tailwind CSS
- Lucide React
- React Hook Form with Zod

**External API Integrations:**
- Google My Business API (OAuth, business sync, review management)
- SendGrid (transactional emails)
- TaxJar (1099 generation, sales tax reporting)
- Object Storage (for dynamic product images)

**Monitoring & Analytics:**
- Sentry
- PostHog
```