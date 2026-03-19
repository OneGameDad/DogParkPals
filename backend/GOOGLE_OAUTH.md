# Google OAuth Implementation Guide

## Overview

This document describes the Google OAuth 2.0 authentication implementation for DogParkPals. Users can now sign in using their Google accounts, providing a seamless and secure authentication experience.

## Architecture

### Components

#### Backend Services
- **googleAuthService.ts** - Passport.js Google OAuth strategy configuration
- **authController.ts** - OAuth callback handler and JWT token generation
- **authRouter.ts** - Google OAuth routes (`/auth/google`, `/auth/google/callback`)

#### Frontend Pages
- **GoogleCallback.tsx** - Handles OAuth callback and token storage

### Flow Diagram

```
User clicks "Sign in with Google"
         ↓
GET /auth/google (backend initiates OAuth)
         ↓
Redirects to Google's authorization page
         ↓
User grants permissions
         ↓
Google redirects to /auth/google/callback
         ↓
Backend verifies with Google & creates/updates user
         ↓
Backend generates JWT token
         ↓
Backend redirects to frontend callback with token
         ↓
Frontend stores token and redirects to dashboard
```

## Setup Instructions

### Prerequisites

- Google Cloud Console account
- Node.js 16+ (backend)
- React 18+ (frontend)

### 1. Google Cloud Console Setup

1. **Create a new project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one

2. **Create OAuth 2.0 Credentials**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Select "Web application" as the application type
   - Under "Authorized JavaScript origins", add:
       - `https://localhost:5174` (development, Vite HTTPS server)
       - `http://localhost:5173` (optional compatibility entry, redirects to HTTPS)
     - `http://localhost:3000` (development)
     - `https://yourdomain.com` (production)
   - Under "Authorized redirect URIs", add:
     - `http://localhost:3000/auth/google/callback` (development)
     - `https://yourdomain.com/auth/google/callback` (production)
   - Click "Create"

3. **Copy Credentials**
   - Copy the Client ID and Client Secret

### 2. Backend Configuration

1. **Install Dependencies**
   ```bash
   cd backend
   npm install passport passport-google-oauth20
   npm install -D @types/passport @types/passport-google-oauth20
   ```

2. **Set Environment Variables**
   
   Add to `backend/.env`:
   ```bash
   GOOGLE_CLIENT_ID=your-client-id-here
   GOOGLE_CLIENT_SECRET=your-client-secret-here
   GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
   FRONTEND_URL=https://localhost:5174
   JWT_SECRET=your-jwt-secret
   ```

3. **Verify Service Files**
   
   The following files should exist:
   - `backend/src/services/googleAuthService.ts` - Passport configuration
   - `backend/src/controllers/authController.ts` - OAuth callback handler
   - `backend/src/routes/authRouter.ts` - OAuth routes

### 3. Frontend Configuration

1. **Create Google Callback Page**
   
   File: `frontend/src/pages/GoogleCallback.tsx`
   - Extracts token from URL query parameters
   - Stores token in localStorage
   - Redirects to dashboard

2. **Add Sign-In Button**
   
   Update your login page to include:
   ```jsx
   <a href="http://localhost:3000/auth/google" className="btn">
     Sign in with Google
   </a>
   ```

3. **Update Routes**
   
   Ensure your App.tsx includes:
   ```jsx
   <Route path="/auth/google/callback" element={<GoogleCallback />} />
   ```

## API Reference

### GET /auth/google
Initiates Google OAuth flow.

**Response:**
- Status: 302 (Redirect)
- Location: Google's OAuth authorization URL

### GET /auth/google/callback
OAuth callback endpoint (called by Google after user authorization).

**Query Parameters:**
- `code` - Authorization code from Google
- `state` - CSRF protection token

**Response:**
- Status: 302 (Redirect)
- Location: `https://localhost:5174/auth/google/callback?token=JWT_TOKEN`

## Authentication Flow

### User Creation

When a user signs in with Google for the first time:

1. Backend receives Google profile with email
2. Check if user with that email exists
3. If not, create new user with:
   - Email (from Google)
   - Auto-generated username (email prefix + random string)
   - Random password (never used)
   - First name, last name (from Google profile)
   - Profile picture (from Google profile)
4. Generate JWT token
5. Redirect to frontend with token

### Existing User Login

When an existing user signs in:

1. Backend receives Google profile
2. Find user by email
3. Generate JWT token
4. Redirect to frontend with token

## Token Management

### JWT Token Structure

```json
{
  "userId": 1,
  "email": "user@example.com",
  "role": "CLIENT",
  "iat": 1642512000,
  "exp": 1643116800
}
```

**Token Expiration:** 7 days

### Token Storage (Frontend)

```javascript
// Store token
localStorage.setItem('authToken', token);

// Retrieve token
const token = localStorage.getItem('authToken');

// Use token in API requests
headers: {
  'Authorization': `Bearer ${token}`
}
```

## Error Handling

### Common Errors

