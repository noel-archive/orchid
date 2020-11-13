/**
 * Copyright (c) 2020 August
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

const { Collection } = require('@augu/immutable');
const Middleware = require('./Middleware');
const utils = require('./utils');

const pkg = require('../../package.json');
const METHODS = [
  'GET',
  'PUT',
  'POST',
  'PATCH',
  'TRACE',
  'DELETE',
  'CONNECT',
  'OPTIONS'
];

/**
 * Represents a [HttpClient], a way to create http requests from different
 * servers to return a response. This is commonly used for API-related content,
 * and can be do so using the [HttpClient.request] function.
 */
module.exports = class HttpClient {
  /**
   * Creates a new [HttpClient] to use through out your application
   * @param {HttpClientOptions} [options] The options to apply to change the functionality of Orchid
   * @example
   * ```js
   * // Create a new instance with defaults
   * const client = new HttpClient();
   *
   * // Create a new instance with options
   * const client = new HttpClient({
   *   // options object
   * });
   * ```
   */
  constructor(options = {}) {
    options = utils.merge(options, {
      middleware: [],
      userAgent: `Orchid (https://github.com/auguwu/orchid, v${pkg.version})`,
      baseUrl: '',
      defaults: {
        headers: {},
        timeout: 30000
      }
    });

    this.constructor.validate(options);

    /**
     * The middleware to use through the [HttpClient]'s life-span.
     * @type {Collection<import('./Middleware')>}
     */
    this.middleware = new Collection();

    /**
     * Any default request options to use
     * @type {DefaultHttpRequestOptions}
     */
    this.defaults = utils.merge(options.defaults, {
      followRedirects: true,
      headers: {},
      timeout: 30000
    });

    /**
     * The base URL, if any
     * @type {string}
     */
    this.baseUrl = options.baseUrl;

    if (options.middleware) {
      for (let i = 0; i < options.middleware.length; i++) {
        const middleware = options.middleware[i];
        if (typeof middleware === 'object' && !(middleware instanceof Middleware)) {
          this.use(middleware);
        } else {
          const m = new middleware();
          this.use(m);
        }
      }
    }

    if (options.userAgent && !utils.has(this.defaults.headers, 'User-Agent')) {
      this.defaults.headers['User-Agent'] = options.userAgent;
    }

    for (let i = 0; i < METHODS.length; i++) {
      const method = METHODS[i];
      this[method.toLowerCase()] = (url, options) => this.request(url, utils.merge(options, { method }));
    }
  }

  /**
   * Statically validate the options object
   * @param {HttpClientOptions} options The options to validate
   * @private
   */
  static validate(options) {
    // todo: this
  }

  /**
   * Function to apply middleware to this [HttpClient] instance.
   * This will add it to the callstack and will be run when we reached by
   * it's `type`. This will call the `setup` function if it's `type` is "none",
   * if the type is "none", it must be added yourself when basic functionality
   * is finished.
   *
   * @param {import('./Middleware')} middleware The middleware object
   * @returns {this} Returns this instance to chain methods
   */
  use(middleware) {
    if (middleware.type === 'none') {
      const setup = middleware.setup.bind(this);
      setup();
    } else {
      this.middleware.set(middleware.name, middleware);
    }

    return this;
  }

  /**
   * Function to create a request call to a server
   * @param {string | import('url').URL | import('./HttpRequest').RequestOptions} url The url or options to use
   * @param {import('./HttpRequest').RequestOptions} [options] The external options to use
   * @returns {import('./HttpRequest')} Returns a new [HttpRequest] object, which can function
   * as a Promise, so you can use `await` with this function if needed!
   */
  request(url, options) {
    return utils.createRequest(this, url, options.method || 'get', options);
  }
};

/**
 * @typedef {(new (...args: any[]) => T)} Class
 * @template T
 */

/**
 * @typedef {object} HttpClientOptions
 * @prop {Array<Class<import('./Middleware')>>} [middleware] Any custom middleware to apply without invoking [HttpClient.use]
 * @prop {string} [userAgent] The user agent to use, this will default to the default user agent.
 * @prop {DefaultHttpRequestOptions} [defaults] Any defaults to apply when creating a request
 * @prop {string} [baseUrl] The base URL to use, so we can append a path only. If this
 * isn't set, you will have to apply the full URL.
 *
 * @typedef {object} DefaultHttpRequestOptions
 * @prop {boolean} [followRedirects=true] If we should respect following redirects
 * @prop {{ [x: string]: any }} [headers] Any default headers to apply when creating a request
 * @prop {number} [timeout=30000] The timeout interval to clear the request and throw a [RequestTimeoutError] error
 */
