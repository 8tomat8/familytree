# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

**Development:**
```bash
npm run dev          # Start development server with Turbopack
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

**Database Operations:**
```bash
npm run db:generate  # Generate Drizzle schema migrations
npm run db:migrate   # Apply database migrations
npm run db:studio    # Launch Drizzle Studio (database GUI)
```

**Docker Development:**
```bash
docker-compose up postgres -d    # Start PostgreSQL only
docker-compose up --build -d     # Build and start all services
docker-compose logs -f app       # View application logs
```

## Project Architecture

This is a **Next.js 15** family tree application with integrated photo management. The ultimate goal is to create a comprehensive family tree system where users can build family relationships, associate photos with family members, and visualize genealogical connections. Currently, the photo gallery functionality is implemented and working, while the family tree visualization and relationship management features are planned for future development.

Current architecture components:

### Technology Stack
- **Frontend:** Next.js 15 with App Router, React 19, TypeScript, Tailwind CSS
- **Backend:** Next.js API routes with PostgreSQL 17 and Drizzle ORM
- **Image Processing:** Sharp library for rotation, cropping, and metadata extraction
- **UI Components:** Swiper.js for carousel, FontAwesome icons, i18next for internationalization

### Core Database Schema
The application centers around three main entities designed to support both photo management and future family tree functionality:
- **Images:** Metadata, tags, descriptions, date precision, file information
- **People:** Personal information with birth/death dates (foundation for family tree nodes)
- **Image-People Links:** Many-to-many relationships with bounding box coordinates for spatial annotations

**Future Family Tree Schema (Planned):**
- **Users:** Authentication, profile information, permissions, invitation system
- **User-Person Links:** Connect registered users to their person records in the family tree
- **Invitations:** Invitation tokens, expiration, person associations for photo-based onboarding
- **Relationships:** Parent-child, spouse, sibling connections between people
- **Family Groups:** Household/family unit organization
- **Genealogical Data:** Extended family information, sources, citations

### Key Features

**Currently Implemented:**
1. **Image Gallery:** Responsive viewer with thumbnail navigation, virtual scrolling, keyboard shortcuts
2. **Metadata Management:** Tags, descriptions, flexible date precision (hour/day/month/year/decade)
3. **People Association:** Link people to images with spatial bounding boxes for face/person locations
4. **Image Processing:** Rotation, cropping, filesystem synchronization with checksum validation
5. **File System Integration:** Automatic discovery and sync of images from `public/images` directory

**Planned Family Tree Features:**
1. **User Authentication & Invitations:** Login system with invite-based registration
2. **Photo-Based User Onboarding:** Click on people in photos to send registration invites
3. **User-Person Association:** Link registered users to their person records in the family tree
4. **Relationship Management:** Create parent-child, spouse, and sibling connections
5. **Family Tree Visualization:** Interactive tree diagrams with photo integration
6. **Genealogical Timeline:** Chronological view of family events and photos
7. **Advanced Search:** Find people by relationship, generation, or time period
8. **Import/Export:** GEDCOM file support for genealogy software integration
9. **Collaborative Editing:** Multi-user family tree building with role-based permissions

### API Architecture
**Current RESTful endpoints under `/api/`:**
- `/api/images` - Image CRUD operations, rotation, stats, filesystem sync
- `/api/people` - People management and image linking (foundation for family tree nodes)
- `/api/health` - Health checks

**Planned Family Tree APIs:**
- `/api/auth` - User authentication, login, logout, session management
- `/api/invitations` - Create, send, and redeem invitation links tied to people in photos
- `/api/users` - User profile management, user-person associations
- `/api/relationships` - Manage family connections (parent, child, spouse, sibling)
- `/api/tree` - Generate family tree structures and genealogical queries
- `/api/timeline` - Chronological family events and photo associations
- `/api/gedcom` - Import/export genealogy data in standard formats

### File Structure Highlights
- `src/app/api/` - Next.js API routes
- `src/components/` - React components (Gallery, ImageDisplay, metadata panels)
- `src/lib/db/` - Database schema and connection
- `shared/types/` - TypeScript interfaces shared between frontend/backend
- `drizzle/` - Database migrations

### Important Development Notes
- **Current Focus:** Photo gallery functionality is fully implemented and working
- **Family Tree Goal:** The end goal is a complete family tree application with genealogical features
- Images are stored in `public/images/` and managed via filesystem sync
- Database uses UUID primary keys with referential integrity constraints
- TypeScript interfaces in `shared/types/api.ts` define all API contracts
- Image processing uses Sharp with cache-busting for updates
- The People table serves as the foundation for future family tree nodes
- The app supports Docker deployment with multi-service orchestration

### Development Priorities
When implementing new features, consider the family tree end goal:
1. **Authentication System:** Implement user login, registration, and invitation system
2. **Photo-Based Invitations:** Enable clicking on people in photos to send registration invites
3. **User-Person Linking:** Connect authenticated users to their person records in the database
4. **People Management:** Enhance person profiles with genealogical fields
5. **Relationship System:** Design and implement family connections
6. **Tree Visualization:** Interactive family tree components with user permissions
7. **Photo Integration:** Seamlessly connect photos to family members and events

### Testing
The codebase does not currently have a defined test framework - check README or ask the user for test commands before implementing tests.

## Important Project Rules
- **Git Commits:** NEVER commit changes unless the user explicitly asks you to. The user prefers to handle git commits themselves.
- **Development Server:** NEVER run the development server (npm run dev, npm start, etc.). The user runs the project themselves.