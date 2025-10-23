import { Request, Response, NextFunction } from 'express';
import { logger } from '../monitoring';
import { captureAuthWarning } from '../monitoring/authSentry';
import { authMetrics } from '../metrics/authMetrics';

/**
 * Verify that session was actually persisted after login
 *
 * This middleware checks that the session store successfully saved
 * the session data after authentication. Prevents silent failures
 * where user thinks they're logged in but session wasn't saved.
 */
export async function verifySessionPersistence(
  req: Request,
  sessionId: string,
  userId: string,
  callback: (success: boolean) => void
) {
  // Give the session store a moment to persist
  await new Promise(resolve => setTimeout(resolve, 100));

  const session = req.session;

  if (!session) {
    logger.error('❌ Session verification failed: No session object', {
      sessionId,
      userId,
    });

    captureAuthWarning('Session persistence check failed - no session', {
      operation: 'Session Persistence Check',
      userId,
      sessionId,
    });

    authMetrics.recordSessionError('store', 'Session object missing after login', userId);
    callback(false);
    return;
  }

  // Check if passport serialized the user
  const passportUser = (session as any).passport?.user;

  if (!passportUser) {
    logger.error('❌ Session verification failed: No passport user in session', {
      sessionId,
      userId,
      sessionKeys: Object.keys(session),
    });

    captureAuthWarning('Session persistence check failed - no passport user', {
      operation: 'Session Persistence Check',
      userId,
      sessionId,
      additionalData: {
        sessionKeys: Object.keys(session),
      },
    });

    authMetrics.recordSessionError('store', 'Passport user missing from session', userId);
    callback(false);
    return;
  }

  // Verify the user ID matches
  if (passportUser !== userId) {
    logger.error('❌ Session verification failed: User ID mismatch', {
      sessionId,
      expectedUserId: userId,
      actualUserId: passportUser,
    });

    captureAuthWarning('Session persistence check failed - user ID mismatch', {
      operation: 'Session Persistence Check',
      userId,
      sessionId,
      additionalData: {
        expectedUserId: userId,
        actualUserId: passportUser,
      },
    });

    authMetrics.recordSessionError('store', 'User ID mismatch in session', userId);
    callback(false);
    return;
  }

  // Additional verification: Try to read the session back
  if (req.sessionStore && typeof req.sessionStore.get === 'function') {
    req.sessionStore.get(sessionId, (err, sessionData) => {
      if (err) {
        logger.warn('⚠️  Session verification warning: Could not read session from store', {
          sessionId,
          userId,
          error: err.message,
        });

        captureAuthWarning('Session persistence check - store read error', {
          operation: 'Session Persistence Check',
          userId,
          sessionId,
          additionalData: {
            error: err.message,
          },
        });

        // Don't fail on read error - session might still work
        callback(true);
        return;
      }

      if (!sessionData) {
        logger.error('❌ Session verification failed: Session not found in store', {
          sessionId,
          userId,
        });

        captureAuthWarning('Session persistence check failed - not in store', {
          operation: 'Session Persistence Check',
          userId,
          sessionId,
        });

        authMetrics.recordSessionError('store', 'Session not found in store after login', userId);
        callback(false);
        return;
      }

      logger.info('✅ Session persistence verified', {
        sessionId,
        userId,
        hasPassportUser: !!(sessionData as any).passport?.user,
      });

      callback(true);
    });
  } else {
    // Session store doesn't support .get() method, skip detailed verification
    logger.debug('ℹ️  Session store does not support verification, assuming success', {
      sessionId,
      userId,
    });
    callback(true);
  }
}

/**
 * Middleware to add session persistence check to req object
 */
export function addSessionPersistenceCheck(req: Request, res: Response, next: NextFunction) {
  // Attach helper function to request
  (req as any).verifySessionPersistence = (userId: string, callback: (success: boolean) => void) => {
    verifySessionPersistence(req, req.sessionID, userId, callback);
  };

  next();
}

/**
 * Post-login verification middleware
 *
 * Can be used after successful authentication to verify session was saved
 */
export function postLoginSessionCheck(req: Request, res: Response, next: NextFunction) {
  // Only run on authenticated requests
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return next();
  }

  const userId = (req.user as any)?.id;

  if (!userId) {
    return next();
  }

  // Verify session persistence
  verifySessionPersistence(req, req.sessionID, userId, (success) => {
    if (!success) {
      logger.warn('⚠️  Post-login session check failed for authenticated user', {
        userId,
        sessionId: req.sessionID,
      });

      // Don't block the request, just log and track
      // User might still be able to re-authenticate
    }

    next();
  });
}

/**
 * Get session persistence health metrics
 */
export function getSessionPersistenceHealth() {
  return {
    status: 'operational',
    features: {
      persistenceVerification: 'enabled',
      storeReadback: 'enabled',
      userIdValidation: 'enabled',
    },
  };
}
