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

import { MultiMiddleware, Middleware, MiddlewareType } from './core/Middleware';
import { HttpMethod, Request, RequestOptions } from './core/Request';
import { TextSerializer } from './serializers/TextSerializer';
import { JsonSerializer } from './serializers/JsonSerializer';
import type { Response } from './core/Response';
import { Serializer } from './core/Serializer';
import { Collection } from '@augu/collections';
import { isObject } from '@augu/utils';
import { Client } from 'undici';
import { Util } from './utils';
import { URL } from 'url';

const { version } = require('../package.json');
const DEFAULT_USER_AGENT = `@augu/orchid (v${version}, https://github.com/auguwu/orchid)`;

/**
 * List of client options to use
 */
export interface HttpClientOptions {
  /**
   * List of serializers to attach
   */
  serializers?: Serializer<any>[];

  /**
   * List of middleware to attach
   */
  middleware?: (Middleware<MiddlewareType> | MultiMiddleware<MiddlewareType>)[];

  /**
   * The user-agent for this [[HttpClient]], the `user-agent` header is automatically
   * populated in the request headers.
   */
  userAgent?: string;

  /**
   * Any default behaviour if a property isn't set in a request
   */
  defaults?: RequestDefaults;

  /**
   * The undici client to override if you want to customize the behaviour
   * of it.
   */
  client?: Client;

  // Why is this an option?
  // Undici doesn't like base urls with leading slashes, so you get this:
  // E:\Projects\Libraries\orchid\node_modules\undici\lib\core\util.js:55
  //    throw new InvalidArgumentError('invalid url')
  //    ^
  // InvalidArgumentError: invalid url

  /**
   * The base path to use when using [[HttpClientOptions.baseUrl]]
   */
  basePath?: string;

  /**
   * The base URL to use, if this is set then [[HttpClient.kClient]] is automatically set
   * and [[RequestOptions.keepClient]] is set to `true`
   */
  baseUrl?: string | URL;
}

export const HttpMethods: Readonly<HttpMethod[]> = [
  'options',
  'connect',
  'delete',
  'trace',
  'head',
  'post',
  'put',
  'get',
  'patch',
  'OPTIONS',
  'CONNECT',
  'DELETE',
  'TRACE',
  'HEAD',
  'POST',
  'PUT',
  'GET',
  'PATCH'
];

type RequestDefaults = Partial<Pick<RequestOptions, 'compress' | 'followRedirects' | 'headers'>>;

/**
 * The request option with `query` for `url` having `:...`
 */
export type HttpRequestOptions = RequestOptions & {
  /**
   * The path parameters to add
   */
  query?: Record<string, string>;
};

/**
 * Checks if [value] is a instanceof `RequestOptions`
 * @param value The value to check
 */
export function isRequestOptions(value: unknown): value is RequestOptions {
  return isObject(value) && (
    typeof (value as RequestOptions).url === 'string' ||
    typeof (value as RequestOptions).method === 'string'
  );
}

/**
 * Checks if [value] is a URL-like component
 * @param value The value to check
 */
export function isUrlLike(value: unknown) {
  return typeof value === 'string' || value instanceof URL;
}

export class HttpClient {
  /**
   * List of serializers available to this [[HttpClient]]
   */
  public serializers: Collection<string | RegExp, Serializer<any>> = new Collection();

  /**
   * List of middleware available to this [[HttpClient]]
   */
  public middleware: Collection<string, Middleware<MiddlewareType> | MultiMiddleware<MiddlewareType>> = new Collection();

  /**
   * The user agent to this [[HttpClient]]
   */
  public userAgent: string;

  /**
   * The request defaults
   */
  public defaults: Required<RequestDefaults>;

  /**
   * The raw options when passed
   */
  public clientOptions: HttpClientOptions;

  /**
   * The base URl to use
   */
  public baseUrl?: string | URL;

  /**
   * The undici client attached to this [[HttpClient]], this is set
   * when `baseURL` is set in [[HttpClientOptions]].
   */
  public kClient?: Client;

  /**
   * Constructs a new [[HttpClient]] instance
   * @param options The http client options to use
   */
  constructor(options: HttpClientOptions = {}) {
    options = Object.assign<{}, HttpClientOptions, HttpClientOptions>({}, {
      serializers: [],
      middleware: [],
      userAgent: DEFAULT_USER_AGENT
    }, options);

    this.userAgent = options.userAgent ?? DEFAULT_USER_AGENT;
    this.baseUrl = options.baseUrl;
    this.clientOptions = options;
    this.defaults = {
      compress: options.defaults?.compress ?? true,
      followRedirects: options.defaults?.followRedirects ?? true,
      headers: {
        'user-agent': options.userAgent ?? DEFAULT_USER_AGENT,
        ...(options.defaults?.headers ?? {})
      }
    };

    if (options.baseUrl !== undefined)
      this.kClient = new Client(typeof options.baseUrl === 'string' ? new URL(options.baseUrl) : options.baseUrl);

    if (options.client !== undefined)
      this.kClient = options.client;

    if (!this.defaults.headers?.hasOwnProperty('user-agent'))
      this.defaults.headers!['user-agent'] = this.userAgent;

    this.serializers.set('application/json', new JsonSerializer());
    this.serializers.set('*', new TextSerializer());

    if (options.serializers !== undefined) {
      for (let i = 0; i < options.serializers.length; i++)
        this.serializers.set(options.serializers[i].contentType, options.serializers[i]);
    }

    if (options.middleware !== undefined) {
      for (let i = 0; i < options.middleware.length; i++) {
        const middleware = options.middleware[i];
        middleware.init?.();

        this.middleware.set(middleware.name, middleware);
      }
    }

    const methods = HttpMethods.slice(0, 9);
    for (let i = 0; i < methods.length; i++) {
      this[methods[i]] = (
        url: string | HttpClientOptions,
        options?: Omit<HttpRequestOptions, 'url' | 'method'>
      ) => this.request(url, methods[i].toUpperCase() as HttpMethod, options);
    }
  }

