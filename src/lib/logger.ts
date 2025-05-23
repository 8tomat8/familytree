export enum LogLevel {
    ERROR = 'error',
    WARN = 'warn',
    INFO = 'info',
    DEBUG = 'debug'
}

interface LogContext {
    requestId?: string;
    userId?: string;
    method?: string;
    url?: string;
    statusCode?: number;
    userAgent?: string;
    timestamp: string;
}

interface LogEntry {
    level: LogLevel;
    message: string;
    context: LogContext;
    error?: Error;
    stack?: string;
}

class Logger {
    private generateRequestId(): string {
        return Math.random().toString(36).substring(2, 15);
    }

    private createLogEntry(
        level: LogLevel,
        message: string,
        context: Partial<LogContext> = {},
        error?: Error
    ): LogEntry {
        return {
            level,
            message,
            context: {
                timestamp: new Date().toISOString(),
                requestId: context.requestId || this.generateRequestId(),
                ...context
            },
            error,
            stack: error?.stack
        };
    }

    private logToConsole(entry: LogEntry): void {
        const logMessage = {
            ...entry,
            error: entry.error ? {
                name: entry.error.name,
                message: entry.error.message,
                stack: entry.error.stack
            } : undefined
        };

        switch (entry.level) {
            case LogLevel.ERROR:
                console.error('[API_ERROR]', JSON.stringify(logMessage, null, 2));
                break;
            case LogLevel.WARN:
                console.warn('[API_WARN]', JSON.stringify(logMessage, null, 2));
                break;
            case LogLevel.INFO:
                console.info('[API_INFO]', JSON.stringify(logMessage, null, 2));
                break;
            case LogLevel.DEBUG:
                console.debug('[API_DEBUG]', JSON.stringify(logMessage, null, 2));
                break;
        }
    }

    // Client-side API error logging
    logClientError(
        message: string,
        error: Error,
        context: Partial<LogContext> = {}
    ): void {
        const entry = this.createLogEntry(LogLevel.ERROR, message, context, error);
        this.logToConsole(entry);

        // Send to server-side logging endpoint in production
        if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
            this.sendToServer(entry);
        }
    }

    // Server-side API error logging
    logServerError(
        message: string,
        error: Error,
        context: Partial<LogContext> = {}
    ): void {
        const entry = this.createLogEntry(LogLevel.ERROR, message, context, error);
        this.logToConsole(entry);
    }

    // API request/response logging
    logApiRequest(method: string, url: string, context: Partial<LogContext> = {}): void {
        const entry = this.createLogEntry(
            LogLevel.INFO,
            `API Request: ${method} ${url}`,
            { ...context, method, url }
        );
        this.logToConsole(entry);
    }

    logApiResponse(
        method: string,
        url: string,
        statusCode: number,
        context: Partial<LogContext> = {}
    ): void {
        const level = statusCode >= 400 ? LogLevel.ERROR : LogLevel.INFO;
        const entry = this.createLogEntry(
            level,
            `API Response: ${method} ${url} - ${statusCode}`,
            { ...context, method, url, statusCode }
        );
        this.logToConsole(entry);
    }

    private async sendToServer(entry: LogEntry): Promise<void> {
        try {
            await fetch('/api/logs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(entry)
            });
        } catch (error) {
            console.error('Failed to send log to server:', error);
        }
    }
}

export const logger = new Logger(); 