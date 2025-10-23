import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import { logger } from "./monitoring";

neonConfig.webSocketConstructor = ws;
neonConfig.fetchConnectionCache = true;
neonConfig.pipelineTLS = false;
neonConfig.pipelineConnect = false;

interface DatabaseConnectionState {
  isConnected: boolean;
  lastError: Error | null;
  lastErrorTime: Date | null;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
  reconnectDelay: number;
}

const dbConnectionState: DatabaseConnectionState = {
  isConnected: false,
  lastError: null,
  lastErrorTime: null,
  reconnectAttempts: 0,
  maxReconnectAttempts: 3,
  reconnectDelay: 1000,
};

let pool: Pool | null = null;
let dbInstance: ReturnType<typeof drizzle> | null = null;

export function getPool(): Pool | null {
  return pool;
}

export async function initializeDatabasePool(databaseUrl: string): Promise<Pool> {
  if (pool) {
    logger.info('📦 Database pool already initialized');
    return pool;
  }
  
  logger.info('🔧 Initializing database pool...');
  logger.info(`   - Connection string: ${databaseUrl.substring(0, 20)}...`);
  
  pool = new Pool({ 
    connectionString: databaseUrl,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    maxUses: 7500,
    allowExitOnIdle: true,
    statement_timeout: 30000,
    query_timeout: 30000,
    idle_in_transaction_session_timeout: 60000,
  });
  
  pool.on('error', (err) => {
    logger.error('❌ Database pool error:', { message: err.message, stack: err.stack });
    dbConnectionState.isConnected = false;
    dbConnectionState.lastError = err;
    dbConnectionState.lastErrorTime = new Date();
  });
  
  logger.info('✅ Database pool created');
  return pool;
}

export async function connectDatabaseWithRetry(databaseUrl: string, maxAttempts: number = 3): Promise<void> {
  logger.info(`🔌 Connecting to database (max attempts: ${maxAttempts})...`);
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      logger.info(`   - Attempt ${attempt}/${maxAttempts}...`);
      
      if (!pool) {
        await initializeDatabasePool(databaseUrl);
      }
      
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Database connection timeout (10s)')), 10000);
      });
      
      const connectionPromise = async () => {
        const client = await pool!.connect();
        await client.query('SELECT 1 as health_check');
        client.release();
        logger.info('   - Connection test successful');
      };
      
      await Promise.race([connectionPromise(), timeoutPromise]);
      
      dbConnectionState.isConnected = true;
      dbConnectionState.lastError = null;
      dbConnectionState.reconnectAttempts = 0;
      
      logger.info(`✅ Database connected successfully on attempt ${attempt}`);
      return;
      
    } catch (error) {
      const err = error as Error;
      dbConnectionState.lastError = err;
      dbConnectionState.lastErrorTime = new Date();
      dbConnectionState.reconnectAttempts = attempt;
      
      logger.error(`❌ Database connection attempt ${attempt} failed:`, {
        message: err.message,
        attempt,
        maxAttempts,
      });
      
      if (attempt < maxAttempts) {
        const delay = Math.pow(2, attempt - 1) * 1000;
        logger.info(`   - Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        logger.error('❌ All database connection attempts failed');
        throw new Error(`Failed to connect to database after ${maxAttempts} attempts: ${err.message}`);
      }
    }
  }
}

export async function testDatabaseConnection(): Promise<boolean> {
  if (!pool) {
    logger.warn('⚠️  Database pool not initialized');
    return false;
  }
  
  try {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Health check timeout')), 5000);
    });
    
    const checkPromise = async () => {
      const client = await pool!.connect();
      await client.query('SELECT 1 as health_check');
      client.release();
    };
    
    await Promise.race([checkPromise(), timeoutPromise]);
    
    if (!dbConnectionState.isConnected) {
      logger.info('✅ Database connection restored');
      dbConnectionState.isConnected = true;
      dbConnectionState.lastError = null;
      dbConnectionState.reconnectAttempts = 0;
    }
    
    return true;
  } catch (error) {
    const err = error as Error;
    logger.error('❌ Database health check failed:', { message: err.message });
    dbConnectionState.isConnected = false;
    dbConnectionState.lastError = err;
    dbConnectionState.lastErrorTime = new Date();
    return false;
  }
}

export function getDatabaseStatus() {
  return {
    isConnected: dbConnectionState.isConnected,
    lastError: dbConnectionState.lastError?.message || null,
    lastErrorTime: dbConnectionState.lastErrorTime,
    reconnectAttempts: dbConnectionState.reconnectAttempts,
    poolIdleCount: pool?.idleCount || 0,
    poolTotalCount: pool?.totalCount || 0,
    poolWaitingCount: pool?.waitingCount || 0,
  };
}

export function getDatabase() {
  if (!dbInstance && pool) {
    logger.info('🔧 Creating Drizzle database instance...');
    dbInstance = drizzle({ client: pool, schema });
    logger.info('✅ Drizzle database instance created');
  }
  
  if (!dbInstance) {
    throw new Error('Database not initialized. Call initializeDatabasePool first.');
  }
  
  return dbInstance;
}

export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(target, prop) {
    const database = getDatabase();
    return database[prop as keyof typeof database];
  }
});

export async function closeDatabaseConnection() {
  try {
    if (pool) {
      logger.info('🔌 Closing database pool...');
      await pool.end();
      pool = null;
      dbInstance = null;
      logger.info('✅ Database pool closed successfully');
    }
  } catch (error) {
    logger.error('❌ Error closing database pool:', error);
  }
}
