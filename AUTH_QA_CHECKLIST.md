# Authentication QA Checklist

This checklist guides the testing of the authentication system to ensure it works end-to-end across different scenarios.

## Development Mode Testing

- [ ] Set `NEXT_PUBLIC_AUTH_DEV_MODE=true` in `.env.local`
- [ ] Set `NEXT_PUBLIC_AUTH_DEV_USER_ID` to a real user ID from your database
- [ ] Start the app with `npm run dev`
- [ ] Verify you're automatically logged in with the dev user
- [ ] Check profile data matches the real user from the database
- [ ] Navigate between public and protected routes without auth prompts
- [ ] Verify API calls work with the dev session

## Production Mode Testing

### Sign Up

- [ ] Navigate to `/auth/register`
- [ ] Create a new account with email and password
- [ ] Verify confirmation email is sent (check logs or email provider)
- [ ] Verify appropriate success message is shown

### Login Flow

- [ ] Navigate to a protected route (e.g., `/gdyup/dashboard`)
- [ ] Verify redirect to login page with returnUrl in query params
- [ ] Log in with valid credentials
- [ ] Verify redirect back to original protected route
- [ ] Test remembered login state after page refresh

### Authentication Persistence

- [ ] Login and navigate through multiple pages
- [ ] Refresh the browser on different routes
- [ ] Verify session persists across navigation and refreshes
- [ ] Leave the site idle for 10+ minutes and verify session still works

### Logout Flow

- [ ] Click logout button while on a protected route
- [ ] Verify redirect to appropriate home page (JetShare or GDY·UP)
- [ ] Verify protected routes redirect to login after logout
- [ ] Verify localStorage auth data is cleared after logout

### Password Reset

- [ ] Navigate to forgot password page
- [ ] Request password reset for your email
- [ ] Verify reset email is sent
- [ ] Follow reset link and set new password
- [ ] Log in with new password

### Error Handling

- [ ] Login with invalid credentials
- [ ] Verify appropriate error message
- [ ] Register with existing email
- [ ] Verify appropriate error message
- [ ] Force a session token to expire and verify graceful handling

### Cross-Browser Testing

- [ ] Test login flow in Chrome
- [ ] Test login flow in Firefox
- [ ] Test login flow in Safari
- [ ] Test login flow in Edge
- [ ] Test login flow on mobile browsers (iOS Safari, Android Chrome)

## Specific Route Testing

### GDY·UP Routes

- [ ] `/gdyup/dashboard` - Verify requires auth
- [ ] `/gdyup/profile` - Verify requires auth
- [ ] `/gdyup/listings/manage` - Verify requires auth
- [ ] `/gdyup` (home) - Verify public access works

### JetShare Routes

- [ ] `/jetshare/dashboard` - Verify requires auth
- [ ] `/jetshare/listings/manage` - Verify requires auth
- [ ] `/jetshare` (home) - Verify public access works

### API Routes

- [ ] Test a protected API endpoint with valid auth
- [ ] Test a protected API endpoint with no auth (should return 401)
- [ ] Test a protected API endpoint with expired token
- [ ] Verify API refresh token mechanism works

## Edge Cases

- [ ] Test behavior when cookies are disabled
- [ ] Test navigation between JetShare and GDY·UP authenticated areas
- [ ] Test authentication after clearing browser cache but not cookies
- [ ] Test behavior when localStorage is unavailable (private browsing)
- [ ] Test auth with slow network conditions (throttled connection)

## Redirect Loop Prevention

- [ ] Force a redirect loop scenario (if possible)
- [ ] Verify the site doesn't get stuck in an infinite loop
- [ ] Check that the error page shows when too many redirects occur
