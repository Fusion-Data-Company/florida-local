import { Request, Response, NextFunction } from 'express';
import { logger } from '../monitoring';
import { captureAuthWarning } from '../monitoring/authSentry';

/**
 * Middleware to handle OAuth state verification failures gracefully
 *
 * When OAuth state doesn't match (common causes: session lost, cookies blocked, multiple tabs),
 * this middleware provides a recovery path instead of showing a cryptic error.
 */
export function oauthStateRecoveryMiddleware(req: Request, res: Response, next: NextFunction) {
  // Only apply to OAuth callback routes
  if (!req.path.includes('/callback') && !req.path.includes('/api/auth')) {
    return next();
  }

  // Check if this is an OAuth callback with code but potentially mismatched state
  const hasCode = !!req.query.code;
  const hasState = !!req.query.state;
  const hasSession = !!req.session;

  if (hasCode && hasState && hasSession) {
    // Store OAuth parameters in session for potential recovery
    const oauthSession = req.session as any;
    oauthSession.lastOAuthAttempt = {
      code: String(req.query.code).substring(0, 20) + '...',
      state: String(req.query.state).substring(0, 20) + '...',
      timestamp: Date.now(),
      recovered: false,
    };
  }

  next();
}

/**
 * Error handler for OAuth state mismatch errors
 *
 * Catches state verification errors and redirects to a recovery page
 * instead of showing raw error to user.
 */
export function oauthStateErrorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Check if this is an OAuth state verification error
  const isStateError =
    err.message?.includes('state') ||
    err.message?.includes('Unable to verify authorization request state') ||
    err.name === 'AuthorizationError';

  if (isStateError) {
    logger.warn('⚠️  OAuth state verification failed - attempting recovery', {
      error: err.message,
      hasSession: !!req.session,
      hasCode: !!req.query.code,
      hasState: !!req.query.state,
      sessionID: req.sessionID,
      userAgent: req.get('user-agent'),
    });

    captureAuthWarning('OAuth state verification failed', {
      operation: 'OAuth Callback',
      sessionId: req.sessionID,
      additionalData: {
        error: err.message,
        hasSession: !!req.session,
        hasCode: !!req.query.code,
        hasState: !!req.query.state,
      },
    });

    // Check if we can recover
    const canRecover = attemptOAuthRecovery(req, res);

    if (canRecover) {
      return; // Recovery handled, response sent
    }

    // Can't recover, show user-friendly error page
    return res.redirect('/login-error?reason=state_mismatch&recoverable=true');
  }

  // Not an OAuth state error, pass to next error handler
  next(err);
}

/**
 * Attempt to recover from OAuth state mismatch
 *
 * Common recovery strategies:
 * 1. Clear session and retry (if looks like stale session)
 * 2. Direct to manual re-login (if session is corrupted)
 * 3. Provide troubleshooting steps (if persistent issue)
 */
function attemptOAuthRecovery(req: Request, res: Response): boolean {
  const oauthSession = req.session as any;
  const lastAttempt = oauthSession?.lastOAuthAttempt;

  // Check if this is a recent retry (within last 2 minutes)
  if (lastAttempt && Date.now() - lastAttempt.timestamp < 120000) {
    // Recent attempt - don't retry again, show error page
    logger.warn('⚠️  Recent OAuth retry detected, showing error page', {
      lastAttemptAge: Date.now() - lastAttempt.timestamp,
      sessionID: req.sessionID,
    });
    return false;
  }

  // Check if session is mostly intact (has some data)
  const sessionHasData = req.session && Object.keys(req.session).length > 2;

  if (!sessionHasData) {
    // Session is empty/corrupt, clear and redirect to clean login
    logger.info('🔄 OAuth recovery: Clearing corrupt session and redirecting to login', {
      sessionID: req.sessionID,
    });

    req.session.destroy((err) => {
      if (err) {
        logger.error('❌ Failed to destroy session during recovery:', {
          error: err.message,
        });
      }

      res.redirect('/login-error?reason=session_corrupt&action=restart');
    });

    return true;
  }

  // Session looks OK, but state mismatch - likely cookie/browser issue
  logger.warn('⚠️  OAuth state mismatch with valid session - possible cookie issue', {
    sessionID: req.sessionID,
    sessionKeys: Object.keys(req.session),
  });

  return false;
}

/**
 * Middleware to clean up expired OAuth attempts from session
 */
export function cleanupExpiredOAuthAttempts(req: Request, res: Response, next: NextFunction) {
  const oauthSession = req.session as any;
  const lastAttempt = oauthSession?.lastOAuthAttempt;

  // Clean up attempts older than 10 minutes
  if (lastAttempt && Date.now() - lastAttempt.timestamp > 600000) {
    delete oauthSession.lastOAuthAttempt;
    logger.debug('🧹 Cleaned up expired OAuth attempt from session');
  }

  next();
}

/**
 * Health check for OAuth state recovery system
 */
export function getOAuthRecoveryHealth() {
  return {
    status: 'operational',
    features: {
      stateRecovery: 'enabled',
      sessionCleanup: 'enabled',
      errorHandling: 'enabled',
    },
  };
}
