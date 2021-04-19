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

import { AbortController } from './AbortController';
import { MiddlewareType } from './Middleware';
import { Client, Agent } from 'undici';
import { isObject } from '@augu/utils';
import { Response } from './Response';
import FormData from 'form-data';
import { URL } from 'url';

/**
 * Represents what you should be able to pass in [[RequestOptions.data]]
 */
export type DataLike = string | Record<string, unknown> | unknown[] | Buffer | FormData;

/**
 * List of HTTP methods available under HTTP/1.1
 */
export type HttpMethod =
  | 'options'
  | 'connect'
  | 'delete'
  | 'trace'
  | 'head'
  | 'post'
  | 'put'
  | 'get'
  | 'patch'
  | 'OPTIONS'
  | 'CONNECT'
  | 'DELETE'
  | 'TRACE'
  | 'HEAD'
  | 'POST'
  | 'PUT'
  | 'GET'
  | 'PATCH';

/**
 * List of options to use for constructing a new [[Request]].
 */
export interface RequestOptions {
  /**
   * If we should follow 3xx status-code redirects
   */
  followRedirects?: boolean;

  /**
   * The abort controller to cancel the request
   * if needed.
   */
  controller?: AbortController;

  /**
   * If we should keep the undici client or just
   * close it and construct a new one.
   */
  keepClient?: boolean;

  /**
   * If orchid should apply compression headers or not
   */
  compress?: boolean;

  /**
   * Dictionary of headers to apply
   */
  headers?: Record<string, any>;

  /**
   * The amount of time to create such request and rejects
   * with a [[RequestAbortedError]] error if it takes over
   * the threshold specified.
   */
  timeout?: number;

  /**
   * The undici client to use, or it'll create a new undici client
   * to use.
   */
  client?: Client;

  /**
   * The HTTP method verb to use
   */
  method: HttpMethod;

  /**
   * The undici agent to use, or it'll default to orchid's undici agent.
   */
  agent?: Agent;

  /**
   * Links this request with some data, cannot use this in GET requests
   */
  data?: DataLike;

  /**
   * The URL to point to when requesting
   */
  url: string | URL;
}

const DefaultAgent = new Agent({
  keepAliveTimeout: 5000
});

export class Request {
  /**
   * If we should follow 3xx status-code redirects
   */
  public followRedirects: boolean;

  /**
   * If orchid should apply compression headers or not
   */
  public compressData: boolean;

  /**
   * The abort controller to cancel the request
   * if needed.
   */
  public controller: AbortController;

  /**
   * If we should close the client or we don't. This is based
   * if [[HttpClient.kClient]] is available or not if this option
   * isn't set. To squeeze more performance, set a `baseURL`
   * client option to keep the client cached.
   */
  public keepClient: boolean;

  /**
   * Dictionary of headers to apply
   */
  public headers: Record<string, any>;

  /**
   * The amount of time to create such request and rejects
   * with a [[RequestAbortedError]] error if it takes over
   * the threshold specified.
   */
  public timeout: number;

  /**
   * The undici client to use, or it'll create a new undici client
   * to use. If [[HttpClientOptions.baseURL]] is set, it'll
   * create a public undici client under the [[HttpClient]] to
   * use.
   */
  public client: Client;

  /**
   * The HTTP method verb to use
   */
  public method: HttpMethod;

  /**
   * The undici agent to use, or it'll default to orchid's undici agent.
   */
  public agent: Agent;

  /**
   * Links this request with some data, cannot use this in GET requests
   */
  public data?: DataLike;

  /**
   * The URL to point to when requesting
   */
  public url: URL;

  // orchid http client
  #client: any;

  /**
   * @param client The [[HttpClient]] attached to this [[Request]]
   * @param url The URL to use
   * @param method The HTTP method verb to use
   * @param options Any additional options to construct this Request
   */
  constructor(client: any, url: string | URL, method: HttpMethod, options: Omit<RequestOptions, 'url' | 'method'> = {}) {
    this.followRedirects = options?.followRedirects ?? client.defaults.followRedirects;
    this.compressData = options?.compress ?? false;
    this.controller = options?.controller ?? new AbortController();
    this.keepClient = options?.keepClient ?? client.kClient !== undefined;
    this.headers = options?.headers ?? client.defaults.headers;
    this.timeout = options?.timeout ?? client.defaults.timeout;
    this.client = options?.client ?? client.kClient ?? new Client(typeof url === 'string' ? new URL(url).origin : url.origin);
    this.method = method;
    this.agent = options?.agent ?? DefaultAgent;
    this.data = options?.data;
    this.url = typeof url === 'string' ? new URL(url) : url;

    this.#client = client;
  }

  /**
   * Adds or removes any compression header details to this request
   * @returns This request object to chain methods
   */
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
   * Attach any data to this Request
   * @param data The data
   */
  body(data: DataLike) {
    if (data instanceof FormData && !this.headers.hasOwnProperty('content-type'))
      this.header('content-type', data.getHeaders()['content-type']);

    if (isObject(data) || Array.isArray(data))
      this.header('content-type', 'application/json');

    this.data = data;
    return this;
  }

  /**
   * Attaches callbacks for the resolution and/or rejection of this Request promise
   * @param resolver The callback to execute when the Promise is resolved
   * @param rejecter The callback to execute when the Promise is rejected
   * @returns A Promise for the completion of which ever callback has been executed
   */
  then(resolver?: ((res: Response | PromiseLike<Response>) => unknown) | null, rejecter?: ((error: any) => unknown) | null) {
    return this._execute()
      .then(resolver)
      .catch(rejecter);
  }

  /**
   * Attaches a callback only when the Promise is rejected
   * @param rejecter The callback function to execute
   * @returns A Promise for the completion of the callback
   */
  catch<TResult>(rejecter: (reason: any) => TResult | PromiseLike<TResult>) {
    return this.then(null, rejecter);
  }

  protected _execute() {
    this.#client.runMiddleware(MiddlewareType.Request, this);

    return new Promise<Response>((resolve, reject) => {
      const options: Client.RequestOptions = {
        headers: this.headers,
        method: this.method,
        signal: this.controller,
        path: `${this.url.pathname}${this.url.search}`,
        body: this.data instanceof FormData
          ? this.data.getBuffer()
          : typeof this.data === 'object'
            ? JSON.stringify(this.data)
            : this.data
      };

      const res = new Response();
      const data: Uint8Array[] | Buffer[] = [];

      this.client.dispatch(options, {
        onData(chunk) {
          data.push(chunk);
          return true;
        },

        onError(error) {
          return reject(error);
        },

        onHeaders(statusCode, headers, resume) {
          res.statusCode = statusCode;
          res.parseHeaders(headers ?? []);
          resume();

          return true;
        },

        onComplete: () => {
          if (!this.keepClient)
            this.client.close();

          this.#client.runMiddleware(MiddlewareType.Response);
          res.pushBody(data);
          return resolve(res);
        },

        onUpgrade: () => null,
        onConnect: () => null
      });
    });
  }
}
