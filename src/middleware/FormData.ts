import { Middleware, CycleType } from '.';

/** 
 * Enables the ability to pass in Forms 
 * @returns {Middleware}
 */
export default (): Middleware => ({
  intertwine() {
    try {
      require('form-data');
    } catch {
      const logger = this.middleware.get('logger');
      if (logger) logger.warn('Unable to find package `form-data`, skipping...');      
    }

    const logger = this.middleware.get('logger');
    if (logger) logger.info('Enabled Forms middleware, now you have access to pass in Form Data into Request#body');

    this.middleware.add('form', true);
  },
  cycleType: CycleType.None,
  name: 'form'
});
