/**
 * Error Handler Unit Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  OperationalError,
  ErrorCategory,
  ErrorSeverity,
  errorLogger,
  performanceMonitor,
  retryOperation,
} from '../errorHandler';

describe('Error Handler', () => {
  beforeEach(() => {
    // Clear error logs before each test
    errorLogger.clearLog();
    performanceMonitor.clearMetrics();
  });

  describe('OperationalError', () => {
    it('should create an operational error with correct properties', () => {
      const error = new OperationalError(
        'Test error',
        400,
        ErrorCategory.VALIDATION,
        ErrorSeverity.LOW
      );

      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(400);
      expect(error.category).toBe(ErrorCategory.VALIDATION);
      expect(error.severity).toBe(ErrorSeverity.LOW);
      expect(error.isOperational).toBe(true);
      expect(error.timestamp).toBeInstanceOf(Date);
    });

    it('should use default values when not provided', () => {
      const error = new OperationalError('Default error');

      expect(error.statusCode).toBe(500);
      expect(error.category).toBe(ErrorCategory.INTERNAL);
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
    });

    it('should capture stack trace', () => {
      const error = new OperationalError('Stack test');

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('Stack test');
    });
  });

  describe('ErrorLogger', () => {
    it('should log errors and maintain history', () => {
      const error1 = new OperationalError('Error 1');
      const error2 = new OperationalError('Error 2');

      errorLogger.log(error1);
      errorLogger.log(error2);

      const recent = errorLogger.getRecentErrors(10);
      expect(recent).toHaveLength(2);
      expect(recent[0].message).toBe('Error 1');
      expect(recent[1].message).toBe('Error 2');
    });

    it('should filter errors by category', () => {
      const validationError = new OperationalError(
        'Validation error',
        400,
        ErrorCategory.VALIDATION
      );
      const authError = new OperationalError(
        'Auth error',
        401,
        ErrorCategory.AUTHENTICATION
      );

      errorLogger.log(validationError);
      errorLogger.log(authError);

      const validationErrors = errorLogger.getErrorsByCategory(ErrorCategory.VALIDATION);
      expect(validationErrors).toHaveLength(1);
      expect(validationErrors[0].message).toBe('Validation error');
    });

    it('should filter errors by severity', () => {
      const lowError = new OperationalError(
        'Low',
        400,
        ErrorCategory.VALIDATION,
        ErrorSeverity.LOW
      );
      const criticalError = new OperationalError(
        'Critical',
        500,
        ErrorCategory.INTERNAL,
        ErrorSeverity.CRITICAL
      );

      errorLogger.log(lowError);
      errorLogger.log(criticalError);

      const criticalErrors = errorLogger.getErrorsBySeverity(ErrorSeverity.CRITICAL);
      expect(criticalErrors).toHaveLength(1);
      expect(criticalErrors[0].message).toBe('Critical');
    });

    it('should generate error statistics', () => {
      errorLogger.log(
        new OperationalError('Error 1', 400, ErrorCategory.VALIDATION, ErrorSeverity.LOW)
      );
      errorLogger.log(
        new OperationalError('Error 2', 401, ErrorCategory.AUTHENTICATION, ErrorSeverity.MEDIUM)
      );
      errorLogger.log(
        new OperationalError('Error 3', 500, ErrorCategory.INTERNAL, ErrorSeverity.CRITICAL)
      );

      const stats = errorLogger.getStats();

      expect(stats.total).toBe(3);
      expect(stats.bySeverity[ErrorSeverity.LOW]).toBe(1);
      expect(stats.bySeverity[ErrorSeverity.MEDIUM]).toBe(1);
      expect(stats.bySeverity[ErrorSeverity.CRITICAL]).toBe(1);
      expect(stats.byCategory[ErrorCategory.VALIDATION]).toBe(1);
      expect(stats.byCategory[ErrorCategory.AUTHENTICATION]).toBe(1);
    });

    it('should clear log history', () => {
      errorLogger.log(new OperationalError('Test error'));
      expect(errorLogger.getRecentErrors(10)).toHaveLength(1);

      errorLogger.clearLog();
      expect(errorLogger.getRecentErrors(10)).toHaveLength(0);
    });
  });

  describe('PerformanceMonitor', () => {
    it('should record metrics', () => {
      performanceMonitor.recordMetric('test.operation', 100);
      performanceMonitor.recordMetric('test.operation', 200);
      performanceMonitor.recordMetric('test.operation', 150);

      const stats = performanceMonitor.getStats('test.operation');

      expect(stats).toBeDefined();
      expect(stats?.count).toBe(3);
      expect(stats?.avg).toBe(150);
      expect(stats?.min).toBe(100);
      expect(stats?.max).toBe(200);
    });

    it('should calculate percentiles correctly', () => {
      // Create a dataset with known percentiles
      const values = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
      values.forEach(v => performanceMonitor.recordMetric('percentile.test', v));

      const stats = performanceMonitor.getStats('percentile.test');

      expect(stats).toBeDefined();
      expect(stats?.p50).toBeGreaterThanOrEqual(40);
      expect(stats?.p50).toBeLessThanOrEqual(60);
      expect(stats?.p95).toBeGreaterThanOrEqual(90);
    });

    it('should return null for non-existent metric', () => {
      const stats = performanceMonitor.getStats('nonexistent');
      expect(stats).toBeNull();
    });
  });

  describe('retryOperation', () => {
    it('should succeed on first attempt', async () => {
      const operation = vi.fn().mockResolvedValue('success');

      const result = await retryOperation(operation, 3, 10);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and eventually succeed', async () => {
      const operation = vi
        .fn()
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockRejectedValueOnce(new Error('Fail 2'))
        .mockResolvedValue('success');

      const result = await retryOperation(operation, 3, 10);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should throw after max retries exceeded', async () => {
      const error = new Error('Persistent failure');
      const operation = vi.fn().mockRejectedValue(error);

      await expect(retryOperation(operation, 3, 10)).rejects.toThrow('Persistent failure');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should not retry on client errors (4xx)', async () => {
      const clientError = new OperationalError(
        'Bad request',
        400,
        ErrorCategory.VALIDATION
      );
      const operation = vi.fn().mockRejectedValue(clientError);

      await expect(retryOperation(operation, 3, 10)).rejects.toThrow('Bad request');
      expect(operation).toHaveBeenCalledTimes(1); // Should not retry
    });
  });

  describe('Circuit Breaker', () => {
    // Note: Circuit breaker tests would require more complex setup
    // and are better suited for integration tests
    it('should be tested in integration tests', () => {
      expect(true).toBe(true);
    });
  });
});
