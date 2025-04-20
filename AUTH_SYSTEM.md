# JetStream Authentication System

This document outlines the authentication system for the GDY·UP / JetStream platform.

## Authentication Architecture

The authentication system has been consolidated and simplified to prevent redirect loops and session issues. It follows a centralized approach with these key components:

### Core Components

1. **Auth Provider** (`/lib/auth-provider.tsx`)
   - Single source of truth for auth state
   - Handles session management, sign in/out, and profile sync
   - Exposes the `useAuth()` hook for components

2. **Middleware** (`/middleware.ts`)
   - Protects routes that require authentication
   - Redirects unauthenticated users to login
   - Handles API route authentication
   - Prevents redirect loops

3. **Dev Mode** (`/lib/dev-auth.ts`)
   - Production-compatible development mode
   - Uses real user data from the database
   - Bypasses actual authentication for development

4. **Auth Persistence** (`/lib/hooks/useAuthPersistence.ts`)
   - Maintains auth state across page navigation
   - Handles session refresh and storage sync

### Authentication Flow

1. User visits the site → Middleware checks for auth cookies
2. If authenticated → User proceeds to the requested page
3. If not authenticated on a protected route → Redirect to login
4. After login → User is redirected back to the original route

## Development Mode

The system includes a development mode that bypasses the authentication process while still using real user data from the database:

1. Set `NEXT_PUBLIC_AUTH_DEV_MODE=true` in `.env.local`
2. Set `NEXT_PUBLIC_AUTH_DEV_USER_ID` to a real user ID from your database
3. Optionally set `NEXT_PUBLIC_AUTH_DEV_USER_EMAIL` (will be fetched from DB if not set)

This dev mode will:
- Fetch the real user profile from the database
- Create a mock session with that user's data
- Bypass the normal auth flow for development

## Using the Auth System

### In React Components

```tsx
import { useAuth } from "@/lib/auth-provider";

function MyComponent() {
  const { user, loading, signIn, signOut } = useAuth();

  if (loading) return <div>Loading...</div>;
  
  if (!user) {
    return <button onClick={() => signIn("email", "password")}>Sign In</button>;
  }
  
  return (
    <div>
      <p>Welcome, {user.email}</p>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
```

### Protected Routes

Protected routes are handled automatically by the middleware. Just use your components normally, and unauthenticated users will be redirected to login.

## Troubleshooting

### Authentication Loops

If you experience redirect loops:

1. Check that your middleware is correctly identifying protected vs public routes
2. Verify that auth cookies are being set correctly
3. Look for competing auth checks in layouts or guards
4. Check browser console for auth-related errors
5. Try clearing cookies and local storage

### Session Not Persisting

If the session isn't persisting between page refreshes:

1. Check that cookies are being set correctly
2. Ensure the `useAuthPersistence` hook is being used
3. Verify localStorage values: `jetstream_user_id`, `jetstream_session_time`
4. Check for cross-domain issues if using multiple environments

## Environment Variables

The following environment variables configure the auth system:

```
# Required for all environments
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_APP_URL=https://your-app-url.com

# Development Mode (optional)
NEXT_PUBLIC_AUTH_DEV_MODE=false
NEXT_PUBLIC_AUTH_DEV_USER_ID=real_user_id_from_database
NEXT_PUBLIC_AUTH_DEV_USER_EMAIL=example@email.com
``` 