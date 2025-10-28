import { Request, Response, NextFunction } from 'express';

// Custom logging interface
interface LogData {
  timestamp: string;
  method: string;
  url: string;
  userAgent?: string;
  ip?: string;
  userId?: string;
  requestId?: string;
  duration?: number;
  statusCode?: number;
  error?: string;
}

// Generate unique request ID
const generateRequestId = (): string => {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Format log message
const formatLogMessage = (data: LogData): string => {
  const parts = [
    `[${data.timestamp}]`,
    `${data.method} ${data.url}`,
    data.requestId ? `[${data.requestId}]` : '',
    data.statusCode ? `→ ${data.statusCode}` : '',
    data.duration ? `(${data.duration}ms)` : '',
    data.userId ? `[User: ${data.userId}]` : '',
    data.ip ? `[IP: ${data.ip}]` : '',
    data.error ? `[ERROR: ${data.error}]` : ''
  ].filter(Boolean);

  return parts.join(' ');
};

// Log levels
enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

// Enhanced logging function
const log = (level: LogLevel, data: LogData): void => {
  const message = formatLogMessage(data);
  const timestamp = new Date().toISOString();

  switch (level) {
    case LogLevel.INFO:
      console.log(`📝 ${message}`);
      break;
    case LogLevel.WARN:
      console.warn(`⚠️  ${message}`);
      break;
    case LogLevel.ERROR:
      console.error(`❌ ${message}`);
      break;
  }
};

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  const requestId = generateRequestId();

  // Add request ID to request object for use in controllers
  (req as any).requestId = requestId;

  // Extract user ID from JWT token if present
  const authHeader = req.headers.authorization;
  let userId: string | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7);
      // Simple JWT decode (just for logging, not validation)
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      userId = payload.userId || payload.id;
    } catch (error) {
      // Ignore JWT decode errors for logging
    }
  }

  // Log incoming request
  log(LogLevel.INFO, {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl || req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.connection.remoteAddress,
    userId,
    requestId
  });

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function (chunk?: any, encoding?: any) {
    const duration = Date.now() - startTime;

    log(LogLevel.INFO, {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl || req.url,
      requestId,
      duration,
      statusCode: res.statusCode,
      userId
    });

    return originalEnd.call(this, chunk, encoding);
  };

  next();
};

// Error logging middleware
export const errorLogger = (err: any, req: Request, res: Response, next: NextFunction): void => {
  const requestId = (req as any).requestId;

  log(LogLevel.ERROR, {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl || req.url,
    requestId,
    error: err.message || 'Unknown error',
    userId: (req as any).userId
  });

  next(err);
};

// API endpoint specific logger
export const apiLogger = {
  // Log successful API calls
  success: (req: Request, message: string, data?: any): void => {
    const requestId = (req as any).requestId;
    log(LogLevel.INFO, {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl || req.url,
      requestId,
      userId: (req as any).userId
    });

    if (data) {
      console.log(`📊 [${requestId}] Data:`, JSON.stringify(data, null, 2));
    }
  },

  // Log API errors
  error: (req: Request, error: string, details?: any): void => {
    const requestId = (req as any).requestId;
    log(LogLevel.ERROR, {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl || req.url,
      requestId,
      error,
      userId: (req as any).userId
    });

    if (details) {
      console.error(`🔍 [${requestId}] Error details:`, details);
    }
  },

  // Log API warnings
  warn: (req: Request, warning: string, data?: any): void => {
    const requestId = (req as any).requestId;
    log(LogLevel.WARN, {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl || req.url,
      requestId,
      error: warning,
      userId: (req as any).userId
    });

    if (data) {
      console.warn(`⚠️  [${requestId}] Warning data:`, data);
    }
  }
};

export default { requestLogger, errorLogger, apiLogger };
