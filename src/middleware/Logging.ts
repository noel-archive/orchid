import { Middleware } from '.';

export interface Logger {
  error(message: string): void;
  warn(message: string): void;
  info(message: string): void;
}

interface LogOptions {
  /**
   * A binding function to add your own custom attributes for messages
   */
  binding?(level: 'error' | 'warn' | 'info', message: string): string;
}

const defaultBinding = (level: 'error' | 'warn' | 'info', message: string) => {
  const escape = (type: any) => `0${type}`.slice(-2);
  const date = new Date();
  const l = level.split(' ').map(key => `${key.charAt(0).toUpperCase()}${key.slice(1)}`).join(' ');

  return `[${escape(date.getHours())}:${escape(date.getMinutes())}:${escape(date.getSeconds())}] [Orchid/${l}] <=> ${message}`;
};

/**
 * Enables logging to track errors, throttle, and attempts
 * @param options The options to use
 * @returns A middleware function to add to `HttpClient#use`
 */
function logging(options?: LogOptions): Middleware {
  const binding = options === undefined 
    ? defaultBinding 
    : options.hasOwnProperty('binding') 
      ? options.binding! 
      : defaultBinding;

  return {
    name: 'logger',
    intertwine() {
      const logger: Logger = {
        error: (message: string) => console.error(binding('error', message)),
        warn: (message: string) => console.warn(binding('warn', message)),
        info: (message: string) => console.hasOwnProperty('info') ? console.info(binding('info', message)) : console.log(binding('info', message))
      };
  
      logger.info('Enabled Logging middleware, now you get secret logging! (Best used in Development)');
      logger.warn('Reminder: HttpRequest#execute is now removed, please use .then/.catch!');
      this.middleware.add('logger', logger);
    }
  };
}

export default logging;