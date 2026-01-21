import passport from 'passport';
import { Strategy as GoogleStrategy, Profile, VerifyCallback } from 'passport-google-oauth20';
import userService from './userServices';
import typeSafeLogger from '../utils/typeSafeLogger';
import { toAppError } from '../utils/errors';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/auth/google/callback';

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  typeSafeLogger.warn('Google OAuth credentials not configured');
}

// Configure Google OAuth strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID || '',
      clientSecret: GOOGLE_CLIENT_SECRET || '',
      callbackURL: GOOGLE_CALLBACK_URL,
      scope: ['profile', 'email'],
    },
    async (accessToken: string, refreshToken: string, profile: Profile, done: VerifyCallback) => {
      try {
        typeSafeLogger.info('Google OAuth callback', { profileId: profile.id });

        // Extract user info from Google profile
        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(new Error('No email provided by Google'), undefined);
        }

        const firstName = profile.name?.givenName;
        const lastName = profile.name?.familyName;
        const profilePicture = profile.photos?.[0]?.value;

        // Check if user already exists
        let user = await userService.getUserByEmail(email);

        if (!user) {
          // Create new user from Google profile
          const username = email.split('@')[0] + '_' + Math.random().toString(36).substring(7);
          
          user = await userService.createUser(
            username,
            email,
            // Generate a random password (user won't use it, they'll use Google OAuth)
            Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
            firstName,
            lastName,
            profilePicture
          );

          typeSafeLogger.logUserAction('New user created via Google OAuth', { userId: user.id, email });
        } else {
          typeSafeLogger.logUserAction('Existing user logged in via Google OAuth', { userId: user.id, email });
        }

        return done(null, user);
      } catch (error) {
        typeSafeLogger.logError('Google OAuth error', toAppError(error, {
          message: 'Failed to authenticate with Google',
          code: 'GOOGLE_AUTH_FAILED'
        }));
        return done(error as Error, undefined);
      }
    }
  )
);

// Serialize user for session (not used with JWT, but required by passport)
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: number, done) => {
  try {
    const user = await userService.getUserById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;
