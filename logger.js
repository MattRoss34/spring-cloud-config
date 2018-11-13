const { createLogger, format, transports } = require('winston');
const { combine, timestamp, colorize, printf } = format;

const myFormat = printf(info => {
  return `${info.timestamp} ${info.level}: ${info.message}`;
});

var loggingConfig = {
  format: combine(
    timestamp(),
    colorize(),
    myFormat
  ),
  transports: [
    new transports.Console({
      timestamp: function() {
        return new Date().toISOString();
      }
    })
  ]
};

module.exports = createLogger(loggingConfig);