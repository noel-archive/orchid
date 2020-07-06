import { Middleware, CycleType } from '.';

export interface Logger {
  error(message: string): void;
  warn(message: string): void;
  info(message: string): void;
}

interface LogOptions {
  /** The default namespace of the logger, default is `Orchid` */
  namespace?: string;

  /**
   * A binding function to add your own custom attributes for messages
   */
  binding?(ns: string, level: 'error' | 'warn' | 'info', message: string): string;
}

const defaultBinding = (ns: string, level: 'error' | 'warn' | 'info', message: string) => {
  const escape = (type: any) => `0${type}`.slice(-2);
  const date = new Date();
  const l = level.split(' ').map(key => `${key.charAt(0).toUpperCase()}${key.slice(1)}`).join(' ');

  return `[${escape(date.getHours())}:${escape(date.getMinutes())}:${escape(date.getSeconds())}] [${ns}/${process.pid}/${l}] <=> ${message}`;
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

  const ns = options === undefined 
    ? 'Orchid' 
    : options.hasOwnProperty('namespace') 
      ? options.namespace! 
      : 'Orchid';

  return {
    name: 'logger',
    cycleType: CycleType.None,
    intertwine() {
      const logger: Logger = {
        error: (message: string) => console.error(binding(ns, 'error', message)),
        warn: (message: string) => console.warn(binding(ns, 'warn', message)),
        info: (message: string) => console.hasOwnProperty('info') ? console.info(binding(ns, 'info', message)) : console.log(binding(ns, 'info', message))
      };
  
      this.middleware.add('logger', logger);
    }
  };
}

export default logging;