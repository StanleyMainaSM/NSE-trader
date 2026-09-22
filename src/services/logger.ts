/**
 * Structured Logging Service
 * Provides timestamped, categorized, audit-friendly logging for trading calculations,
 * data provenance checks, and error tracking.
 */

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  context: string;
  message: string;
  metadata?: any;
}

class Logger {
  private inMemoryLogs: LogEntry[] = [];
  private maxLogs = 500;

  public log(level: LogLevel, context: string, message: string, metadata?: any): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      context,
      message,
      metadata
    };

    this.inMemoryLogs.unshift(entry);
    if (this.inMemoryLogs.length > this.maxLogs) {
      this.inMemoryLogs.pop();
    }

    const metaStr = metadata ? ` | ${JSON.stringify(metadata)}` : '';
    const formatted = `[${entry.timestamp}] [${level}] [${context}] ${message}${metaStr}`;

    switch (level) {
      case 'DEBUG':
        if (process.env.DEBUG === 'true') console.debug(formatted);
        break;
      case 'INFO':
        console.info(formatted);
        break;
      case 'WARN':
        console.warn(formatted);
        break;
      case 'ERROR':
        console.error(formatted);
        break;
    }
  }

  public debug(context: string, message: string, metadata?: any): void {
    this.log('DEBUG', context, message, metadata);
  }

  public info(context: string, message: string, metadata?: any): void {
    this.log('INFO', context, message, metadata);
  }

  public warn(context: string, message: string, metadata?: any): void {
    this.log('WARN', context, message, metadata);
  }

  public error(context: string, message: string, metadata?: any): void {
    this.log('ERROR', context, message, metadata);
  }

  public getRecentLogs(limit = 100): LogEntry[] {
    return this.inMemoryLogs.slice(0, limit);
  }
}

export const logger = new Logger();
