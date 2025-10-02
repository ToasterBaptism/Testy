/**
 * Logging service for FortniteAssist
 * Provides structured logging with privacy protection
 */

import {NativeModules} from 'react-native';

// Log levels
export enum LogLevel {
  VERBOSE = 0,
  DEBUG = 1,
  INFO = 2,
  WARN = 3,
  ERROR = 4,
  ASSERT = 5,
}

// Log entry interface
interface LogEntry {
  level: LogLevel;
  tag: string;
  message: string;
  timestamp: number;
  data?: any;
}

class TimberLogger {
  private logLevel: LogLevel = __DEV__ ? LogLevel.DEBUG : LogLevel.INFO;
  private logs: LogEntry[] = [];
  private maxLogs = 1000;

  /**
   * Set minimum log level
   */
  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  /**
   * Verbose logging
   */
  v(tag: string, message: string, data?: any): void {
    this.log(LogLevel.VERBOSE, tag, message, data);
  }

  /**
   * Debug logging
   */
  d(tag: string, message: string, data?: any): void {
    this.log(LogLevel.DEBUG, tag, message, data);
  }

  /**
   * Info logging
   */
  i(tag: string, message: string, data?: any): void {
    this.log(LogLevel.INFO, tag, message, data);
  }

  /**
   * Warning logging
   */
  w(tag: string, message: string, data?: any): void {
    this.log(LogLevel.WARN, tag, message, data);
  }

  /**
   * Error logging
   */
  e(tag: string, message: string, error?: any): void {
    this.log(LogLevel.ERROR, tag, message, error);
  }

  /**
   * Convenience methods with default tag
   */
  verbose(message: string, data?: any): void {
    this.v('FortniteAssist', message, data);
  }

  debug(message: string, data?: any): void {
    this.d('FortniteAssist', message, data);
  }

  info(message: string, data?: any): void {
    this.i('FortniteAssist', message, data);
  }

  warn(message: string, data?: any): void {
    this.w('FortniteAssist', message, data);
  }

  error(message: string, error?: any): void {
    this.e('FortniteAssist', message, error);
  }

  /**
   * Core logging method
   */
  private log(level: LogLevel, tag: string, message: string, data?: any): void {
    if (level < this.logLevel) {
      return;
    }

    const timestamp = Date.now();
    const logEntry: LogEntry = {
      level,
      tag,
      message: this.sanitizeMessage(message),
      timestamp,
      data: this.sanitizeData(data),
    };

    // Add to internal log buffer
    this.addToBuffer(logEntry);

    // Output to console in development
    if (__DEV__) {
      this.outputToConsole(logEntry);
    }

    // Send to native logging if available
    this.sendToNativeLogger(logEntry);
  }

  /**
   * Sanitize log message to remove sensitive information
   */
  private sanitizeMessage(message: string): string {
    // Remove potential sensitive patterns
    return message
      .replace(/password[=:]\s*\S+/gi, 'password=***')
      .replace(/token[=:]\s*\S+/gi, 'token=***')
      .replace(/key[=:]\s*\S+/gi, 'key=***')
      .replace(/secret[=:]\s*\S+/gi, 'secret=***');
  }

  /**
   * Sanitize log data to remove sensitive information
   */
  private sanitizeData(data: any): any {
    if (!data) return data;

    if (typeof data === 'string') {
      return this.sanitizeMessage(data);
    }

    if (typeof data === 'object') {
      const sanitized = {...data};
      
      // Remove sensitive fields
      const sensitiveFields = ['password', 'token', 'key', 'secret', 'auth'];
      sensitiveFields.forEach(field => {
        if (sanitized[field]) {
          sanitized[field] = '***';
        }
      });

      return sanitized;
    }

    return data;
  }

