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

  reqInfo(req, log = '') {
    this.logger.info(`[${req.method} ${req.originalUrl}]: ${log}`);
  }

  reqError(req, log = '') {
    this.logger.error(`[${req.method} ${req.originalUrl}]: ${log}`);
  }


  info(...args) {this.logger.info(...args)}
  warn(...args) {this.logger.warn(...args)}
  error(...args) {this.logger.error(...args)}
}

module.exports = new Logger();