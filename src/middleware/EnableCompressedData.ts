import { Middleware } from '.';

export interface CompressMiddleware {
  enabled: boolean;
  type: 'gzip' | 'inflate';
}

/**
 * Enables incoming data to be compressed with Gzip or Inflate
 * @param type The type of compressing to do with
 * @returns A middleware function to use with `HttpClient#use`
 */
const compress = (type: 'gzip' | 'inflate' = 'gzip'): Middleware => ({
  name: 'compress',
  intertwine() {
    this.middleware.add<CompressMiddleware>('compress', {
      enabled: true,
      type
    });

    if (this.middleware.has('logger')) {
      const logger = this.middleware.get('logger')!;
      logger.info('Enabled compressed data middleware, now you have access to Request#compress');
    }
  }
});

export default compress;