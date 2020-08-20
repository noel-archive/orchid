import { Middleware, CycleType } from '.';

/**
 * Enables incoming data to be compressed
 * @returns {Middleware} A middleware function to use with `HttpClient#use`
 */
const compress = (): Middleware => ({
  name: 'compress',
  cycleType: CycleType.None,
  intertwine() {
    this.middleware.add('compress', true);
    if (this.middleware.has('logger')) {
      const logger = this.middleware.get('logger')!;
      logger.info('Enabled compressed data middleware, now you have access to Request#compress');
    }
  }
});

export default compress;
