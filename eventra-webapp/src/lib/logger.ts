type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogContext {
  userId?: string;
  scope?: string;
  metadata?: Record<string, any>;
  [key: string]: any;
}

class Logger {
  private isDev = process.env.NODE_ENV === 'development';

  private format(level: LogLevel, message: string, context?: LogContext, error?: any) {
    const timestamp = new Date().toISOString();
    
    // Extract error details if present
    let errorDetails: any = undefined;
    if (error) {
      errorDetails = {
        message: error.message || String(error),
        name: error.name || 'Error',
        stack: this.isDev ? error.stack : undefined,
      };
    }

    if (this.isDev) {
      // In development: clean, colorized, readable output
      const colors = {
        info: '\x1b[36m', // Cyan
        warn: '\x1b[33m', // Yellow
        error: '\x1b[31m', // Red
        debug: '\x1b[35m', // Magenta
        reset: '\x1b[0m',
      };

      const color = colors[level] || colors.reset;
      console.log(
        `[${timestamp}] ${color}${level.toUpperCase()}${colors.reset}: ${message}`,
        context ? '\nContext:' : '',
        context || '',
        error ? `\nError:` : '',
        errorDetails || ''
      );
    } else {
      // In production: structured JSON
      console.log(
        JSON.stringify({
          timestamp,
          level,
          message,
          ...context,
          error: errorDetails,
        })
      );
    }
  }

  info(message: string, context?: LogContext) {
    this.format('info', message, context);
  }

  warn(message: string, context?: LogContext) {
    this.format('warn', message, context);
  }

  error(message: string, error?: any, context?: LogContext) {
    this.format('error', message, context, error);
  }

  debug(message: string, context?: LogContext) {
    if (this.isDev) {
      this.format('debug', message, context);
    }
  }
}

export const logger = new Logger();