  /**
   * Attempts to create a request and returns a response object
   * @param url The URL or request options to use
   * @param method The http method verb or request options to use
   * @param options Any additional options to use
   */
  request(
    url: string | HttpClientOptions,
    method?: HttpMethod | Omit<HttpRequestOptions, 'method' | 'url'>,
    options?: Omit<HttpRequestOptions, 'url' | 'method'>
  ) {
    if (typeof url === 'string' ? !isUrlLike(url) : !isRequestOptions(url))
      throw new TypeError('param `url` was not a string or any request options');

    if (method !== undefined && (typeof method === 'string' ? !HttpMethods.includes(method) : !isRequestOptions(method)))
      throw new TypeError('param `method` was not a string or any request options');

    if (options !== undefined && !isRequestOptions(options))
      throw new TypeError('param `options` was not any request options');

    const requestOptions: HttpRequestOptions = isRequestOptions(url)
      ? url
      : method !== undefined && isRequestOptions(method)
        ? method
        : options !== undefined
          ? options
          : {
            method: 'GET',
            url: url as any
          };

    if (this.defaults.headers !== undefined) {
      if (!requestOptions.headers)
        requestOptions.headers = {
          'user-agent': this.userAgent
        };

      for (const [key, header] of Object.entries(this.defaults.headers)) {
        if (requestOptions.headers!.hasOwnProperty(key))
          continue;

        requestOptions.headers![key] = header;
      }
    }

    if (this.defaults.followRedirects !== undefined && this.defaults.followRedirects === true)
      requestOptions.followRedirects = true;

    if (this.defaults.compress !== undefined && this.defaults.compress === true)
      requestOptions.compress = true;

    if (this.kClient !== undefined && (!requestOptions.hasOwnProperty('keepClient') || requestOptions.keepClient === false)) {
      requestOptions.keepClient = true;
      requestOptions.client = this.kClient;
    }

    let requestUrl!: URL;
    const formedUrl = Util.matchPathParams(requestOptions.url, requestOptions.query);

    if (this.baseUrl !== undefined) {
      if (isUrlLike(formedUrl) && !(formedUrl instanceof URL)) {
        const fullBasePath = this.clientOptions.basePath !== undefined
          ? typeof this.baseUrl === 'string'
            ? `${this.baseUrl}${this.clientOptions.basePath}`
            : `${this.baseUrl.protocol}://${this.baseUrl.hostname}${this.baseUrl.pathname}${this.clientOptions.basePath}`
          : this.baseUrl;

        requestUrl = new URL(`${fullBasePath}${formedUrl === '/' ? '' : formedUrl}`);
      } else if (formedUrl instanceof URL) {
        requestUrl = formedUrl;
      } else if (typeof formedUrl === 'string') {
        const fullBaseURL = this.clientOptions.basePath !== undefined
          ? typeof this.baseUrl === 'string'
            ? `${this.baseUrl}${this.clientOptions.basePath}`
            : `${this.baseUrl.protocol}://${this.baseUrl.hostname}${this.baseUrl.pathname}${this.clientOptions.basePath}`
          : this.baseUrl;

        requestUrl = new URL(formedUrl, fullBaseURL);
      }
    } else {
      requestUrl = typeof requestOptions.url === 'string' ? new URL(requestOptions.url) : requestOptions.url;
    }

    return new Request(this, requestUrl, requestOptions.method, requestOptions);
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
   * Applies a middleware definition to this [HttpClient],
   * if you are creating a new instance, it's best recommended
   * to use the `middleware` option
   *
   * @param definition The middleware definition to inject
   * @returns This instance to chain methods
   */
  use(middleware: Middleware<MiddlewareType> | MultiMiddleware<MiddlewareType>) {
    middleware.init?.();
    this.middleware.set(middleware.name, middleware);
    return this;
  }

  /**
   * Runs the middleware based on the [type].
   * @param type The type to use
   */
  runMiddleware(type: MiddlewareType.Response, req: Request, res: Response): void;
  runMiddleware(type: MiddlewareType.Request, req: Request): void;
  runMiddleware(type: MiddlewareType, ...args: any[]) {
    const middleware = this.middleware.filter(midi =>
      (midi as MultiMiddleware<MiddlewareType>).types !== undefined
        ? (midi as MultiMiddleware<MiddlewareType>).types.includes(type)
        : (midi as Middleware<MiddlewareType>).type === type
    );

    for (let i = 0; i < middleware.length; i++) {
      const midi = middleware[i];
      if ((midi as MultiMiddleware<MiddlewareType>).types !== undefined) {
        const m = (midi as MultiMiddleware<MiddlewareType>);
        switch (type) {
          case MiddlewareType.Request:
            (m as any).onRequest.call(midi, args[0]);
            break;

          case MiddlewareType.Response:
            (m as any).onResponse.call(midi, this, args[0], args[1]);
            break;

          default:
            throw new Error(`Type "${type}" doesn't exist`);
        }
      } else {
        switch (type) {
          case MiddlewareType.Request:
            ((midi as Middleware<MiddlewareType>).run as any).call(midi, args[0]);
            break;

          case MiddlewareType.Response:
            ((midi as Middleware<MiddlewareType>).run as any).call(midi, this, args[0], args[1]);
            break;

          default:
            throw new Error(`Type "${type}" doesn't exist`);
        }
      }
    }
  }
}