**1. Google Client ID/Secret Not Found**
- Check `.env` file has correct credentials
- Verify credentials from Google Cloud Console

**2. Redirect URI Mismatch**
- Ensure redirect URI in Google Cloud Console matches exactly:
  - `http://localhost:3000/auth/google/callback`
- Include protocol (http/https) and exact path

**3. CORS Errors**
- Check backend CORS configuration in `app.ts`
- Ensure frontend origin is allowed

**4. Token Storage Issues**
- Verify localStorage is enabled
- Check browser security settings
- Ensure token is valid before storing

## Testing

### Unit Tests

Run service tests:
```bash
npm test -- googleAuthService.test.ts
```

Run controller tests:
```bash
npm test -- authController.test.ts
```

Run route tests:
```bash
npm test -- googleOAuthRoutes.test.ts
```

### All Google OAuth Tests
```bash
npm test -- --testNamePattern="Google|googleCallback"
```

### Manual Testing

1. **Start Backend**
   ```bash
   cd backend
   npm run dev
   ```

2. **Start Frontend**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Test OAuth Flow**
   - Navigate to `https://localhost:5174/login`
   - Optional: `http://localhost:5173/login` will redirect to HTTPS
   - Click "Sign in with Google"
   - Grant permissions
   - Should redirect to dashboard with token stored

## Security Considerations

### Best Practices

1. **Environment Variables**
   - Never commit `.env` files
   - Use different credentials for dev/staging/production

2. **HTTPS in Production**
   - Always use HTTPS in production
   - Update redirect URIs to use `https://`

3. **Token Security**
   - Tokens stored in localStorage are vulnerable to XSS
   - Consider using httpOnly cookies for sensitive environments
   - Implement token refresh mechanism for long-lived sessions

4. **CORS Configuration**
   - Restrict CORS origins to trusted domains only
   - For local Vite dev, set `FRONTEND_URL=https://localhost:5174`

5. **Scope Permissions**
   - Only request necessary scopes: `profile` and `email`
   - Never request sensitive permissions unnecessarily

## Troubleshooting

### Issue: "Cannot read properties of undefined (reading 'google')"

**Cause:** Passport not initialized or Google strategy not registered

**Solution:**
```typescript
// In app.ts, ensure:
import passport from './services/googleAuthService';
app.use(passport.initialize());
```

### Issue: "Redirect URI mismatch"

**Cause:** Redirect URI in code doesn't match Google Console settings

**Solution:**
1. Go to Google Cloud Console
2. Check "Authorized redirect URIs"
3. Ensure it matches exactly: `http://localhost:3000/auth/google/callback`
4. Include protocol and full path

### Issue: User created but can't login again

**Cause:** Email matching or user retrieval issue

**Solution:**
1. Check database for user with correct email
2. Verify `getUserByEmail` query is case-insensitive
3. Check user service implementation

### Issue: Token not sent to frontend

**Cause:** Redirect URL not properly formatted

**Solution:**
1. Check `FRONTEND_URL` environment variable
2. Verify redirect uses query parameter: `?token=`
3. Ensure GoogleCallback component reads from `useSearchParams()`

### Issue: CORS errors when OAuth redirects

**Cause:** CORS not configured for OAuth callback

**Solution:**
```typescript
// In app.ts:
app.use(cors({
   origin: process.env.FRONTEND_URL || "https://localhost:5174",
  credentials: true,
}));
```

## Files Modified/Created

### New Files
- `backend/src/services/googleAuthService.ts` - Passport Google strategy
- `frontend/src/pages/GoogleCallback.tsx` - OAuth callback handler
- `backend/src/tests/googleAuthService.test.ts` - Service tests
- `backend/src/tests/googleOAuthRoutes.test.ts` - Route tests

### Modified Files
- `backend/src/controllers/authController.ts` - Added `googleCallback` method
- `backend/src/routes/authRouter.ts` - Added OAuth routes
- `backend/src/app.ts` - Added Passport initialization
- `frontend/src/App.tsx` - Added callback route

## Environment Variables Required

```bash
# Google OAuth
GOOGLE_CLIENT_ID=<from Google Cloud Console>
GOOGLE_CLIENT_SECRET=<from Google Cloud Console>
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# Frontend
FRONTEND_URL=https://localhost:5174

# JWT
JWT_SECRET=<your-jwt-secret>
```

## Production Deployment

1. **Update OAuth Credentials**
   - Create new credentials in Google Cloud Console for production domain
   - Update redirect URIs to production domain

2. **Set Environment Variables**
   - Use production credentials
   - Update FRONTEND_URL to production domain
   - Use secure JWT_SECRET

3. **HTTPS Configuration**
   - Ensure backend and frontend use HTTPS
   - Update all URLs from http:// to https://

4. **Token Security**
   - Consider implementing token refresh mechanism
   - Consider moving from localStorage to secure cookies
   - Implement token revocation on logout

## Related Documentation

- [Passport.js Documentation](http://www.passportjs.org/)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)
