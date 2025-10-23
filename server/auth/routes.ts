import { Router, Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { logger } from '../monitoring';
import { authMetrics } from '../metrics/authMetrics';
import { verifySessionPersistence } from '../middleware/sessionPersistenceCheck';

const router = Router();

// Helper function to get the correct strategy name based on request host
function getStrategyName(req: Request): string {
  let host = req.get('host') || req.hostname || 'localhost';
  
  // Remove port from host if present
  host = host.split(':')[0];
  
  // Use the old auth system's naming convention with colon
  const strategyName = `replitauth:${host}`;
  logger.debug('🔍 Selecting auth strategy:', { rawHost: req.get('host'), cleanedHost: host, strategyName });
  return strategyName;
}

router.get('/api/login', (req: Request, res: Response, next: NextFunction) => {
  logger.info('🔐 Login request received', {
    ip: req.ip,
    userAgent: req.get('user-agent'),
    host: req.get('host'),
  });
  
  const strategyName = getStrategyName(req);
  
  passport.authenticate(strategyName, {
    failureRedirect: '/login-error',
    failureMessage: true,
  })(req, res, next);
});

// Callback handler logic (shared by both routes)
const handleCallback = (req: Request, res: Response, next: NextFunction) => {
  const loginStart = Date.now();

  logger.info('🔐 OAuth callback received', {
    query: Object.keys(req.query),
    hasCode: !!req.query.code,
    hasState: !!req.query.state,
    code: req.query.code ? `${String(req.query.code).substring(0, 10)}...` : 'none',
    state: req.query.state ? `${String(req.query.state).substring(0, 10)}...` : 'none',
    host: req.get('host'),
    sessionID: req.sessionID,
    hasSession: !!req.session,
    cookies: req.headers.cookie ? 'present' : 'missing',
  });

  const strategyName = getStrategyName(req);
  logger.info(`   - Using strategy: ${strategyName}`);

  passport.authenticate(strategyName, {
    failureRedirect: '/login-error',
    failureMessage: true,
  }, (err: any, user: any, info: any) => {
    logger.info('🔐 Passport authenticate callback invoked', {
      hasError: !!err,
      hasUser: !!user,
      hasInfo: !!info,
      userKeys: user ? Object.keys(user) : 'none',
      infoKeys: info ? Object.keys(info) : 'none',
    });

    if (err) {
      const duration = Date.now() - loginStart;
      authMetrics.recordLoginAttempt('failure', duration, undefined, err.message);
      logger.error('❌ OAuth callback error:', {
        message: err.message,
        stack: err.stack,
      });
      return res.redirect('/login-error?reason=auth_failed');
    }

    if (!user) {
      const duration = Date.now() - loginStart;
      authMetrics.recordLoginAttempt('failure', duration, undefined, 'No user returned from auth');
      const debugInfo = {
        info: JSON.stringify(info),
        hasError: !!err,
        errorMessage: err?.message,
        strategyName,
        host: req.get('host'),
      };
      logger.error('⚠️  OAuth callback: No user returned', debugInfo);

      // Pass error details in URL for debugging
      const errorDetails = encodeURIComponent(JSON.stringify(debugInfo));
      return res.redirect(`/login-error?reason=no_user&debug=${errorDetails}`);
    }

    logger.info('✅ User object received from strategy:', {
      userId: user.id,
      email: user.email,
      hasFirstName: !!user.firstName,
      hasLastName: !!user.lastName,
      isNewUser: info?.isNewUser,
    });

    logger.info('   - About to call req.logIn()...');
    req.logIn(user, (loginErr) => {
      if (loginErr) {
        const duration = Date.now() - loginStart;
        authMetrics.recordLoginAttempt('failure', duration, user.id, loginErr.message);
        authMetrics.recordSessionError('store', loginErr.message, user.id);
        logger.error('❌ Session login error:', {
          message: loginErr.message,
          userId: user.id,
          sessionID: req.sessionID,
        });
        return res.redirect('/login-error?reason=session_failed');
      }

      const duration = Date.now() - loginStart;
      authMetrics.recordLoginAttempt('success', duration, user.id);
      authMetrics.addActiveSession(req.sessionID);

      logger.info('✅ req.logIn() completed successfully');
      logger.info('   - Session after login:', {
        sessionID: req.sessionID,
        hasPassport: !!(req.session as any).passport,
        passportUser: (req.session as any).passport?.user,
        sessionKeys: Object.keys(req.session),
      });

      logger.info('🍪 Session cookie info', {
        setCookieHeaders: res.getHeader('set-cookie'),
        cookieFromRequest: req.headers.cookie,
      });

      // Verify session persistence before redirecting
      logger.info('🔍 Verifying session persistence...');
      verifySessionPersistence(req, req.sessionID, user.id, (success) => {
        if (!success) {
          logger.error('❌ Session persistence verification failed!', {
            userId: user.id,
            sessionID: req.sessionID,
          });
          // Still redirect but log the issue - user might need to re-login
          // Better than blocking them completely
        } else {
          logger.info('✅ Session persistence verified - user fully authenticated');
        }

        // Redirect new users to subscriptions page
        if (info?.isNewUser) {
          logger.info('🆕 New user - redirecting to subscriptions');
          return res.redirect('/subscription?welcome=true');
        }

        logger.info('✅ Existing user - redirecting to home');
        res.redirect('/');
      });
    });
  })(req, res, next);
};

// Primary callback route (used by old replitAuth.ts)
router.get('/api/callback', handleCallback);

// Alternative callback route (for new auth system)
router.get('/api/auth/callback', handleCallback);

// Note: /api/auth/user is handled in routes.ts with full database lookup and logging

router.post('/api/logout', (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user ? (req.user as any).id : 'unknown';
  const sessionId = req.sessionID;

  logger.info('🔐 Logout request', { userId });

  req.logout((err) => {
    if (err) {
      logger.error('❌ Logout error:', {
        message: err.message,
        userId,
      });
      return next(err);
    }

    req.session.destroy((destroyErr) => {
      if (destroyErr) {
        logger.error('❌ Session destroy error:', {
          message: destroyErr.message,
          userId,
        });
      }

      authMetrics.removeActiveSession(sessionId);
      logger.info('✅ User logged out successfully', { userId });
      res.redirect('/');
    });
  });
});

// Also support GET requests for direct navigation
router.get('/api/logout', (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user ? (req.user as any).id : 'unknown';
  const sessionId = req.sessionID;

  logger.info('🔐 Logout request (GET)', { userId });

  req.logout((err) => {
    if (err) {
      logger.error('❌ Logout error:', {
        message: err.message,
        userId,
      });
      return next(err);
    }

    req.session.destroy((destroyErr) => {
      if (destroyErr) {
        logger.error('❌ Session destroy error:', {
          message: destroyErr.message,
          userId,
        });
      }

      authMetrics.removeActiveSession(sessionId);
      logger.info('✅ User logged out successfully', { userId });
      res.redirect('/');
    });
  });
});

export function createAuthRouter(): Router {
  logger.info('🔧 Creating auth router...');
  logger.info('   - GET /api/login');
  logger.info('   - GET /api/callback (primary)');
  logger.info('   - GET /api/auth/callback (alternative)');
  logger.info('   - POST /api/logout');
  logger.info('   - GET /api/logout');
  logger.info('   ℹ️  Note: /api/auth/user handled in routes.ts');
  return router;
}
