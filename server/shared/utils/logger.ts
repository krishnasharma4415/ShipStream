import fs from 'fs';
import path from 'path';

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

interface LogEntry {
  timestamp: string;
  level: string;
  service: string;
  message: string;
  meta?: any;
  error?: Error;
}

class Logger {
  private logLevel: LogLevel;
  private logDir: string;
  private serviceName: string;

  constructor(serviceName: string, logLevel: LogLevel = LogLevel.INFO) {
    this.serviceName = serviceName;
    this.logLevel = logLevel;
    this.logDir = path.join(__dirname, '../../logs');
    
    // Ensure log directory exists
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private formatMessage(level: string, message: string, meta?: any, error?: Error): string {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      service: this.serviceName,
      message,
      meta,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } as any : undefined
    };

    return JSON.stringify(entry) + '\n';
  }

  private writeToFile(level: string, message: string, meta?: any, error?: Error): void {
    const logMessage = this.formatMessage(level, message, meta, error);
    const logFile = path.join(this.logDir, `${this.serviceName}.log`);
    
    try {
      fs.appendFileSync(logFile, logMessage);
    } catch (err) {
      console.error('Failed to write to log file:', err);
    }
  }

  private log(level: LogLevel, levelName: string, message: string, meta?: any, error?: Error): void {
    if (level > this.logLevel) return;

    // Console output with colors
    const colors = {
      ERROR: '\x1b[31m',
      WARN: '\x1b[33m',
      INFO: '\x1b[36m',
      DEBUG: '\x1b[37m'
    };
    
    const reset = '\x1b[0m';
    const timestamp = new Date().toISOString();
    
    console.log(
      `${colors[levelName as keyof typeof colors]}[${timestamp}] ${levelName} [${this.serviceName}]${reset} ${message}`,
      meta ? meta : '',
      error ? error : ''
    );

    // File output
    this.writeToFile(levelName, message, meta, error);
  }

  error(message: string, error?: Error, meta?: any): void {
    this.log(LogLevel.ERROR, 'ERROR', message, meta, error);
  }

  warn(message: string, meta?: any): void {
    this.log(LogLevel.WARN, 'WARN', message, meta);
  }

  info(message: string, meta?: any): void {
    this.log(LogLevel.INFO, 'INFO', message, meta);
  }

  debug(message: string, meta?: any): void {
    this.log(LogLevel.DEBUG, 'DEBUG', message, meta);
  }

  // Deployment specific logging
  deploymentStarted(deploymentId: string, repoUrl: string): void {
    this.info('Deployment started', { deploymentId, repoUrl });
  }

  deploymentCompleted(deploymentId: string, duration: number): void {
    this.info('Deployment completed', { deploymentId, duration });
  }

  deploymentFailed(deploymentId: string, error: Error): void {
    this.error('Deployment failed', error, { deploymentId });
  }

  buildStarted(deploymentId: string): void {
    this.info('Build started', { deploymentId });
  }

  buildCompleted(deploymentId: string, duration: number): void {
    this.info('Build completed', { deploymentId, duration });
  }

  buildFailed(deploymentId: string, error: Error): void {
    this.error('Build failed', error, { deploymentId });
  }

  // Authentication logging
  authAttempt(username: string, success: boolean): void {
    if (success) {
      this.info('Authentication successful', { username });
    } else {
      this.warn('Authentication failed', { username });
    }
  }

  // Rate limiting logging
  rateLimitExceeded(ip: string, endpoint: string): void {
    this.warn('Rate limit exceeded', { ip, endpoint });
  }
}

// Create service-specific loggers
export const createLogger = (serviceName: string): Logger => {
  const logLevel = process.env.LOG_LEVEL ? 
    LogLevel[process.env.LOG_LEVEL.toUpperCase() as keyof typeof LogLevel] : 
    LogLevel.INFO;
  
  return new Logger(serviceName, logLevel);
};

export default Logger;