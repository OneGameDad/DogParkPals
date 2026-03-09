import passport from 'passport';
import { Strategy as GoogleStrategy, Profile, VerifyCallback } from 'passport-google-oauth20';
import userService from './userServices';
import typeSafeLogger from '../utils/typeSafeLogger';
import { toAppError } from '../utils/errors';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || 'https://localhost:3000/auth/google/callback';

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  throw new Error(
    'Google OAuth credentials are required. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.'
  );
}

// Configure Google OAuth strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: GOOGLE_CALLBACK_URL,
    },
    async (accessToken: string, refreshToken: string, profile: Profile, done: VerifyCallback) => {
      try {
        typeSafeLogger.info('Google OAuth callback', { profileId: profile.id });

        // Extract user info from Google profile
        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(
            new Error(
              'Email not available from Google account. Please ensure your Google account has an email address and the email permission is granted.'
            ),
            undefined
          );
        }

        const firstName = profile.name?.givenName;
        const lastName = profile.name?.familyName;
        const profilePicture = profile.photos?.[0]?.value;

        // Upsert user by email to avoid race conditions on concurrent OAuth logins
        const username = email.split('@')[0] + '_' + Math.random().toString(36).substring(7);
        const randomPassword =
          Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

        const user = await userService.upsertUserByEmailOAuth(
          username,
          email,
          randomPassword,
          firstName,
          lastName,
          profilePicture
        );

        typeSafeLogger.logUserAction('User authenticated via Google OAuth', { userId: user.id, email });

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
