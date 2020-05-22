const winston = require('winston');
const {LoggingWinston} = require('@google-cloud/logging-winston');

const IS_PROD = process.env.NODE_ENV === 'production';

class Logger {
  constructor() {
    this.stackdriverWinston = new LoggingWinston();
    this.logger = winston.createLogger();

    if (IS_PROD) {
      this.logger.add(this.stackdriverWinston);
    } else {
      this.logger.add(new winston.transports.Console({
        format: winston.format.simple(),
      }));
    }
  }

  reqInfo(req, ...args) {
    args[0] = `[${req.method} ${req.originalUrl}]: ` + (args[0] ? args[0] : ''); 
    this.info(...args);
  }

  reqError(req, ...args) {
    args[0] = `[${req.method} ${req.originalUrl}]: ` + (args[0] ? args[0] : ''); 
    this.error(...args);
  }


  info(...args) {
    if (IS_PROD) return;
    this.logger.info(...args);
  }

  warn(...args) {
    this.logger.warn(...args);
  }
  error(...args) {
    this.logger.error(...args);
  }
}

module.exports = new Logger();