  /**
   * Add log entry to internal buffer
   */
  private addToBuffer(logEntry: LogEntry): void {
    this.logs.push(logEntry);
    
    // Maintain buffer size
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  /**
   * Output log entry to console
   */
  private outputToConsole(logEntry: LogEntry): void {
    const levelName = LogLevel[logEntry.level];
    const timestamp = new Date(logEntry.timestamp).toISOString();
    const prefix = `[${timestamp}] ${levelName}/${logEntry.tag}:`;
    
    switch (logEntry.level) {
      case LogLevel.VERBOSE:
      case LogLevel.DEBUG:
        console.log(prefix, logEntry.message, logEntry.data || '');
        break;
      case LogLevel.INFO:
        console.info(prefix, logEntry.message, logEntry.data || '');
        break;
      case LogLevel.WARN:
        console.warn(prefix, logEntry.message, logEntry.data || '');
        break;
      case LogLevel.ERROR:
        console.error(prefix, logEntry.message, logEntry.data || '');
        break;
      default:
        console.log(prefix, logEntry.message, logEntry.data || '');
    }
  }

  /**
   * Send log entry to native logger
   */
  private sendToNativeLogger(logEntry: LogEntry): void {
    try {
      // Only send error and warning logs to native logger to avoid spam
      if (logEntry.level >= LogLevel.WARN && NativeModules.LoggingModule) {
        NativeModules.LoggingModule.log(
          logEntry.level,
          logEntry.tag,
          logEntry.message,
          JSON.stringify(logEntry.data || {}),
        );
      }
    } catch (error) {
      // Silently fail - don't create logging loops
    }
  }

  /**
   * Get recent logs for debugging
   */
  getRecentLogs(count: number = 100): LogEntry[] {
    return this.logs.slice(-count);
  }

  /**
   * Get logs by level
   */
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  /**
   * Get logs by tag
   */
  getLogsByTag(tag: string): LogEntry[] {
    return this.logs.filter(log => log.tag === tag);
  }

  /**
   * Clear log buffer
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Export logs for debugging (with privacy protection)
   */
  exportLogs(): string {
    const exportData = {
      timestamp: new Date().toISOString(),
      appVersion: '1.0.0', // This would come from app config
      logLevel: LogLevel[this.logLevel],
      totalLogs: this.logs.length,
      logs: this.logs.map(log => ({
        level: LogLevel[log.level],
        tag: log.tag,
        message: log.message,
        timestamp: new Date(log.timestamp).toISOString(),
        data: log.data,
      })),
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Performance logging
   */
  performance(tag: string, operation: string, startTime: number): void {
    const duration = Date.now() - startTime;
    this.d(tag, `${operation} completed in ${duration}ms`);
  }

  /**
   * Network logging (with privacy protection)
   */
  network(tag: string, method: string, url: string, statusCode?: number, duration?: number): void {
    // Sanitize URL to remove sensitive parameters
    const sanitizedUrl = url.replace(/([?&])(token|key|password|secret)=[^&]*/gi, '$1$2=***');
    
    let message = `${method} ${sanitizedUrl}`;
    if (statusCode) {
      message += ` -> ${statusCode}`;
    }
    if (duration) {
      message += ` (${duration}ms)`;
    }
    
    this.d(tag, message);
  }

  /**
   * User action logging (for analytics and debugging)
   */
  userAction(action: string, screen: string, data?: any): void {
    this.i('UserAction', `${action} on ${screen}`, this.sanitizeData(data));
  }

  /**
   * AI inference logging
   */
  aiInference(tag: string, operation: string, duration: number, result?: any): void {
    const sanitizedResult = result ? {
      enemyCount: result.enemies?.length || 0,
      weaponCount: result.weapons?.length || 0,
      confidence: result.confidence,
      hasAimGuidance: !!result.aimGuidance,
    } : undefined;

    this.d(tag, `AI ${operation} completed in ${duration}ms`, sanitizedResult);
  }

  /**
   * Performance metrics logging
   */
  metrics(tag: string, metrics: {[key: string]: number}): void {
    this.i(tag, 'Performance metrics', metrics);
  }
}

// Create singleton instance
const Timber = new TimberLogger();

export default Timber;