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

import Middleware, { IMiddlewareDefinition, MiddlewareType } from './structures/Middleware';
import { JsonSerializer, TextSerializer } from './serializers';
import { isUrlLike, isRequestLike } from './utils';
import Request, { RequestOptions } from './structures/Request';
import { HttpMethod, HttpMethods, Serializer } from '.';
import { Collection } from '@augu/collections';
import { URL } from 'url';

const { version } = require('../package.json');
const DEFAULT_USER_AGENT = `@augu/orchid (v${version}, https://github.com/auguwu/orchid)`;

export interface HttpClientOptions {
  serializers?: Serializer<any>[];
  middleware?: IMiddlewareDefinition[];
  userAgent?: string;
  defaults?: RequestDefaults;
  baseUrl?: string;
}

export type UrlLike = string | URL;

interface RequestDefaults {
  followRedirects?: boolean;
  timeout?: number;
  headers?: { [header: string]: any };
}

export default class HttpClient {
  /** List of serializers available */
  public serializers: Collection<string, Serializer<any>>;

  /** Container for all middleware */
  public middleware: Collection<string, Middleware>;

  /** The user-agent to append to if there is no `User-Agent` header */
  public userAgent: string;

  /** The request defaults to append if it's not provided */
  public defaults?: RequestDefaults;

  /** The base URL, so you can index values like `/owo/:uwu` -> `<baseUrl>/owo/<whatever>` */
  public baseUrl?: string;

  /**
   * Creates a new [HttpClient] instance
   * @param options The options to use
   */
  constructor(options: HttpClientOptions = {}) {
    this.serializers = new Collection();
    this.middleware = new Collection();
    this.userAgent = options.userAgent ?? DEFAULT_USER_AGENT;
    this.defaults = options.defaults;
    this.baseUrl = options.baseUrl;

    if (options.middleware !== undefined) {
      for (let i = 0; i < options.middleware.length; i++) {
        const definition = options.middleware[i];
        const middleware = new Middleware(definition);

        // If the middleware type is `None`, we should
        // probably run it
        if (middleware.type.includes(MiddlewareType.None))
          middleware.execute(this, MiddlewareType.None);

        this.middleware.set(definition.name, middleware);
      }
    }

    this.serializers.set('application/json', new JsonSerializer());
    this.serializers.set('*', new TextSerializer());
  }

  /**
   * Applies a middleware definition to this [HttpClient],
   * if you are creating a new instance, it's best recommended
   * to use the `middleware` option
   *
   * @param definition The middleware definition to inject
   * @returns This instance to chain methods
   */
  use(definition: IMiddlewareDefinition) {
    const middleware = new Middleware(definition);
    if (middleware.type.includes(MiddlewareType.None)) {
      middleware.execute(this, MiddlewareType.None);
      return this;
    }

    this.middleware.set(definition.name, middleware);
    return this;
  }

  /**
   * Injects a serializer to this [HttpClient] instance.
   * This will attempt any packets of data if the [contentType]
   * is the same and *attempts* to serialize or a [SerializationError]
   * will occur. Best recommended to inject it in the `serializers`
   * array when creating a new Orchid instance.
   *
   * @param contentType The content type to serialize to
   * @param definition The serializer definition
   * @returns This instance to chain methods.
   */
  serializer(contentType: string, definition: Serializer<any>) {
    this.serializers.set(contentType, definition);
    return this;
  }

  /**
   * Attempts to run any middleware with a specific [filter]
   * @param filter The filter to run
   */
  runMiddleware(filter: (type: MiddlewareType) => boolean, ...args: any[]) {
    const middleware = this.middleware.filter(m => m.type.map(val => filter(val)).length > 0);
    for (let i = 0; i < middleware.length; i++)
      // @ts-ignore shut up :(
      middleware[i].run(this, middleware[i].type, ...args);
  }

