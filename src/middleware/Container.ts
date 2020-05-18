import { Logger } from './Logging';

/**
 * Basic structure of what the middleware container should be like
 */
export interface Container {
  [x: string]: any;
  compress?: boolean;
  streams?: boolean;
  logger?: Logger;
}

/**
 * Container-based API to get/set middleware
 */
export default class MiddlewareContainer {
  /** The container itself */
  private _container: Container;

  /**
   * Construct a new instance of the `MiddlewareContainer` class
   */
  constructor() {
    this._container = {};
  }

  /**
   * Gets the logger middleware
   */
  get(name: 'logger'): Logger | null;

  /**
   * Gets the compressed data middleware
   */
  get(name: 'compress'): boolean | null;

  /**
   * Gets the streams data middleware
   */
  get(name: 'streams'): boolean | null;

  /**
   * Gets the selected middleware from the container
   * @param name The name of the container
   */
  get(name: string) {
    return this._container.hasOwnProperty(name) ? this._container[name] : null;
  }

  /**
   * Adds the specified middleware to the container
   * @param name The name of the middleware
   * @param data The middleware itself
   */
  add<T = any>(name: string, data: T) {
    this._container[name] = data;

    const logger = this.get('logger');
    if (logger) logger.info(`Added middleware ${name} to the container.`);
  }

  /**
   * Checks if this container contains the middleware that was[n't] injected
   * @param name The middleware's name
   */
  has(name: string) {
    return this._container.hasOwnProperty(name);
  }
}