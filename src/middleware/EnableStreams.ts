import { Middleware, CycleType } from '.';

/**
 * Enables streams to pipe data easier
 * @returns {Middleware} A middleware function to use with `HttpClient#use`
 */
const streams = (): Middleware => ({
  name: 'streams',
  cycleType: CycleType.None,
  intertwine() {
    this.middleware.add('streams', true);

    const logger = this.middleware.get('logger');
    if (logger) logger.info('Enabled streams, now you have access to Response#stream');    
  }
});

export default streams;