  /**
   * Creates a request to the world and returns the response
   *
   * @param url The URL or request options
   * @param method The HTTP method verb to use or the request options
   * @param options The request options
   */
  request(
    url: UrlLike | Omit<RequestOptions, 'url' | 'method'> & { url: UrlLike; method: HttpMethod; },
    method?: HttpMethod | Omit<RequestOptions, 'method' | 'url'> & { url: UrlLike; },
    options?: RequestOptions
  ) {
    if (typeof url === 'string' ? !isUrlLike(url) : !isRequestLike(url))
      throw new TypeError('param `url` was not any request options or a url-like value');

    if (method !== undefined && (typeof method === 'string' ? !HttpMethods.includes(method) : !isRequestLike(method)))
      throw new TypeError('param `method` was not a string of http methods or any request options');

    if (options !== undefined && !isRequestLike(options))
      throw new TypeError('param `options` was not any request options');

    // Check if `url` is any request options & method/options exists
    if (
      isRequestLike(url) &&
      (method !== undefined && isRequestLike(method)) ||
      (options !== undefined && isRequestLike(options))
    ) throw new TypeError('`url` was a instanceof request options yet `method` or `options` has request options?');

    const requestOpts: RequestOptions = isRequestLike(url) ? url : isRequestLike(method) ? method : options !== undefined && isRequestLike(options) ? options as any : {};
    const defaults: RequestDefaults = {
      followRedirects: requestOpts.followRedirects ?? true,
      timeout: requestOpts.timeout ?? 30000,
      headers: requestOpts.headers ?? {},
    };

    const definedReqOpts = isRequestLike(url)
      ? url
      : isRequestLike(method)
        ? method
        : options !== undefined && isRequestLike(options)
          ? options as RequestOptions
          : {};

    if (definedReqOpts.followRedirects === undefined)
      definedReqOpts.followRedirects = defaults.followRedirects;

    if (definedReqOpts.headers === undefined)
      definedReqOpts.headers = defaults.headers;

    if (definedReqOpts.timeout === undefined)
      definedReqOpts.timeout = defaults.timeout;

    if (definedReqOpts.headers !== undefined && Object.keys(defaults.headers ?? {}).length > 0)
      definedReqOpts.headers = Object.assign(definedReqOpts.headers, defaults.headers);

    let reqUrl!: URL;
    if (this.baseUrl !== undefined) {
      if (isUrlLike(url)) {
        if (url instanceof URL) reqUrl = new URL(url.pathname, this.baseUrl);
        else if (typeof url === 'string') reqUrl = new URL(`${this.baseUrl}${url.startsWith('/') ? '/' : `/${url}`}`);
        else throw new TypeError(`Expected \`string\` or \`URL\`, received ${typeof url}.`);
      } else if (isUrlLike(url.url)) {
        if (url.url instanceof URL) reqUrl = new URL(url.url.pathname, this.baseUrl);
        else if (typeof url.url === 'string') reqUrl = new URL(`${this.baseUrl}${url.url.startsWith('/') ? '/' : `/${url.url}`}`);
        else throw new TypeError(`Expected \`string\` or \`URL\`, received ${typeof url.url}.`);
      } else if (isRequestLike(method) && isUrlLike(method.url)) {
        const u = method.url as UrlLike;

        if (u instanceof URL) reqUrl = new URL(u.pathname, this.baseUrl);
        else if (typeof u === 'string') reqUrl = new URL(`${this.baseUrl}${u.startsWith('/') ? '/' : `/${u}`}`);
        else throw new TypeError(`Expected \`string\` or \`URL\`, received ${typeof u}.`);
      } else if (
        options !== undefined &&
        isRequestLike(options as RequestOptions) &&
        isUrlLike((options as RequestOptions).url)
      ) {
        const u = (options as RequestOptions).url as UrlLike;

        if (u instanceof URL) reqUrl = new URL(u.pathname, this.baseUrl);
        else if (typeof u === 'string') reqUrl = new URL(`${this.baseUrl}${u.startsWith('/') ? '/' : `/${u}`}`);
        else throw new TypeError(`Expected \`string\` or \`URL\`, received ${typeof u}.`);
      }
    } else {
      reqUrl = definedReqOpts.url instanceof URL ? definedReqOpts.url! : new URL(definedReqOpts.url!);
    }

    if (!reqUrl)
      throw new SyntaxError('Unable to identify request URL.');

    let meth: HttpMethod | undefined = undefined;
    if (isRequestLike(url) && url.method !== undefined)
      meth = url.method;
    else if (isRequestLike(method))
      meth = method.method;
    else if (typeof method === 'string')
      meth = method;
    else if (options !== undefined && isRequestLike(options))
      meth = (options as RequestOptions).method;

    if (meth === undefined || !HttpMethods.includes(meth)) {
      const message = meth === undefined
        ? 'Method was not defined from the `url`, `method`, or `options` parameters.'
        : `Method '${meth}' was not a valid HTTP Method verb. (${HttpMethods.join(', ')})`;

      throw new TypeError(message);
    }

    return new Request(this, reqUrl, meth, requestOpts);
  }

