const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Log levels
const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG'
};

// Get timestamp in ISO format
const getTimestamp = () => {
  return new Date().toISOString();
};

// Format log message
const formatLog = (level, message, meta = {}) => {
  const logEntry = {
    timestamp: getTimestamp(),
    level,
    message,
    ...meta
  };
  return JSON.stringify(logEntry);
};

// Write to console
const writeToConsole = (level, message, meta = {}) => {
  const timestamp = getTimestamp();
  const metaStr = Object.keys(meta).length > 0 ? JSON.stringify(meta) : '';
  
  const colors = {
    ERROR: '\x1b[31m', // Red
    WARN: '\x1b[33m',  // Yellow
    INFO: '\x1b[36m',  // Cyan
    DEBUG: '\x1b[90m'  // Gray
  };
  
  const reset = '\x1b[0m';
  const color = colors[level] || '';
  
  console.log(`${color}[${timestamp}] [${level}]${reset} ${message} ${metaStr}`);
};

// Write to file
const writeToFile = (level, message, meta = {}) => {
  const logEntry = formatLog(level, message, meta);
  const date = new Date().toISOString().split('T')[0];
  
  // All logs go to combined.log
  const combinedLogPath = path.join(logsDir, 'combined.log');
  fs.appendFileSync(combinedLogPath, logEntry + '\n');
  
  // Errors also go to error.log
  if (level === 'ERROR') {
    const errorLogPath = path.join(logsDir, 'error.log');
    fs.appendFileSync(errorLogPath, logEntry + '\n');
  }
  
  // Daily log files
  const dailyLogPath = path.join(logsDir, `${date}.log`);
  fs.appendFileSync(dailyLogPath, logEntry + '\n');
};

// Logger class
class Logger {
  constructor() {
    this.level = process.env.LOG_LEVEL || 'INFO';
  }

  shouldLog(level) {
    const levels = ['ERROR', 'WARN', 'INFO', 'DEBUG'];
    return levels.indexOf(level) <= levels.indexOf(this.level);
  }

  log(level, message, meta = {}) {
    if (!this.shouldLog(level)) return;

    writeToConsole(level, message, meta);
    
    // Write to file in production
    if (process.env.NODE_ENV === 'production' || process.env.ENABLE_FILE_LOGGING === 'true') {
      writeToFile(level, message, meta);
    }
  }

  error(message, meta = {}) {
    this.log(LOG_LEVELS.ERROR, message, meta);
  }

  warn(message, meta = {}) {
    this.log(LOG_LEVELS.WARN, message, meta);
  }

  info(message, meta = {}) {
    this.log(LOG_LEVELS.INFO, message, meta);
  }

  debug(message, meta = {}) {
    this.log(LOG_LEVELS.DEBUG, message, meta);
  }

  // HTTP request logging middleware
  httpLogger() {
    return (req, res, next) => {
      const start = Date.now();
      
      // Log request
      this.info('Incoming request', {
        method: req.method,
        url: req.url,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent')
      });

      // Capture response
      res.on('finish', () => {
        const duration = Date.now() - start;
        const level = res.statusCode >= 400 ? LOG_LEVELS.ERROR : LOG_LEVELS.INFO;
        
        this.log(level, 'Request completed', {
          method: req.method,
          url: req.url,
          statusCode: res.statusCode,
          duration: `${duration}ms`,
          ip: req.ip || req.connection.remoteAddress
        });
      });

      next();
    };
  }

  // Database query logging
  dbLogger(query, time) {
    this.debug('Database query', {
      query: query.substring(0, 200), // Truncate long queries
      executionTime: `${time}ms`
    });
  }

  // Error logging with stack trace
  errorWithStack(error, meta = {}) {
    this.error(error.message, {
      ...meta,
      stack: error.stack,
      name: error.name
    });
  }
}

// Create singleton instance
const logger = new Logger();

module.exports = logger;
