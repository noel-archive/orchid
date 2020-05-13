import { Middleware } from '.';

/**
 * Enables streams to pipe data easier
 * @returns A middleware function to use with `HttpClient#use`
 */
const streams = (): Middleware => ({
  name: 'streams',
  intertwine() {
    this.middleware.add<boolean>('streams', true);

    const logger = this.middleware.get('logger');
    if (logger) logger.info('Enabled streams, now you have access to Response#stream');    
  }
});

export default streams;