/**
 * Application startup validation and initialization
 */

import { validateEnvironmentOnStartup, envValidator } from './environment';
import { logger } from './logging';
import { RateLimiter, SecurityValidator } from './security';
import { IntrusionDetector } from './logging';

class ApplicationStartup {
  static async initialize(): Promise<void> {
    try {
      logger.info('🚀 Starting Querra application...');

      // 1. Validate environment variables
      logger.info('🔧 Validating environment configuration...');
      validateEnvironmentOnStartup();

      // 2. Log configuration (redacted)
      const config = envValidator.getRedactedConfig();
      logger.info('Configuration loaded', undefined, config);

      // 3. Initialize security systems
      logger.info('🛡️ Initializing security systems...');
      this.initializeSecurity();

      // 4. Validate external services
      logger.info('🌐 Validating external service connections...');
      await this.validateServices();

      logger.info('✅ Application startup completed successfully');

    } catch (error) {
      logger.error('❌ Application startup failed', error as Error);
      
      if (envValidator.isProduction()) {
        process.exit(1);
      } else {
        console.warn('⚠️  Continuing in development mode despite startup errors');
      }
    }
  }

  private static initializeSecurity(): void {
    // Start periodic cleanup of rate limiter and intrusion detector
    setInterval(() => {
      RateLimiter.cleanup();
      IntrusionDetector.cleanup();
      logger.cleanup();
    }, 15 * 60 * 1000); // Every 15 minutes

    logger.info('Security systems initialized');
  }

  private static async validateServices(): Promise<void> {
    const validationResults = [];

    // Test Google Search API
    try {
      // We'll just validate the API key format for now
      const googleKey = envValidator.getAPIKey('GOOGLE');
      if (googleKey.startsWith('AIza')) {
        validationResults.push('✅ Google Search API key format valid');
      } else {
        validationResults.push('⚠️  Google Search API key format questionable');
      }
    } catch (error) {
      validationResults.push('❌ Google Search API not configured');
    }

    // Test Gemini API
    try {
      const geminiKey = envValidator.getAPIKey('GEMINI');
      if (geminiKey.startsWith('AIza')) {
        validationResults.push('✅ Gemini API key format valid');
      } else {
        validationResults.push('⚠️  Gemini API key format questionable');
      }
    } catch (error) {
      validationResults.push('❌ Gemini API not configured');
    }

    // Test Groq API (optional)
    try {
      const groqKey = envValidator.getAPIKey('GROQ');
      if (groqKey.startsWith('gsk_')) {
        validationResults.push('✅ Groq API key format valid');
      } else {
        validationResults.push('⚠️  Groq API key format questionable');
      }
    } catch (error) {
      validationResults.push('ℹ️  Groq API not configured (optional)');
    }

    validationResults.forEach(result => logger.info(result));
  }

  static async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    checks: Record<string, { status: 'pass' | 'fail'; message: string }>;
  }> {
    const checks: Record<string, { status: 'pass' | 'fail'; message: string }> = {};

    // Environment check
    if (envValidator.isValid()) {
      checks.environment = { status: 'pass', message: 'Environment variables valid' };
    } else {
      checks.environment = { status: 'fail', message: 'Environment validation failed' };
    }

    // API key checks
    try {
      envValidator.getAPIKey('GEMINI');
      checks.gemini = { status: 'pass', message: 'Gemini API key available' };
    } catch {
      checks.gemini = { status: 'fail', message: 'Gemini API key missing' };
    }

    try {
      envValidator.getAPIKey('GOOGLE');
      checks.google = { status: 'pass', message: 'Google API key available' };
    } catch {
      checks.google = { status: 'fail', message: 'Google API key missing' };
    }

    // Determine overall status
    const failedChecks = Object.values(checks).filter(check => check.status === 'fail').length;
    let status: 'healthy' | 'degraded' | 'unhealthy';

    if (failedChecks === 0) {
      status = 'healthy';
    } else if (failedChecks <= 1) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    return { status, checks };
  }
}

export default ApplicationStartup;
