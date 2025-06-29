# Authentication & Authorization Implementation Tickets

**RFC Reference:** RFC-002-authentication-authorization.md  
**Created:** 2025-01-26  
**Status:** Ready for Implementation  
**Architecture:** JWT-based authentication with invitation-only registration

## Executive Summary

This document outlines implementation tickets for the Family Tree authentication system. The system supports closed registration through universal invite codes and person-specific invitations generated from photo tagging.

## Technical Overview

### Stack
- **Backend:** Next.js API Routes, PostgreSQL, Drizzle ORM
- **Auth:** JWT tokens, bcrypt password hashing
- **Frontend:** Next.js App Router, React Context API
- **Security:** httpOnly cookies, secure token generation

### Key Design Decisions
1. **Closed System:** No public registration
2. **JWT Tokens:** Stateless authentication
3. **Simple Permissions:** View/edit for all users, admin for user management
4. **Person Linking:** Auto-link users to people in photos via invitations

---

## Phase 1: Core Authentication Infrastructure

### TICKET: AUTH-001 - Database Schema Creation
**Priority:** Critical  
**Estimated:** 4 hours  
**Dependencies:** None

**Description:**  
Create database schema for authentication system including users, user_persons, and invitations tables.

**Technical Requirements:**
```sql
-- Users table with auth fields
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    is_admin BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    last_login_at TIMESTAMP,
    email_verified_at TIMESTAMP
);

-- User-Person associations (1:many ready, 1:1 for MVP)
CREATE TABLE user_persons (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT false NOT NULL,
    linked_at TIMESTAMP DEFAULT NOW() NOT NULL,
    linked_by UUID REFERENCES users(id),
    PRIMARY KEY (user_id, person_id)
);

-- Invitations for registration
CREATE TABLE invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token VARCHAR(255) UNIQUE NOT NULL,
    person_id UUID REFERENCES people(id) ON DELETE CASCADE,
    created_by UUID REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP,
    used_by UUID REFERENCES users(id),
    image_id UUID REFERENCES images(id),
    invitation_type VARCHAR(20) NOT NULL DEFAULT 'person',
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);
```

**Acceptance Criteria:**
- [ ] Migration file created in `drizzle/` directory
- [ ] All tables created with proper constraints
- [ ] Indexes added for performance
- [ ] Drizzle schema types generated
- [ ] Migration runs successfully

---

### TICKET: AUTH-002 - JWT Authentication Service
**Priority:** Critical  
**Estimated:** 6 hours  
**Dependencies:** AUTH-001

**Description:**  
Implement core authentication service with JWT token generation, validation, and bcrypt password hashing.

**Technical Requirements:**
```typescript
// services/AuthService.ts
export class AuthService {
    generateToken(user: User): string;
    validateToken(token: string): TokenPayload;
    hashPassword(password: string): Promise<string>;
    comparePassword(password: string, hash: string): Promise<boolean>;
    extractUserFromRequest(request: NextRequest): Promise<User | null>;
}
```

**Environment Variables:**
```env
JWT_SECRET=minimum-32-character-secure-random-string
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=12
```

**Acceptance Criteria:**
- [ ] JWT token generation with user payload
- [ ] Token validation and expiration handling
- [ ] Password hashing with bcrypt (12 rounds)
- [ ] Secure token storage in httpOnly cookies
- [ ] Request user extraction helper
- [ ] Unit tests for all methods

---

### TICKET: AUTH-003 - Authentication Middleware
**Priority:** Critical  
**Estimated:** 4 hours  
**Dependencies:** AUTH-002

**Description:**  
Create Next.js middleware for protecting routes and validating authentication tokens.

**Technical Requirements:**
```typescript
// middleware/auth.ts
export async function authMiddleware(request: NextRequest) {
    // Extract token from cookie or Authorization header
    // Validate token and attach user to request
    // Return 401 for invalid/missing tokens
}

// middleware.ts (Next.js root)
export function middleware(request: NextRequest) {
    // Apply auth middleware to protected routes
    // Redirect unauthenticated users to login
}
```