  /**
   * Alias for [HttpClient.request] for GET methods
   * @param url The URL or request options
   * @param method The HTTP method verb to use or the request options
   * @param options The request options
   */
  get(
    url: UrlLike | Omit<RequestOptions, 'url' | 'method'> & { url: UrlLike; },
    options?: RequestOptions
  ) {
    return this.request(url as any, 'GET', options);
  }

  /**
   * Alias for [HttpClient.request] for PUT methods
   * @param url The URL or request options
   * @param method The HTTP method verb to use or the request options
   * @param options The request options
   */
  put(
    url: UrlLike | Omit<RequestOptions, 'url' | 'method'> & { url: UrlLike; },
    options?: RequestOptions
  ) {
    return this.request(url as any, 'PUT', options);
  }

  /**
   * Alias for [HttpClient.request] for POST methods
   * @param url The URL or request options
   * @param method The HTTP method verb to use or the request options
   * @param options The request options
   */
  post(
    url: UrlLike | Omit<RequestOptions, 'url' | 'method'> & { url: UrlLike; },
    options?: RequestOptions
  ) {
    return this.request(url as any, 'POST', options);
  }

  /**
   * Alias for [HttpClient.request] for HEAD methods
   * @param url The URL or request options
   * @param method The HTTP method verb to use or the request options
   * @param options The request options
   */
  head(
    url: UrlLike | Omit<RequestOptions, 'url' | 'method'> & { url: UrlLike; },
    options?: RequestOptions
  ) {
    return this.request(url as any, 'HEAD', options);
  }

  /**
   * Alias for [HttpClient.request] for PATCH methods
   * @param url The URL or request options
   * @param method The HTTP method verb to use or the request options
   * @param options The request options
   */
  patch(
    url: UrlLike | Omit<RequestOptions, 'url' | 'method'> & { url: UrlLike; },
    options?: RequestOptions
  ) {
    return this.request(url as any, 'PATCH', options);
  }

  /**
   * Alias for [HttpClient.request] for TRACE methods
   * @param url The URL or request options
   * @param method The HTTP method verb to use or the request options
   * @param options The request options
   */
  trace(
    url: UrlLike | Omit<RequestOptions, 'url' | 'method'> & { url: UrlLike; },
    options?: RequestOptions
  ) {
    return this.request(url as any, 'TRACE', options);
  }

  /**
   * Alias for [HttpClient.request] for CONNECT methods
   * @param url The URL or request options
   * @param method The HTTP method verb to use or the request options
   * @param options The request options
   */
  connect(
    url: UrlLike | Omit<RequestOptions, 'url' | 'method'> & { url: UrlLike; },
    options?: RequestOptions
  ) {
    return this.request(url as any, 'CONNECT', options);
  }

  /**
   * Alias for [HttpClient.request] for OPTIONS methods
   * @param url The URL or request options
   * @param method The HTTP method verb to use or the request options
   * @param options The request options
   */
  options(
    url: UrlLike | Omit<RequestOptions, 'url' | 'method'> & { url: UrlLike; },
    options?: RequestOptions
  ) {
    return this.request(url as any, 'OPTIONS', options);
  }
}
