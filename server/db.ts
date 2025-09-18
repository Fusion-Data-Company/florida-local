import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Enable response caching and edge runtime for better performance
neonConfig.fetchConnectionCache = true;
neonConfig.useNeonFetch = true;
neonConfig.pipelineTLS = false;
neonConfig.pipelineConnect = false;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Track database connection state
let dbConnectionState = {
  isConnected: false,
  lastError: null as Error | null,
  lastErrorTime: null as Date | null,
  reconnectAttempts: 0,
  maxReconnectAttempts: 10,
  reconnectDelay: 1000, // Start with 1 second
};

// Enhanced pool configuration with proper settings
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum number of connections in the pool
  idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
  connectionTimeoutMillis: 10000, // Timeout for acquiring connection
  maxUses: 7500, // Maximum number of times a connection is reused before closing
  allowExitOnIdle: true, // Allow process to exit when all connections are idle
  statement_timeout: 30000, // SQL statement timeout (30 seconds)
  query_timeout: 30000, // Query timeout (30 seconds)
  idle_in_transaction_session_timeout: 60000, // 60 seconds for idle in transaction
});

// Add connection event handlers with logging
pool.on('connect', (client) => {
  console.log('✅ Database client connected');
  dbConnectionState.isConnected = true;
  dbConnectionState.lastError = null;
  dbConnectionState.reconnectAttempts = 0;
  
  // Set connection-level timeouts and error handling
  client.on('error', (err) => {
    console.error('❌ Database client error:', err.message);
    dbConnectionState.isConnected = false;
    dbConnectionState.lastError = err;
    dbConnectionState.lastErrorTime = new Date();
  });
  
  // Handle connection termination gracefully
  client.on('end', () => {
    console.log('🔌 Database client disconnected');
    dbConnectionState.isConnected = false;
  });
});

pool.on('error', (err) => {
  console.error('❌ Database pool error:', err.message);
  dbConnectionState.isConnected = false;
  dbConnectionState.lastError = err;
  dbConnectionState.lastErrorTime = new Date();
  
  // Implement exponential backoff for reconnection
  if (dbConnectionState.reconnectAttempts < dbConnectionState.maxReconnectAttempts) {
    const delay = Math.min(dbConnectionState.reconnectDelay * Math.pow(2, dbConnectionState.reconnectAttempts), 30000);
    dbConnectionState.reconnectAttempts++;
    
    console.log(`🔄 Attempting database reconnection in ${delay}ms (attempt ${dbConnectionState.reconnectAttempts}/${dbConnectionState.maxReconnectAttempts})`);
    
    setTimeout(() => {
      testDatabaseConnection().catch(console.error);
    }, delay);
  } else {
    console.error('❌ Maximum database reconnection attempts reached');
  }
});

// Database health check function
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1 as health_check');
    client.release();
    
    if (!dbConnectionState.isConnected) {
      console.log('✅ Database connection restored');
      dbConnectionState.isConnected = true;
      dbConnectionState.lastError = null;
      dbConnectionState.reconnectAttempts = 0;
    }
    
    return true;
  } catch (error) {
    const err = error as Error;
    console.error('❌ Database health check failed:', err.message);
    dbConnectionState.isConnected = false;
    dbConnectionState.lastError = err;
    dbConnectionState.lastErrorTime = new Date();
    return false;
  }
}

// Get database connection status
export function getDatabaseStatus() {
  return {
    isConnected: dbConnectionState.isConnected,
    lastError: dbConnectionState.lastError?.message || null,
    lastErrorTime: dbConnectionState.lastErrorTime,
    reconnectAttempts: dbConnectionState.reconnectAttempts,
    poolIdleCount: pool.idleCount,
    poolTotalCount: pool.totalCount,
    poolWaitingCount: pool.waitingCount,
  };
}

// Enhanced database instance with error handling
export const db = drizzle({ client: pool, schema });

// Graceful shutdown function
export async function closeDatabaseConnection() {
  try {
    console.log('🔌 Closing database pool...');
    await pool.end();
    console.log('✅ Database pool closed successfully');
  } catch (error) {
    console.error('❌ Error closing database pool:', error);
  }
}

// Initial health check
testDatabaseConnection().catch((error) => {
  console.error('❌ Initial database connection failed:', error.message);
});

// Periodic health check every 30 seconds
setInterval(() => {
  if (!dbConnectionState.isConnected) {
    testDatabaseConnection().catch(console.error);
  }
}, 30000);