import { Middleware, CycleType } from '.';
import getOption from '../util/getOption';

export interface Logger {
  error(message: string): void;
  warn(message: string): void;
  info(message: string): void;
}

/**
 * A binding function to add your own custom attributes for messages
 * @param ns The namespace that it's using
 * @param level The log level
 * @param message The message
 */
type LogBinding = (ns: string, level: 'error' | 'warn' | 'info', message: string) => string;

/**
 * Caller function to call any logging library
 * @param level The level to use
 * @param message The message
 */
type CallerFunction = (level: 'error' | 'warn' | 'info', message: string) => void;

interface LogOptions {
  /** If we should actually log it or not */
  useConsole?: boolean;

  /** The default namespace of the logger, default is `Orchid` */
  namespace?: string;

  /** The coller function (`useConsole` must be false to use it) */
  caller?: CallerFunction; // eslint-disable-line

  /**
   * A binding function to add your own custom attributes for messages
   */
  binding?: LogBinding;
}

const defaultBinding = (ns: string, level: 'error' | 'warn' | 'info', message: string) => {
  const escape = (type: any) => `0${type}`.slice(-2);
  const date = new Date();
  const l = level.split(' ').map(key => `${key.charAt(0).toUpperCase()}${key.slice(1)}`).join(' ');

  return `[${escape(date.getHours())}:${escape(date.getMinutes())}:${escape(date.getSeconds())}] [${ns}/${process.pid}/${l}] <=> ${message}`;
};

/**
 * Enables logging to track errors, throttle, and attempts
 * @param {LogOptions} options The options to use
 * @returns {Middleware} A middleware function to add to `HttpClient#use`
 */
function logging(options?: LogOptions): Middleware {
  const useConsole = getOption<LogOptions, boolean>('useConsole', false, options);
  const binding = getOption<LogOptions, LogBinding>('binding', defaultBinding, options);
  const caller = getOption<LogOptions, CallerFunction | undefined>('caller', undefined, options); // eslint-disable-line
  const ns = getOption<LogOptions, string>('namespace', 'Orchid', options);

  return {
    name: 'logger',
    cycleType: CycleType.None,
    intertwine() {
      const logger: Logger = {
        error: (message: string) => {
          // This feels bad but I have no idea what to do lol
          if (useConsole && typeof caller !== 'undefined') throw new Error('You can\'t provide a caller function if you are using console logging');
          if (!useConsole && typeof caller === 'undefined') throw new Error('You must provide a caller function if you\'re not gonna use console logging');

          const msg = binding(ns, 'error', message);
          return useConsole ? console.warn(msg) : caller!('error', message);
        },
        warn: (message: string) => {
          if (useConsole && typeof caller !== 'undefined') throw new Error('You can\'t provide a caller function if you are using console logging');
          if (!useConsole && typeof caller === 'undefined') throw new Error('You must provide a caller function if you\'re not gonna use console logging');

          const msg = binding(ns, 'warn', message);
          return useConsole ? console.warn(msg) : caller!('warn', message);
        },
        info: (message: string) => {
          if (useConsole && typeof caller !== 'undefined') throw new Error('You can\'t provide a caller function if you are using console logging');
          if (!useConsole && typeof caller === 'undefined') throw new Error('You must provide a caller function if you\'re not gonna use console logging');

          const msg = binding(ns, 'info', message);
          return useConsole ? console.warn(msg) : caller!('info', message);
        }
      };

      this.middleware.add('logger', logger);
    }
  };
}

export default logging;
