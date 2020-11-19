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

const RequestTimeoutError = require('./errors/RequestTimeoutError');
const NormalHttpError = require('./errors/HttpError');
const Response = require('./HttpResponse');
const FormData = require('./internal/FormData');
const { URL } = require('url');
const https = require('https');
const utils = require('./utils');
const http = require('http');
const zlib = require('zlib');
const Blob = require('./internal/Blob');

/**
 * Function to check if [text] is upper cased or not
 * @param {string} text The text
 */
const isUpperCase = (text) => text === (text.toUpperCase());

/**
 * Figures out the data payload for [Request.body]
 * @param {import('./HttpClient')} client The HTTP client
 * @param {unknown} packet The packet
 * @returns {{ headers: { [x: string]: string; } | null; packet: any }}
 */
function getDataSource(client, packet) {
  if (typeof packet === 'string') return {
    contentType: null,
    packet
  };

  if (packet instanceof Object || Array.isArray(packet)) return {
    headers: {
      'Content-Type': 'application/json'
    },
    packet
  };

  if (Buffer.isBuffer(packet)) return {
    headers: null,
    packet
  };

  if (packet instanceof Blob) return {
    headers: null,
    packet
  };

  if (packet instanceof FormData) {
    if (!client.middleware.has('forms')) throw new TypeError('Middleware "forms" was not injected, unable to pass in [FormData] structure');

    return {
      headers: {
        'Content-Length': Buffer.byteLength(packet.getBuffer()),
        'Content-Type': 'multipart/form-data'
      },

      packet: packet.getBuffer()
    };
  }
}

module.exports = class Request {
  /**
   * Creates a new [Request] instance
   * @param {import('./HttpClient')} client The passed-in client
   * @param {RequestOptions} options The http options
   */
  constructor(client, options) {
    if (!utils.is.uriLike(options.url)) throw new TypeError(`Malformed URL "${options.url}", must be \`string\` or \`URL\`.`);

    /**
     * If we should follow redirects or not
     * @type {boolean}
     */
    this.followRedirects = utils.get(options, 'followRedirects', false);

    /**
     * If we should compress data or not
     * @type {boolean}
     */
    this.isCompress = utils.get(options, 'compress', false);

    /**
     * If we should return a [http.IncomingMessage] instance or not
     * @type {boolean}
     */
    this.isStream = utils.get(options, 'stream', false);

    /**
     * Dictionary of headers to use
     * @type {{ [x: string]: any }}
     */
    this.headers = utils.get(options, 'headers', {});

    /**
     * How much time in milliseconds to pause the execution
     * @type {number | null}
     */
    this.timeout = utils.get(options, 'timeout', 15000);

    /**
     * The passed down client
     * @private
     * @type {import('./HttpClient')}
     */
    this.client = client;

    /**
     * The HTTP method to use
     * @type {HttpMethod}
     */
    this.method = utils.get(options, 'method', 'GET');

    /**
     * The data packet to use
     * @type {any}
     */
    this.data = null;

    /**
     * The URL to use
     * @type {string | import('url').URL}
     */
    this.url = utils.get(options, 'url');

    if (options.data) {
      const { headers, packet: data } = getDataSource(client, options.data);
      if (headers !== null) this.header(headers);

      this.data = data;
    }
  }

  /**
   * Enables or disables [Request.isStream]
   */
  stream() {
    if (!this.client.middleware.has('streams')) throw new TypeError('Middleware `streams` was not injected.');

    const value = this.isStream;
    this.isStream = !value;

    return this;
  }
};

/**
 * @typedef {'options' | 'connect' | 'delete' | 'trace' | 'head' | 'post' | 'put' | 'get' | 'OPTIONS' | 'CONNECT' | 'DELETE' | 'TRACE' | 'HEAD' | 'POST' | 'PUT' | 'GET'} HttpMethod
 *
 * @typedef {object} RequestOptions
 * @prop {boolean} [followRedirects=false] If we should follow redirects
 * @prop {boolean} [compress=false] If we should compress the data passed down
 * @prop {{ [x: string]: any }} [headers] Any headers to pass down
 * @prop {boolean} [stream=false] If we should pass down a [http.IncomingMessage] instance
 * @prop {number} [timeout=30000] How much time we should stop the execution process
 * @prop {HttpMethod} [method='GET'] The method to use, defaults to `GET`
 * @prop {any} [data] The data packet to pass in
 * @prop {string | import('url').URL} [url] The URL to create a request to
 */

