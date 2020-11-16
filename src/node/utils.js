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

const { HttpRequest, Methods } = require('./HttpRequest');
const { URL } = require('url');
const { extname } = require('path');

const ExtractType = /^\s*([^;\s]*)(?:;|\s|$)/;
const TextType    = /^text\//i;

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
  },

  getStatuses() {
    if (this.extractNodeVersion() > 10) return (require('http')).STATUS_CODES;

    // stolen from node.js
    // added for node <8 support (because people DUMB and don't upgrade)
    return {
      100: 'Continue',                   // RFC 7231 6.2.1
      101: 'Switching Protocols',        // RFC 7231 6.2.2
      102: 'Processing',                 // RFC 2518 10.1 (obsoleted by RFC 4918)
      103: 'Early Hints',                // RFC 8297 2
      200: 'OK',                         // RFC 7231 6.3.1
      201: 'Created',                    // RFC 7231 6.3.2
      202: 'Accepted',                   // RFC 7231 6.3.3
      203: 'Non-Authoritative Information', // RFC 7231 6.3.4
      204: 'No Content',                 // RFC 7231 6.3.5
      205: 'Reset Content',              // RFC 7231 6.3.6
      206: 'Partial Content',            // RFC 7233 4.1
      207: 'Multi-Status',               // RFC 4918 11.1
      208: 'Already Reported',           // RFC 5842 7.1
      226: 'IM Used',                    // RFC 3229 10.4.1
      300: 'Multiple Choices',           // RFC 7231 6.4.1
      301: 'Moved Permanently',          // RFC 7231 6.4.2
      302: 'Found',                      // RFC 7231 6.4.3
      303: 'See Other',                  // RFC 7231 6.4.4
      304: 'Not Modified',               // RFC 7232 4.1
      305: 'Use Proxy',                  // RFC 7231 6.4.5
      307: 'Temporary Redirect',         // RFC 7231 6.4.7
      308: 'Permanent Redirect',         // RFC 7238 3
      400: 'Bad Request',                // RFC 7231 6.5.1
      401: 'Unauthorized',               // RFC 7235 3.1
      402: 'Payment Required',           // RFC 7231 6.5.2
      403: 'Forbidden',                  // RFC 7231 6.5.3
      404: 'Not Found',                  // RFC 7231 6.5.4
      405: 'Method Not Allowed',         // RFC 7231 6.5.5
      406: 'Not Acceptable',             // RFC 7231 6.5.6
      407: 'Proxy Authentication Required', // RFC 7235 3.2
      408: 'Request Timeout',            // RFC 7231 6.5.7
      409: 'Conflict',                   // RFC 7231 6.5.8
      410: 'Gone',                       // RFC 7231 6.5.9
      411: 'Length Required',            // RFC 7231 6.5.10
      412: 'Precondition Failed',        // RFC 7232 4.2
      413: 'Payload Too Large',          // RFC 7231 6.5.11
      414: 'URI Too Long',               // RFC 7231 6.5.12
      415: 'Unsupported Media Type',     // RFC 7231 6.5.13
      416: 'Range Not Satisfiable',      // RFC 7233 4.4
      417: 'Expectation Failed',         // RFC 7231 6.5.14
      418: 'I\'m a Teapot',              // RFC 7168 2.3.3
      421: 'Misdirected Request',        // RFC 7540 9.1.2
      422: 'Unprocessable Entity',       // RFC 4918 11.2
      423: 'Locked',                     // RFC 4918 11.3
      424: 'Failed Dependency',          // RFC 4918 11.4
      425: 'Too Early',                  // RFC 8470 5.2
      426: 'Upgrade Required',           // RFC 2817 and RFC 7231 6.5.15
      428: 'Precondition Required',      // RFC 6585 3
      429: 'Too Many Requests',          // RFC 6585 4
      431: 'Request Header Fields Too Large', // RFC 6585 5
      451: 'Unavailable For Legal Reasons', // RFC 7725 3
      500: 'Internal Server Error',      // RFC 7231 6.6.1
      501: 'Not Implemented',            // RFC 7231 6.6.2
      502: 'Bad Gateway',                // RFC 7231 6.6.3
      503: 'Service Unavailable',        // RFC 7231 6.6.4
      504: 'Gateway Timeout',            // RFC 7231 6.6.5
      505: 'HTTP Version Not Supported', // RFC 7231 6.6.6
      506: 'Variant Also Negotiates',    // RFC 2295 8.1
      507: 'Insufficient Storage',       // RFC 4918 11.5
      508: 'Loop Detected',              // RFC 5842 7.2
      509: 'Bandwidth Limit Exceeded',
      510: 'Not Extended',               // RFC 2774 7
      511: 'Network Authentication Required' // RFC 6585 6
    };
  },

  /**
   * Extracts the node version and returns the major version
   * @param {string} [version] The version to check, defaults to
   * the current process' version
   */
  extractNodeVersion(version = process.version) {
    if (version.split('.') < 3) throw new TypeError('Missing a valid version (`x.x.x`)');

    return Number(version.split('.')[0]);
  },

  /**
   * Looks up the mime type of the `mime` variable
   * @credit [jshttp/mime-types](https://github.com/jshttp/mime-types)
   * @param {string} path The mime to check
   * @returns {string | false} The mime type that was found
   * or `undefined` if not found.
   */
  lookupMime(path) {
    const map = getMimeMap();
    if (!path || typeof path !== 'string') return false;

    const extension = extname(`x.${path}`)
      .toLowerCase()
      .substr(1);

    if (!extension) return false;

    function getMimeMap() {
      const db = require('./assets/mimes.json');
      const preference = ['nginx', 'apache', undefined, 'iana'];
      const keys = Object.keys(db);
      const types = Object.create(null);

      for (let i = 0; i < keys.length; i++) {
        const mime = db[keys[i]];
        const extensions = mime.extensions;

        if (!extensions || !extensions.length) continue;

        for (let j = 0; j < extensions.length; j++) {
          const extension = extensions[j];
          if (types[extension]) {
            const from = preference.indexOf(db[types[extension]].source);
            const to = preference.indexOf(mime.source);

            if (
              types[extension] !== 'application/octet-stream' &&
              (from > to || (from === to && types[extension].substr(0, 12) === 'application/'))
            ) {
              continue;
            }
          }

          types[extension] = keys[i];
        }
      }

      return types;
    }

    return map[extension] || false;
  },

  /**
   * Returns of the [key] in the [value] object is inside it
   * @template T The data object
   * @param {keyof T} key The key to check
   * @param {T} value The value object
   */
  has(key, value) {
    return key in value;
  },

  /**
   * Namespace for checking value types
   */
  is: {

    /**
     * Returns if [value] is a instance of an Object
     * @param {unknown} value The value to check
     * @returns {value is Object}
     */
    object: (value) => typeof value === 'object' && value !== null,

    /**
     * Returns if [value] is a string
     * @param {unknown} value The value to check
     * @returns {value is string}
     */
    string: (value) => typeof value === 'string' && value !== '',

    /**
     * Returns if [value] is a Function
     * @param {unknown} value The value to check
     * @returns {value is Function}
     */
    function: (value) => typeof value === 'function',

    /**
     * Returns if [value] is a Blob/File-like object
     * @param {unknown} value The value
     * @return {value is (Blob | File | import('./internal/Blob') | import('./internal/File'))}
     */
    blob: (value) =>
      this.is.object(value) &&
      this.is.string(value.type) &&
      this.is.function(value.raw) &&
      ['orchid.Blob', 'orchid.File'].includes(value[Symbol.toStringTag] || value.constructor.name)  &&
      this.has('size', value),

    /**
     * Returns if [value] is a [ReadStream]
     * @param {unknown} value The value
     * @return {value is import('fs').ReadStream}
     */
    stream: (value) => value instanceof (require('fs')).ReadStream

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
