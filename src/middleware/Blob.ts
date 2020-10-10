import { Middleware, CycleType } from '.';

/**
 * Enables the ability to pass in Blob-data structures
 */
export default (): Middleware => ({
  intertwine() {
    const logger = this.middleware.get('logger');
    if (logger) logger.info('Enabled Blob middleware, now you have access to pass in Blobs in Request#body and access to Response#blob');

    this.middleware.add('blob', true);
  },
  cycleType: CycleType.None,
  name: 'blob'
});