// data from v0
/*
export default class HttpRequest {
  stream() {
    if (!this.client.middleware.has('stream')) throw new Error('Missing the Stream middleware');
    this.streaming = true;

    return this;
  }

  compress() {
    if (!this.client.middleware.has('compress')) throw new Error('Missing the Compress Data middleware');
    if (!this.headers.hasOwnProperty('accept-encoding')) this.headers['accept-encoding'] = 'gzip, deflate';
    this.compressData = true;

    return this;
  }

  query(name: string | { [x: string]: string }, value?: string) {
    if (name instanceof Object) {
      for (const [key, val] of Object.entries(name)) this.url.searchParams[key] = val;
    } else {
      this.url.searchParams[name as string] = value!;
    }

    return this;
  }

  header(name: string | { [x: string]: any }, value?: any) {
    if (name instanceof Object) {
      for (const [key, val] of Object.entries(name)) this.headers[key] = val;
    } else {
      this.header[name as string] = value!;
    }

    return this;
  }

  body(packet: unknown) {
    this.data = figureData.apply(this, [packet]);
    return this;
  }

  setTimeout(timeout: number) {
    if (isNaN(timeout)) throw new Error('Timeout was not a number.');

    this.timeout = timeout;
    return this;
  }

  redirect() {
    this.followRedirects = true;
    return this;
  }

  then(resolve?: (res: HttpResponse) => void, reject?: (error: HttpError) => void) {
    return this.execute()
      .then(resolve, reject);
  }

  catch(callback: (error: HttpError) => void) {
    return this.then(undefined, callback);
  }

  protected execute() {
    const logger = this.client.middleware.get('logger');
    if (logger) logger.info(`Attempting to make a request to "${this.method.toUpperCase()} ${this.url}"`);

    const middleware = this.client.middleware.filter(CycleType.Execute);
    for (let i = 0; i < middleware.length; i++) {
      const ware = middleware[i];
      ware.intertwine.call(this.client);
    }

    return new Promise<HttpResponse>(async (resolve, reject) => {
      if (!this.headers.hasOwnProperty('user-agent')) this.headers['user-agent'] = this.client.userAgent;
      if (this.data) {
        if (this.data instanceof FormData) {
          this.headers['content-type'] = this.data.getHeaders()['content-type'];
        } else if (isObject(this.data)) {
          this.headers['content-type'] = 'application/json';
        }
      }

      const onRequest = async (res: http.IncomingMessage) => {
        if (this.client.middleware.has('streams')) {
          this.streaming = this.client.middleware.get('streams');
        }

        if (this.client.middleware.has('compress')) {
          this.compressData = this.client.middleware.get('compress');
        }

        const response = new HttpResponse(res, this.streaming, this._has('blob'));
        if (this.compressData) {
          if (res.headers['content-encoding'] === 'gzip') res.pipe(zlib.createGunzip());
          if (res.headers['content-encoding'] === 'deflate') res.pipe(zlib.createDeflate());
        }

        if (res.headers.hasOwnProperty('location') && this.followRedirects) {
          const url = new URL(res.headers.location!, this.url);
          const req = new (this.constructor as typeof HttpRequest)(this.client, {
            followRedirects: this.followRedirects,
            compress: this.compressData,
            timeout: this.timeout ? this.timeout : undefined,
            headers: this.headers,
            stream: this.streaming,
            method: this.method,
            data: this.data,
            url
          });

          res.resume();
          return resolve(await req.execute());
        }

        res.on('error', (error) => {
          const httpError = new HttpError(1003, `Tried to serialise data, was unsuccessful (${error.message})`);
          if (logger) logger.error(`Tried to serialise data, was unsuccessful (${error.message})`);
          return reject(httpError);
        });
        res.on('data', chunk => response.addChunk(chunk));
        res.on('end', () => {
          if (!response.successful) return reject(new HttpError(response.statusCode, response.status.replace(`${response.statusCode} `, '')));
          else {
            const middleware = this.client.middleware.filter(CycleType.Done);
            for (let i = 0; i < middleware.length; i++) {
              const ware = middleware[i];
              ware.intertwine.call(this.client);
            }

            return resolve(response);
          }
        });
      };

      const request = this.url.protocol === 'https:' ? https.request : http.request;
      const req = request({
        protocol: this.url.protocol,
        headers: this.headers,
        method: this.method,
        path: `${this.url.pathname}${this.url.search}`,
        port: this.url.port,
        host: this.url.hostname
      }, onRequest);

      if (this.timeout !== null) {
        setTimeout(() => {
          if (req.aborted) return;

          req.abort();
          return reject(new TimeoutError(this.url.toString(), this.timeout!));
        }, this.timeout);
      }

      req.on('error', (error) => {
        const httpError = new HttpError(10004, `Unable to make a ${this.method.toUpperCase()} request to ${this.url} (${error.message})`);
        if (logger) logger.error(`Unable to make a ${this.method.toUpperCase()} request to ${this.url} (${error.message})`);

        return reject(httpError);
      });

      if (this.data) {
        if (Array.isArray(this.data)) {
          if (this.data.some(Buffer.isBuffer)) this.data.map(buf => req.write(buf));
          else req.write(JSON.stringify(this.data));
        } else if (typeof this.data === 'object' && !Array.isArray(this.data)) {
          req.write(JSON.stringify(this.data));
        } else if (this.data instanceof Promise) {
          req.write(await this.data);
        } else {
          req.write(this.data);
        }
      }

      req.end();
    });
  }
}
*/