**Acceptance Criteria:**
- [ ] Middleware validates JWT tokens
- [ ] User context attached to request headers
- [ ] Public routes properly excluded
- [ ] 401 responses for invalid tokens
- [ ] Redirect logic for unauthenticated access
- [ ] Works with both cookie and header auth

---

### TICKET: AUTH-004 - Core Authentication Endpoints
**Priority:** Critical  
**Estimated:** 8 hours  
**Dependencies:** AUTH-002, AUTH-003

**Description:**  
Implement core authentication API endpoints for login, logout, and session management.

**Technical Requirements:**
```typescript
// API Endpoints
POST   /api/auth/login         // Email/password authentication
POST   /api/auth/logout        // Clear session
GET    /api/auth/me           // Current user info
POST   /api/auth/refresh      // Refresh token
PATCH  /api/auth/me           // Update profile
POST   /api/auth/change-password
```

**Request/Response Examples:**
```typescript
// POST /api/auth/login
{
    "email": "user@example.com",
    "password": "securepassword"
}
// Response
{
    "user": { id, email, username, isAdmin },
    "token": "jwt-token-here"
}
```

**Acceptance Criteria:**
- [ ] Login endpoint with email/password
- [ ] Secure cookie set on successful login
- [ ] Logout clears session cookie
- [ ] Current user endpoint returns user data
- [ ] Password change with old password verification
- [ ] Proper error responses with status codes
- [ ] Integration tests for all endpoints

---

## Phase 2: Invitation System

### TICKET: AUTH-005 - Invitation Service
**Priority:** High  
**Estimated:** 6 hours  
**Dependencies:** AUTH-001

**Description:**  
Implement invitation service for generating and validating invitation tokens.

**Technical Requirements:**
```typescript
// services/InvitationService.ts
export class InvitationService {
    createPersonInvitation(data: {
        personId: string;
        createdBy: string;
        imageId?: string;
    }): Promise<{ inviteUrl: string; invitation: Invitation }>;
    
    createUniversalInvitation(): Promise<{ code: string }>;
    
    validateInvitation(token: string): Promise<InvitationValidation>;
    
    markAsUsed(invitationId: string, userId: string): Promise<void>;
    
    revokeInvitation(invitationId: string): Promise<void>;
}
```

**Security Requirements:**
- Cryptographically secure random tokens (32 bytes)
- Single-use enforcement
- 7-day expiration
- Universal code from environment variable

**Acceptance Criteria:**
- [ ] Generate secure invitation tokens
- [ ] Person-specific invitation creation
- [ ] Universal code validation
- [ ] Expiration checking
- [ ] Single-use enforcement
- [ ] Database transaction safety
- [ ] Unit tests for all scenarios

---

### TICKET: AUTH-006 - Registration with Invitations
**Priority:** High  
**Estimated:** 6 hours  
**Dependencies:** AUTH-002, AUTH-005

**Description:**  
Implement registration endpoints supporting both universal code and person-specific invitations.

**Technical Requirements:**
```typescript
// API Endpoints
POST   /api/auth/register      // With invitation token
GET    /api/auth/verify-invite // Check invitation validity

// Registration flows
1. Universal code registration
2. Person-specific invitation registration
```

**Transaction Requirements:**
- Create user account
- Link to person (if applicable)
- Mark invitation as used
- Generate initial JWT token

**Acceptance Criteria:**
- [ ] Registration with universal code
- [ ] Registration with person invitation
- [ ] Auto-link user to person
- [ ] Transactional safety
- [ ] Invitation marked as used
- [ ] Validation for existing emails
- [ ] Password strength validation
- [ ] Integration tests for both flows

---

### TICKET: AUTH-007 - Invitation Management Endpoints
**Priority:** High  
**Estimated:** 5 hours  
**Dependencies:** AUTH-005, AUTH-003

**Description:**  
Create API endpoints for invitation management by authenticated users.

**Technical Requirements:**
```typescript
// Protected endpoints
POST   /api/invitations                    // Create invitation
GET    /api/invitations                    // List sent invitations
GET    /api/invitations/:id                // Get details
DELETE /api/invitations/:id                // Revoke invitation
```

