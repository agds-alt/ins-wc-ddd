// src/lib/logger.ts - Comprehensive logging system
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
  sessionId: string;
  userId?: string;
  url: string;
  userAgent: string;
}

class Logger {
  private sessionId: string;
  private userId?: string;
  private logs: LogEntry[] = [];
  private maxLogs = 100; // Keep last 100 logs in memory
  private isDev = import.meta.env.DEV;

  constructor() {
    this.sessionId = this.getOrCreateSessionId();
    this.initSession();
  }

  private getOrCreateSessionId(): string {
    let sessionId = sessionStorage.getItem('app_session_id');
    if (!sessionId) {
      sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('app_session_id', sessionId);
    }
    return sessionId;
  }

  private initSession() {
    this.info('Session started', {
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      screen: `${window.screen.width}x${window.screen.height}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      platform: navigator.platform,
      language: navigator.language,
    });
  }

  setUserId(userId: string) {
    this.userId = userId;
    this.info('User authenticated', { userId });
  }

  private createLogEntry(level: LogLevel, message: string, data?: any): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      sessionId: this.sessionId,
      userId: this.userId,
      url: window.location.href,
      userAgent: navigator.userAgent,
    };
  }

  private addLog(entry: LogEntry) {
    this.logs.push(entry);
    
    // Keep only last N logs
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Store in localStorage for persistence
    try {
      localStorage.setItem('app_logs', JSON.stringify(this.logs.slice(-20)));
    } catch (e) {
      // Ignore quota errors
    }
  }

  debug(message: string, data?: any) {
    if (!this.isDev) return; // Only in dev
    
    const entry = this.createLogEntry('debug', message, data);
    this.addLog(entry);
    console.log(`🔍 [DEBUG] ${message}`, data || '');
  }

  info(message: string, data?: any) {
    const entry = this.createLogEntry('info', message, data);
    this.addLog(entry);
    console.log(`ℹ️ [INFO] ${message}`, data || '');
  }

  warn(message: string, data?: any) {
    const entry = this.createLogEntry('warn', message, data);
    this.addLog(entry);
    console.warn(`⚠️ [WARN] ${message}`, data || '');
  }

  error(message: string, error?: any) {
    const entry = this.createLogEntry('error', message, {
      error: error?.message || error,
      stack: error?.stack,
      name: error?.name,
    });
    this.addLog(entry);
    console.error(`❌ [ERROR] ${message}`, error || '');
    
    // Send critical errors to server (optional)
    this.sendErrorToServer(entry);
  }

  // Performance tracking
  startTimer(label: string): () => void {
    const startTime = performance.now();
    this.debug(`⏱️ Timer started: ${label}`);
    
    return () => {
      const duration = performance.now() - startTime;
      this.info(`⏱️ Timer ended: ${label}`, { 
        duration: `${duration.toFixed(2)}ms`,
        slow: duration > 1000 
      });
      
      if (duration > 1000) {
        this.warn(`Slow operation detected: ${label}`, { duration });
      }
    };
  }

  // API call tracking
  logApiCall(method: string, url: string, status?: number, duration?: number) {
    const level = status && status >= 400 ? 'error' : 'info';
    const message = `API ${method} ${url}`;
    
    this[level](message, {
      method,
      url,
      status,
      duration: duration ? `${duration}ms` : undefined,
    });
  }

  // Get all logs
  getLogs(level?: LogLevel): LogEntry[] {
    if (level) {
      return this.logs.filter(log => log.level === level);
    }
    return this.logs;
  }

  // Export logs as JSON
  exportLogs(): string {
    return JSON.stringify({
      sessionId: this.sessionId,
      userId: this.userId,
      exportedAt: new Date().toISOString(),
      logs: this.logs,
    }, null, 2);
  }

  // Clear logs
  clearLogs() {
    this.logs = [];
    localStorage.removeItem('app_logs');
    this.info('Logs cleared');
  }

  // Send error to server (implement based on your backend)
  private async sendErrorToServer(entry: LogEntry) {
    if (!import.meta.env.PROD) return; // Only in production
    
    try {
      // TODO: Replace with your error tracking endpoint
      // await fetch('/api/logs/error', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(entry),
      // });
    } catch (e) {
      console.error('Failed to send error to server:', e);
    }
  }
}

// Singleton instance
export const logger = new Logger();

// Intercept console errors
window.addEventListener('error', (event) => {
  logger.error('Uncaught error', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error,
  });
});

// Intercept unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  logger.error('Unhandled promise rejection', {
    reason: event.reason,
  });
});

// Log page navigation
window.addEventListener('popstate', () => {
  logger.info('Navigation', { 
    url: window.location.href,
    type: 'popstate' 
  });
});