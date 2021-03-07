/**
 * Copyright (c) 2020-2021 August
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

import { UrlLike, HttpMethod, HttpClient, Response } from '..';
import type { LogInterface } from '../middleware/logging';
import { createDeflate, createGunzip } from 'zlib';
import { MiddlewareType } from './Middleware';
import TimeoutError from '../errors/TimeoutError';
import { isObject } from '@augu/utils';
import HttpError from '../errors/HttpError';
import FormData from 'form-data';
import { URL } from 'url';
import https from 'https';
import http from 'http';

export interface RequestOptions {
  followRedirects?: boolean;
  compress?: boolean;
  headers?: { [header: string]: any };
  timeout?: number;
  method?: HttpMethod;
  data?: any;
  url?: UrlLike;
}

function applyExternalHeaders(this: Request, packet: unknown) {
  if (packet instanceof FormData) {
    const headers = packet.getHeaders();
    this.header('content-type', headers['content-type']);
  }

  if (isObject(packet) || Array.isArray(packet))
    this.header('content-type', 'application/json');
}

export default class Request {
  public followRedirects: boolean;
  public compressData: boolean;
  public headers: { [header: string]: any };
  public timeout: number;
  public method: HttpMethod;
  public data: any;
  public url: URL;

  #client: HttpClient;

  constructor(client: HttpClient, url: URL, method: HttpMethod, options?: Omit<RequestOptions, 'url' | 'method'>) {
    this.followRedirects = options?.followRedirects ?? true;
    this.compressData = options?.compress ?? false;
    this.headers = options?.headers ?? {};
    this.timeout = options?.timeout ?? 30000;
    this.method = method;
    this.data = options?.data ?? null;
    this.url = url;

    this.#client = client;

    // apply the headers
    if (Object.keys(options?.headers ?? {}).length > 0)
      this.header(options!.headers!);
  }

  compress() {
    const compressed = !this.compressData;
    if (compressed && !this.headers['accept-encoding'])
      this.headers['accept-encoding'] = 'gzip, deflate';

    if (!compressed && this.headers['accept-encoding'] !== undefined)
      delete this.headers['accept-encoding'];

    this.compressData = compressed;
    return this;
  }

  /**
   * Adds a query parameter to the URL
   * @param obj The queries as an object of `key`=`value`
   */
  query(obj: { [x: string]: string }): this;

  /**
  * Adds a query parameter to the URL
  * @param name The name of the query
  * @param value The value of the query
  */
  query(name: string, value: string): this;

  /**
  * Adds a query parameter to the URL
  * @param name An object of key-value pairs of the queries
  * @param [value] The value (if added)
  * @returns This instance to chain methods
  */
  query(name: string | { [x: string]: string }, value?: string) {
    if (typeof name === 'string') {
      if (this.url.searchParams.has(name))
        return this;

      this.url.searchParams.append(name, value!);
    } else if (isObject(name)) {
      for (const [key, val] of Object.entries(name)) {
        if (this.url.searchParams.has(key))
          continue;

        this.url.searchParams.append(key, val);
      }
    } else {
      throw new TypeError(`expected Request.query(name, value) or Request.query({ ... }) but received ${typeof name === 'object' ? 'array/null' : typeof name}`);
    }

    return this;
  }

  /**
  * Adds a header to the request
  * @param obj The headers as an object of `key`=`value`
  */
  header(obj: { [x: string]: string }): this;

  /**
  * Adds a header to the request
  * @param name The name of the header
  * @param value The value of the header
  */
  header(name: string, value: any): this;

  /**
   * Adds a header to the request
   * @param name An object of key-value pairs of the headers
   * @param value The value (if added)
   * @returns This instance to chain methods
   */
  header(name: string | { [x: string]: any }, value?: any) {
    if (typeof name === 'string') {
      // skip if we already have it
      if (this.headers.hasOwnProperty(name.toLowerCase()))
        return this;

      this.headers[name.toLowerCase()] = value!;
    } else if (isObject(name)) {
      for (const [key, val] of Object.entries(name)) {
        // skip when we already have it
        if (this.headers.hasOwnProperty(key.toLowerCase()))
          continue;

        this.headers[key.toLowerCase()] = val;
      }
    } else {
      throw new TypeError(`expected Request.header(name, value) or Request.header({ ... }) but received ${typeof name === 'object' ? 'array/null' : typeof name}`);
    }

    return this;
  }

  /**
   * Attaches any data to this [Request] and sends it
   * @param data The data to send
   */
  body(data: any) {
    applyExternalHeaders.call(this, data);
    this.data = data;
    return this;
  }

  /**
   * Sets a timeout to wait for
   * @param timeout The timeout to wait for
   * @returns This instance to chain methods
   */
  setTimeout(timeout: number) {
    if (isNaN(timeout)) throw new Error('Timeout was not a number.');

    this.timeout = timeout;
    return this;
  }

  /**
   * If we should follow redirects
   * @returns This instance to chain methods
   */
  redirect() {
    this.followRedirects = true;
    return this;
  }

  then(resolver?: (res: Response) => void | PromiseLike<void>, rejecter?: (error: Error) => void) {
    return this.execute().then(resolver as any, rejecter) as Promise<Response>;
  }

  catch(rejecter: (error: Error) => void) {
    return this.then(undefined, rejecter) as Promise<Response>;
  }

  private execute() {
    this.#client.runMiddleware((type) => type === MiddlewareType.Executed, this);

    return new Promise<Response>((resolve, reject) => {
      // Apply the User-Agent header
      if (!this.headers.hasOwnProperty('user-agent'))
        this.headers['user-agent'] = this.#client.userAgent;

      const onResponse = (res: http.IncomingMessage) => {
        const resp = new Response(this.#client, res);
        if (this.compressData) {
          if (res.headers['content-encoding'] === 'gzip') res.pipe(createGunzip());
          if (res.headers['content-encoding'] === 'deflate') res.pipe(createDeflate());
        }

        if (res.headers.hasOwnProperty('location') && this.followRedirects) {
          const url = new URL(res.headers['location']!);
          const req = new (this.constructor as typeof Request)(this.#client, url, this.method, {
            followRedirects: this.followRedirects,
            compress: this.compressData,
            timeout: this.timeout,
            headers: this.headers,
            data: this.data
          });

          res.resume();
          return req
            .then(resolve)
            .catch(reject);
        }

        res.on('error', original => {
          const error = new HttpError('Tried to serialize request, but was unsuccessful');
          const logger = this.#client.middleware.get('logger') as LogInterface | undefined;
          logger?.error(`${error}\nCaused by:\n${original.stack}`);

          return reject(error);
        })
          .on('data', chunk => resp._chunk(chunk))
          .on('end', () => {
            if (!resp.success) return reject(Object.assign(new HttpError(resp.status), { body: resp.body() }));

            this.#client.runMiddleware(type => type === MiddlewareType.OnResponse, resp);
            return resolve(resp);
          });
      };

      const createRequest = this.url.protocol === 'https:' ? https.request : http.request;
      const req = createRequest({
        protocol: this.url.protocol,
        headers: this.headers,
        method: this.method,
        path: `${this.url.pathname}${this.url.search ?? ''}`,
        port: this.url.port,
        host: this.url.hostname
      }, onResponse);

      if (this.timeout !== null)
        req.setTimeout(this.timeout, () => {
          if (req.aborted) return;

          req.destroy();
          return reject(new TimeoutError(this.url.toString(), this.timeout!));
        });

      req.on('error', original => {
        const error = new HttpError(`Unable to create a request to "${this.method.toUpperCase()} ${this.url}"`);
        const logger = this.#client.middleware.get('logger') as LogInterface | undefined;

        logger?.error(`${error}\nCaused by:\n${original.stack}`);
        return reject(error);
      });

      // Just pipe the form data class to the request
      // It'll create the request anyway :shrug:
      if (this.data instanceof FormData) {
        this.#client.runMiddleware(type => type === MiddlewareType.OnRequest, this);
        this.data.pipe(req);
      } else {
        if (this.data) {
          if (isObject(this.data) || Array.isArray(this.data))
            req.write(JSON.stringify(this.data));
          else
            req.write(this.data);
        }

        this.#client.runMiddleware(type => type === MiddlewareType.OnRequest, this);
        req.end();
      }
    });
  }
}
