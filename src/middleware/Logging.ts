import { Middleware } from '.';

export interface Logger {
  error(message: string): void;
  warn(message: string): void;
  info(message: string): void;
}

interface LogOptions {
  /**
   * Format this into what you want Orchid to feel like
   */
  format?: string | (() => string);
}

function formatMessage(format: string, options: {
  date: Date;
  level: 'error' | 'warn' | 'info' | 'fatal';
  message: string;
}) {
  const { date, level, message } = options;

  const KEY_REGEX = /[$]\{\s*([\w\.]+)\}\s*/g;
  return format.replace(KEY_REGEX, (selector) => {
    const args = {
      'message': message,
      'level': level,
      'date': `${`0${date.getHours()}`.slice(-2)}:${`0${date.getMinutes()}`.slice(-2)}:${`0${date.getSeconds()}`.slice(-2)}`
    };

    return args.hasOwnProperty(selector) ? args[selector] : '';
  });
}

/**
 * Enables logging to track errors, throttle, and attempts
 * @param options The options to use
 * @returns A middleware function to add to `HttpClient#use`
 */
function logging(options?: LogOptions): Middleware {
  if (options) {
    const error = new Error('Options are not fully ready, check back in a future release');
    error.name = 'Warning';

    throw error;
  }

  return {
    name: 'logger',
    intertwine() {
      const date = new Date();
      const time = `${`0${date.getHours()}`.slice(-2)}:${`0${date.getMinutes()}`.slice(-2)}:${`0${date.getSeconds()}`.slice(-2)}`;
      const logger: Logger = {
        error: (message: string) => console.error(`[${time}] [Orchid/ERROR] ${message}`),
        warn: (message: string) => console.warn(`[${time}] [Orchid/WARN] ${message}`),
        info: (message: string) => console.info(`[${time}] [Orchid/INFO] ${message}`)
      };
  
      logger.info('Enabled Logging middleware, now you get secret logging! (Best used in Development)');
      this.middleware.add<Logger>('logger', logger);
    }
  };
}

export default logging;