**Acceptance Criteria:**
- [ ] Create person-specific invitations
- [ ] List invitations with pagination
- [ ] Show invitation status and usage
- [ ] Revoke unused invitations
- [ ] Proper authorization checks
- [ ] API response formatting
- [ ] Error handling

---

## Phase 3: Frontend Integration

### TICKET: AUTH-008 - Authentication Pages
**Priority:** High  
**Estimated:** 8 hours  
**Dependencies:** AUTH-004, AUTH-006

**Description:**  
Create login and registration pages with proper form validation and error handling.

**Components:**
```typescript
// app/auth/login/page.tsx
// app/auth/register/page.tsx
// app/invite/[token]/page.tsx
// components/auth/LoginForm.tsx
// components/auth/RegisterForm.tsx
// components/auth/UniversalCodeForm.tsx
```

**UI Requirements:**
- Responsive design
- Form validation
- Loading states
- Error messages
- Success feedback
- Password visibility toggle

**Acceptance Criteria:**
- [ ] Login page with email/password form
- [ ] Registration with universal code
- [ ] Registration with invitation token
- [ ] Client-side validation
- [ ] Server error handling
- [ ] Loading/disabled states
- [ ] Redirect after success
- [ ] Mobile responsive

---

### TICKET: AUTH-009 - Auth Context Provider
**Priority:** High  
**Estimated:** 6 hours  
**Dependencies:** AUTH-004

**Description:**  
Create React Context for managing authentication state across the application.

**Technical Requirements:**
```typescript
// contexts/AuthContext.tsx
interface AuthContextValue {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
}
```

**Features:**
- Persistent auth state
- Auto-refresh on mount
- Global error handling
- Loading states
- Logout functionality

**Acceptance Criteria:**
- [ ] Auth context provider component
- [ ] useAuth hook for consumers
- [ ] Persistent session check
- [ ] Loading states during auth
- [ ] Error handling
- [ ] Logout clears state
- [ ] TypeScript types
- [ ] Usage documentation

---

### TICKET: AUTH-010 - Protected Route Wrapper
**Priority:** High  
**Estimated:** 4 hours  
**Dependencies:** AUTH-003, AUTH-009

**Description:**  
Implement client-side route protection using Next.js middleware and auth context.

**Technical Requirements:**
```typescript
// middleware.ts
export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico|auth|invite).*)'],
};

// components/auth/ProtectedRoute.tsx
// HOC for client-side protection
```

**Acceptance Criteria:**
- [ ] Middleware redirects to login
- [ ] Public routes accessible
- [ ] Protected routes require auth
- [ ] Loading state during check
- [ ] Preserve intended destination
- [ ] Client-side protection component
- [ ] Admin route protection

---

### TICKET: AUTH-011 - Update Existing API Calls
**Priority:** High  
**Estimated:** 6 hours  
**Dependencies:** AUTH-009

**Description:**  
Update all existing API calls to include authentication headers and handle 401 responses.

**Affected Files:**
- `lib/api.ts` - Add auth headers
- `lib/peopleApi.ts` - Handle auth
- All components using API calls

**Technical Requirements:**
```typescript
// Add to all API calls
headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
}

// Global 401 handler
if (response.status === 401) {
    // Redirect to login
    // Clear auth state
}
```

**Acceptance Criteria:**
- [ ] Auth headers on all requests
- [ ] Global 401 response handler
- [ ] Token refresh logic
- [ ] Error boundary updates
- [ ] Loading states preserved
- [ ] All features work with auth
- [ ] E2E tests pass

---

## Phase 4: Person Invitation UI

### TICKET: AUTH-012 - Invitation UI in PersonBoundingBox
**Priority:** Medium  
**Estimated:** 6 hours  
**Dependencies:** AUTH-007, Person Selection Feature

**Description:**  
Add invitation functionality to the PersonBoundingBox component for photo-based invitations.

