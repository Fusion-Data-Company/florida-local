import { logger } from "./monitoring";

export interface AppConfig {
  nodeEnv: string;
  isProduction: boolean;
  isDevelopment: boolean;
  port: number;
  databaseUrl: string;
  sessionSecret: string;
  replitDomains: string[];
  replId: string;
  issuerUrl: string;
  redisHost?: string;
  redisPort?: number;
  redisPassword?: string;
}

export function validateAndLoadConfig(): AppConfig {
  logger.info('🔧 Loading and validating configuration...');
  
  const errors: string[] = [];
  
  const nodeEnv = process.env.NODE_ENV || 'development';
  const isProduction = nodeEnv === 'production' || process.env.REPLIT_DEPLOYMENT === '1';
  const isDevelopment = !isProduction;
  
  logger.info(`📍 Environment: ${nodeEnv} (isProduction: ${isProduction})`);
  
  if (!process.env.DATABASE_URL) {
    errors.push('DATABASE_URL environment variable is required');
  }
  
  if (!process.env.SESSION_SECRET) {
    errors.push('SESSION_SECRET environment variable is required');
  }
  
  if (!process.env.REPL_ID) {
    errors.push('REPL_ID environment variable is required');
  }
  
  if (isProduction && !process.env.REPLIT_DOMAINS) {
    errors.push('REPLIT_DOMAINS environment variable is required in production');
  }
  
  if (errors.length > 0) {
    logger.error('❌ Configuration validation failed:');
    errors.forEach(error => logger.error(`   - ${error}`));
    throw new Error(`Configuration validation failed: ${errors.join(', ')}`);
  }
  
  // Build domain list
  let replitDomains: string[];
  if (process.env.REPLIT_DOMAINS) {
    replitDomains = process.env.REPLIT_DOMAINS.split(',').map(d => d.trim());
  } else {
    replitDomains = [];
  }

  // ALWAYS include the dev domain if it exists (for Replit workspaces)
  if (process.env.REPLIT_DEV_DOMAIN) {
    const devDomain = process.env.REPLIT_DEV_DOMAIN.trim();
    if (!replitDomains.includes(devDomain)) {
      replitDomains.push(devDomain);
    }
  }

  // In development, ALWAYS include localhost and 127.0.0.1 for local testing
  if (isDevelopment) {
    if (!replitDomains.includes('localhost')) {
      replitDomains.push('localhost');
    }
    if (!replitDomains.includes('127.0.0.1')) {
      replitDomains.push('127.0.0.1');
    }
  }

  // Ensure we have at least one domain
  if (replitDomains.length === 0) {
    replitDomains = ['localhost'];
  }

  const config: AppConfig = {
    nodeEnv,
    isProduction,
    isDevelopment,
    port: parseInt(process.env.PORT || '5000', 10),
    databaseUrl: process.env.DATABASE_URL!,
    sessionSecret: process.env.SESSION_SECRET!,
    replitDomains,
    replId: process.env.REPL_ID!,
    issuerUrl: process.env.ISSUER_URL || 'https://replit.com/oidc',
    redisHost: process.env.REDIS_HOST,
    redisPort: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : undefined,
    redisPassword: process.env.REDIS_PASSWORD,
  };

  logger.info('✅ Configuration validated successfully');
  logger.info(`   - Port: ${config.port}`);
  logger.info(`   - Database: ${config.databaseUrl ? '✓ Configured' : '✗ Missing'}`);
  logger.info(`   - Session Secret: ${config.sessionSecret ? '✓ Configured' : '✗ Missing'}`);
  logger.info(`   - Replit Domains: ${config.replitDomains.join(', ')}`);
  logger.info(`   - REPL_ID (OAuth Client ID): ${config.replId}`);
  logger.info(`   - REPL_ID length: ${config.replId.length} chars`);
  logger.info(`   - Issuer URL: ${config.issuerUrl}`);
  logger.info(`   - Redis: ${config.redisHost ? `✓ ${config.redisHost}:${config.redisPort}` : '✗ Not configured'}`);

  return config;
}

export let config: AppConfig;

export function initConfig(): AppConfig {
  config = validateAndLoadConfig();
  return config;
}
