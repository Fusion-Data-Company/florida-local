// Temporary debug logging to capture auth issues
const authLogs: string[] = [];
const maxLogs = 100;

export function captureLog(message: string) {
  const timestamp = new Date().toISOString();
  authLogs.unshift(`[${timestamp}] ${message}`);
  if (authLogs.length > maxLogs) {
    authLogs.pop();
  }
  console.log(message); // Still log to console
}

export function getAuthLogs(): string[] {
  return [...authLogs];
}

export function clearAuthLogs() {
  authLogs.length = 0;
}