**UI Elements:**
```typescript
// Enhanced PersonBoundingBox
- Invite button (link icon)
- Invitation modal
- Copy link functionality
- Success feedback
- Expiration display
```

**Acceptance Criteria:**
- [ ] Invite button on person boxes
- [ ] Modal shows invitation link
- [ ] Copy to clipboard
- [ ] Visual feedback on copy
- [ ] Show expiration time
- [ ] Handle API errors
- [ ] Mobile-friendly modal
- [ ] Accessibility compliance

---

### TICKET: AUTH-013 - User-Person Management UI
**Priority:** Medium  
**Estimated:** 5 hours  
**Dependencies:** AUTH-009

**Description:**  
Create UI for users to view and manage their person associations.

**Components:**
```typescript
// app/profile/page.tsx
// components/profile/LinkedPerson.tsx
// components/profile/PersonSearch.tsx
```

**Features:**
- View linked person records
- See person details
- Upload profile photo
- View family connections (future)

**Acceptance Criteria:**
- [ ] Profile page with user info
- [ ] Display linked person
- [ ] Person details card
- [ ] No person placeholder
- [ ] Admin can link any user
- [ ] Responsive design
- [ ] Loading states

---

## Phase 5: Admin Features

### TICKET: AUTH-014 - Admin User Management
**Priority:** Low  
**Estimated:** 8 hours  
**Dependencies:** AUTH-009, AUTH-013

**Description:**  
Create admin dashboard for user and invitation management.

**Admin Pages:**
```typescript
// app/admin/users/page.tsx
// app/admin/invitations/page.tsx
// components/admin/UserTable.tsx
// components/admin/InvitationHistory.tsx
```

**Features:**
- User list with search
- Activate/deactivate users
- View invitation history
- Manual user-person linking
- Revoke active invitations

**Acceptance Criteria:**
- [ ] Admin-only route protection
- [ ] User table with actions
- [ ] Search and filter
- [ ] Bulk operations
- [ ] Invitation history view
- [ ] Manual linking UI
- [ ] Confirmation dialogs
- [ ] Audit logging

---

### TICKET: AUTH-015 - Security Hardening
**Priority:** Medium  
**Estimated:** 4 hours  
**Dependencies:** All auth tickets

**Description:**  
Implement security best practices and hardening measures.

**Security Measures:**
- Rate limiting on auth endpoints
- CSRF protection
- Security headers
- Input sanitization
- SQL injection prevention
- XSS protection

**Acceptance Criteria:**
- [ ] Rate limiting implemented
- [ ] Security headers configured
- [ ] Input validation on all forms
- [ ] Parameterized queries verified
- [ ] OWASP compliance check
- [ ] Security audit passed
- [ ] Documentation updated

---

## Testing Strategy

### Unit Tests
- Auth service methods
- Invitation validation
- JWT token handling
- Password hashing

### Integration Tests
- Full registration flows
- Login/logout cycles
- Invitation expiration
- Protected route access

### E2E Tests
- Complete user journey
- Invitation click-through
- Session persistence
- Error scenarios

## Performance Considerations

1. **Database Optimization**
   - Indexes on all foreign keys
   - Token lookup optimization
   - Efficient user queries

2. **Caching Strategy**
   - Consider Redis for sessions
   - Cache user permissions
   - Invitation validation cache

3. **Security Headers**
   ```typescript
   X-Frame-Options: DENY
   X-Content-Type-Options: nosniff
   X-XSS-Protection: 1; mode=block
   Strict-Transport-Security: max-age=31536000
   ```

## Migration Checklist

- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Admin user seeded
- [ ] Universal code set
- [ ] JWT secret generated
- [ ] All tests passing
- [ ] Security audit complete
- [ ] Documentation updated
- [ ] Team training complete

## Success Metrics

- Zero unauthorized access incidents
- < 2s authentication response time
- 99.9% auth service uptime
- < 5% invitation expiration rate
- 100% test coverage on auth code

---

**Total Estimated Effort:** 85-95 hours  
**Recommended Team Size:** 2-3 developers  
**Target Completion:** 2-3 weeks
