/**
 * Logger utility that only logs in development
 * Prevents sensitive information from leaking in production
 */

const isDevelopment = import.meta.env.DEV;

/**
 * Log levels
 */
export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3,
}

/**
 * Logger class
 */
class Logger {
    private level: LogLevel;

    constructor(level: LogLevel = LogLevel.DEBUG) {
        this.level = level;
    }

    /**
     * Debug log (only in development)
     */
    debug(...args: any[]): void {
        if (isDevelopment && this.level <= LogLevel.DEBUG) {
            console.debug('[DEBUG]', ...args);
        }
    }

    /**
     * Info log (only in development)
     */
    info(...args: any[]): void {
        if (isDevelopment && this.level <= LogLevel.INFO) {
            console.info('[INFO]', ...args);
        }
    }

    /**
     * Warning log (always, but sanitized in production)
     */
    warn(...args: any[]): void {
        if (this.level <= LogLevel.WARN) {
            if (isDevelopment) {
                console.warn('[WARN]', ...args);
            } else {
                // In production, log without sensitive data
                const sanitized = args.map(arg => {
                    if (typeof arg === 'object') {
                        return '[Object]';
                    }
                    if (typeof arg === 'string' && arg.length > 100) {
                        return arg.substring(0, 100) + '...';
                    }
                    return arg;
                });
                console.warn('[WARN]', ...sanitized);
            }
        }
    }

    /**
     * Error log (always, but sanitized in production)
     */
    error(...args: any[]): void {
        if (this.level <= LogLevel.ERROR) {
            if (isDevelopment) {
                console.error('[ERROR]', ...args);
            } else {
                // In production, log error type but not full details
                const sanitized = args.map(arg => {
                    if (arg instanceof Error) {
                        return {
                            name: arg.name,
                            message: arg.message,
                            // Don't include stack trace in production
                        };
                    }
                    if (typeof arg === 'object') {
                        // Remove sensitive fields
                        const { password, token, secret, key, ...safe } = arg as any;
                        return safe;
                    }
                    return arg;
                });
                console.error('[ERROR]', ...sanitized);
            }
        }
    }

    /**
     * Set log level
     */
    setLevel(level: LogLevel): void {
        this.level = level;
    }
}

// Default logger instance
export const logger = new Logger();

// Convenience functions
export const log = {
    debug: (...args: any[]) => logger.debug(...args),
    info: (...args: any[]) => logger.info(...args),
    warn: (...args: any[]) => logger.warn(...args),
    error: (...args: any[]) => logger.error(...args),
};

// For backwards compatibility, export console-like functions
export const consoleLog = isDevelopment ? console.log.bind(console) : () => {};
export const consoleError = logger.error.bind(logger);
export const consoleWarn = logger.warn.bind(logger);
export const consoleInfo = logger.info.bind(logger);
export const consoleDebug = logger.debug.bind(logger);

