/**
 * Environment Variable Validation and Security Configuration
 */

interface EnvironmentConfig {
  GEMINI_API_KEY: string;
  GROQ_API_KEY: string;
  GOOGLE_API_KEY: string;
  GOOGLE_CX: string;
  NODE_ENV: 'development' | 'production' | 'test';
  VERCEL_ENV?: string;
}

class EnvironmentValidator {
  private static instance: EnvironmentValidator;
  private config: Partial<EnvironmentConfig> = {};
  private validationErrors: string[] = [];

  private constructor() {
    this.validateEnvironment();
  }

  static getInstance(): EnvironmentValidator {
    if (!EnvironmentValidator.instance) {
      EnvironmentValidator.instance = new EnvironmentValidator();
    }
    return EnvironmentValidator.instance;
  }

  private validateEnvironment(): void {
    this.validationErrors = [];

    // Required API keys
    const requiredKeys = [
      'GEMINI_API_KEY',
      'GOOGLE_API_KEY', 
      'GOOGLE_CX'
    ];

    const optionalKeys = [
      'GROQ_API_KEY'
    ];

    // Validate required keys
    for (const key of requiredKeys) {
      const value = process.env[key];
      if (!value || value.trim() === '') {
        this.validationErrors.push(`Missing required environment variable: ${key}`);
      } else {
        (this.config as any)[key] = value;
      }
    }

    // Validate optional keys
    for (const key of optionalKeys) {
      const value = process.env[key];
      if (value && value.trim() !== '') {
        (this.config as any)[key] = value;
      }
    }

    // Validate NODE_ENV
    const nodeEnv = process.env.NODE_ENV;
    if (!nodeEnv || !['development', 'production', 'test'].includes(nodeEnv)) {
      this.validationErrors.push('NODE_ENV must be set to development, production, or test');
    } else {
      this.config.NODE_ENV = nodeEnv as 'development' | 'production' | 'test';
    }

    // Validate API key formats
    this.validateAPIKeyFormats();

    // Log validation results
    if (this.validationErrors.length > 0) {
      console.error('Environment validation failed:');
      this.validationErrors.forEach(error => console.error(`  - ${error}`));
      
      if (this.config.NODE_ENV === 'production') {
        throw new Error('Environment validation failed in production. Check your environment variables.');
      }
    } else {
      console.log('Environment validation passed');
    }
  }

  private validateAPIKeyFormats(): void {
    // Validate Gemini API key format (should start with 'AIza')
    if (this.config.GEMINI_API_KEY && !this.config.GEMINI_API_KEY.startsWith('AIza')) {
      this.validationErrors.push('GEMINI_API_KEY appears to have invalid format');
    }

    // Validate Groq API key format (should start with 'gsk_')
    if (this.config.GROQ_API_KEY && !this.config.GROQ_API_KEY.startsWith('gsk_')) {
      this.validationErrors.push('GROQ_API_KEY appears to have invalid format');
    }

    // Validate Google API key format
    if (this.config.GOOGLE_API_KEY && !this.config.GOOGLE_API_KEY.startsWith('AIza')) {
      this.validationErrors.push('GOOGLE_API_KEY appears to have invalid format');
    }

    // Validate Google Custom Search CX format
    if (this.config.GOOGLE_CX && !/^[a-f0-9]{9}:[a-f0-9]{10}$/.test(this.config.GOOGLE_CX)) {
      // This is a common format, but there might be variations
      console.warn('GOOGLE_CX format might be invalid. Expected format: [9 hex chars]:[10 hex chars]');
    }
  }

  getConfig(): Partial<EnvironmentConfig> {
    return { ...this.config };
  }

  getValidationErrors(): string[] {
    return [...this.validationErrors];
  }

  isValid(): boolean {
    return this.validationErrors.length === 0;
  }

  isProduction(): boolean {
    return this.config.NODE_ENV === 'production';
  }

  isDevelopment(): boolean {
    return this.config.NODE_ENV === 'development';
  }

  isServerless(): boolean {
    return !!this.config.VERCEL_ENV || !!process.env.AWS_LAMBDA_FUNCTION_NAME;
  }

  // Secure way to get API keys
  getAPIKey(service: 'GEMINI' | 'GROQ' | 'GOOGLE'): string {
    const keyMap = {
      GEMINI: 'GEMINI_API_KEY',
      GROQ: 'GROQ_API_KEY',
      GOOGLE: 'GOOGLE_API_KEY'
    };

    const key = keyMap[service] as keyof EnvironmentConfig;
    const value = this.config[key];

    if (!value) {
      throw new Error(`API key for ${service} is not configured`);
    }

    return value;
  }

  // Get redacted config for logging
  getRedactedConfig(): Record<string, string> {
    const redacted: Record<string, string> = {};
    
    Object.entries(this.config).forEach(([key, value]) => {
      if (key.includes('KEY') || key.includes('SECRET')) {
        redacted[key] = value ? `${value.substring(0, 8)}...` : 'Not set';
      } else {
        redacted[key] = value || 'Not set';
      }
    });

    return redacted;
  }
}

// Global environment validator instance
export const envValidator = EnvironmentValidator.getInstance();

// Utility functions
export function requireAPIKey(service: 'GEMINI' | 'GROQ' | 'GOOGLE'): string {
  return envValidator.getAPIKey(service);
}

export function isProduction(): boolean {
  return envValidator.isProduction();
}

export function isDevelopment(): boolean {
  return envValidator.isDevelopment();
}

export function isServerless(): boolean {
  return envValidator.isServerless();
}

export function validateEnvironmentOnStartup(): void {
  if (!envValidator.isValid()) {
    const errors = envValidator.getValidationErrors();
    console.error('❌ Environment validation failed:');
    errors.forEach(error => console.error(`  - ${error}`));
    
    if (envValidator.isProduction()) {
      process.exit(1);
    }
  }
}

export default EnvironmentValidator;
