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

const { URL } = require('url');
const { HttpRequest, Methods } = require('./HttpRequest');

/**
 * External utilities used through out Orchid
 */
const util = {

  /**
   * Merges a given object with defaults if the property doesn't exist
   * @template T The data object
   * @param {NullableObject<T>} given The given object
   * @param {NonNullableObject<T>} def The default object to merge
   * @returns {NonNullableObject<T>} The object given
   */
  merge(given, def) {
    if (!given) return def;
    for (const key in def) {
      if (!Object.hasOwnProperty.call(given, key) || given[key] === undefined) given[key] = def[key];
      else if (given[key] === Object(given[key])) given[key] = this.merge(def[key], given[key]);
    }

    return given;
  },

  /**
   * Create a new [HttpRequest] instance with the given options
   * @param {import('./HttpClient')} client The client
   * @param {string | import('url').URL | import('./HttpRequest').HttpRequestOptions} url The url, method, or the request options
   * @param {import('./HttpRequest').Methods} method The method to use or the request options
   * @param {import('./HttpRequest').HttpRequestOptions} [options] The options to use
   */
  createRequest(client, url, method, options) {
    return _createRequestInternal.apply(client, [url, method, options]);
  }

};

/**
 * Creates a request instance with the given options
 * @internal
 * @type {CreateRequestInternal}
 */
function _createRequestInternal(url, method, options) {
  if ((typeof url === 'string' || url instanceof URL) && options === undefined) {
    let newUrl = url;

    if (this.baseUrl !== '' || this.baseUrl !== undefined) {
      if (url instanceof URL)
        newUrl = new URL(url.pathname, this.baseUrl);

      else if (typeof url === 'string') {
        const construct = `${this.baseUrl}${url.startsWith('/') ? url : `/${url}`}`;
        newUrl = new URL(construct);
      } else {
        throw new TypeError(`Expected 'string' or 'URL', but gotten ${typeof url}`);
      }
    }

    return new HttpRequest(this, { method, url: newUrl });
  }

  if ((typeof url === 'string' || url instanceof URL) && options !== undefined) {
    const mergedOptions = util.merge(options, this.defaults);
    if (this.baseUrl !== undefined || this.baseUrl !== '') {
      if (url instanceof URL) {
        options.url = new URL(url.pathname, this.baseUrl);
      } else if (typeof url === 'string') {
        const construct = `${this.baseUrl}${url.startsWith('/') ? url : `/${url}`}`;
        newUrl = new URL(construct);
      } else {
        throw new TypeError(`Expected 'string' or 'URL', but gotten ${typeof url}`);
      }
    }

    return new HttpRequest(this, { method, ...options });
  }

  if (!(url instanceof URL) && url instanceof Object && options === undefined) {
    if (this.defaults !== null) {
      const opts = merge(url, this.defaults);

      if (this.baseUrl !== undefined || this.baseUrl !== '') {
        if (opts.url instanceof URL) {
          opts.url = new URL(opts.url.pathname, this.baseUrl);
        } else if (typeof opts.url === 'string') {
          opts.url = new URL(`${this.baseUrl}${opts.url.startsWith('/') ? opts.url : `/${opts.url}`}`);
        } else {
          throw new TypeError(`Expected "string" or URL (package: 'url') but gotten ${typeof opts.url}`);
        }
      }
    }

    return new HttpRequest(this, { method, ...url });
  } else if (url instanceof Object && options !== undefined) {
    throw new TypeError('Parameter `options` shouldn\'t be added in');
  } else {
    throw new TypeError(`Expecting 'string', RequestOptions, or an instanceof URL but gotten ${typeof url} (options: ${typeof options})`);
  }
}

module.exports = util;

/**
 * @typedef {{ [P in keyof T]: NonNullable<T[P]> }} NonNullableObject
 * @template T
 */

/**
 * @typedef {{ [P in keyof T]?: T[P] }} NullableObject
 * @template T
 */

/**
 * @typedef {(this: import('./HttpClient'), url: string | import('url').URL | import('./HttpRequest').HttpRequestOptions, method: import('./HttpRequest').Methods, options?: import('./HttpRequest').HttpRequestOptions) => HttpRequest} CreateRequestInternal
 */
