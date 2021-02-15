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

import { IncomingHttpHeaders, IncomingMessage } from 'http';
import { Gunzip, Deflate } from 'zlib';
import { Collection } from '@augu/collections';
import FormData from 'form-data';
import { URL } from 'url';

declare namespace orchid {
  // ~ Constants ~
  /**
   * Returns the current version of orchid
   */
  export const version: string;

  /**
   * List of HTTP Method verbs supported
   */
  export const HttpMethods: Readonly<orchid.HttpMethod[]>;

  // ~ Types / Interfaces ~
  /**
   * All of the http methods available for the HttpClient
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
   * Represents a URL-like structure
   */
  export type UrlLike = string | URL;

  /**
   * Represents the type of data you can pass in
   */
  export type DataLike = string | any[] | object | Buffer | FormData;

  /**
   * Simple type to check if `T` is undefined or not
   */
  export type MaybeUndefined<T> = T | undefined;

  /**
   * Lists out the different options for creating a request
   */
  export interface RequestOptions {
    /** If we should follow redirects */
    followRedirects?: boolean;

    /** If we should return compressed data */
    compress?: boolean;

    /** List of headers to use */
    headers?: { [header: string]: any };

    /** How long we should abort the request if the server is timing out */
    timeout?: number;

    /** The method verb to use */
    method: HttpMethod;

    /** Any data to pass in (content type/length is automatically inferred) */
    data?: DataLike;

    /** The URL to create a request to */
    url: UrlLike;
  }

  /**
   * The http client's options
   */
  export interface HttpClientOptions {
    /** List of serializers to inject */
    serializers?: orchid.Serializer<any>[];

    /** List of middleware to inject */
    middleware?: orchid.MiddlewareDefinition[];

    /** The user agent for this [HttpClient], defaults to the default user agent */
    userAgent?: string;

    /** The request defaults to populate if they don't exist when creating a request */
    defaults?: orchid.RequestDefaults;

    /** The base URL to use */
    baseUrl?: string;
  }

  /**
   * The middleware type
   */
  export enum MiddlewareType {
    /** Runs when we receive a response (Called from `Request.execute()`) */
    OnResponse = 'on.response',

    /** Runs when we first create a request (Called from `Request.execte()`) */
    OnRequest = 'on.request',

    /** Runs when we *first* call `Request.execute()` */
    Executed = 'execute',

    /** */
    None = 'none'
  }

  /**
   * Any defaults to populate if they don't exist when creating a request
   */
  interface RequestDefaults {
    /** If we should follow redirects */
    followRedirects?: boolean;

    /** List of headers to use */
    headers?: { [header: string]: any };

    /** How long we should abort the request if the server is timing out */
    timeout?: number;
  }

  /**
   * Represents the structure for middleware
   */
  export interface MiddlewareDefinition {
    [name: string]: any;

    /**
     * The middleware type
     */
    type: orchid.MiddlewareType | orchid.MiddlewareType[];

    /**
     * The name of the middleware
     */
    name: string;

    /**
     * Runs the middleware
     * @param client The http client
     * @param type The type of middleware
     * @param args Any additional arguments
     */
    run(this: orchid.MiddlewareDefinition, client: orchid.HttpClient, type: orchid.MiddlewareType, ...args: any[]): any;
  }

  /**
   * Basic structure for method requests
   */
  interface BasicRequestOptions extends orchid.HttpClientOptions, Omit<orchid.RequestOptions, 'method'> {}

  interface MiddlewareContainer extends Collection<string, orchid.MiddlewareDefinition> {
    get(key: 'logger'): ReturnType<typeof orchid.middleware.logging>;
    get(key: 'compress'): typeof orchid.middleware.compress;
  }

  // ~ Functions ~
  /**
   * Creates a GET request to a server and returns the response
   * @param options The request options
   * @returns The request to modify contents or the response (if used with `await`)
   */
  export function get(options: orchid.BasicRequestOptions): orchid.Request;

  /**
   * Creates a GET request to a server and returns the response
   * @param url The URL to send to
   * @param options Any additional options to use
   * @returns The request to modify contents or the response (if used with `await`)
   */
  export function get(url: UrlLike, options?: orchid.BasicRequestOptions): orchid.Request;

  /**
   * Creates a PUT request to a server and returns the response
   * @param options The request options
   * @returns The request to modify contents or the response (if used with `await`)
   */
  export function put(options: orchid.BasicRequestOptions): orchid.Request;

  /**
   * Creates a PUT request to a server and returns the response
   * @param url The URL to send to
   * @param options Any additional options to use
   * @returns The request to modify contents or the response (if used with `await`)
   */
  export function put(url: UrlLike, options?: orchid.BasicRequestOptions): orchid.Request;

  /**
   * Creates a DELETE request to a server and returns the response
   * @param options The request options
   * @returns The request to modify contents or the response (if used with `await`)
   */
  export function del(options: orchid.BasicRequestOptions): orchid.Request;

  /**
   * Creates a DELETE request to a server and returns the response
   * @param url The URL to send to
   * @param options Any additional options to use
   * @returns The request to modify contents or the response (if used with `await`)
   */
  export function del(url: UrlLike, options?: orchid.BasicRequestOptions): orchid.Request;

  /**
   * Creates a POST request to a server and returns the response
   * @param options The request options
   * @returns The request to modify contents or the response (if used with `await`)
   */
  export function post(options: orchid.BasicRequestOptions): orchid.Request;

  /**
   * Creates a POST request to a server and returns the response
   * @param url The URL to send to
   * @param options Any additional options to use
   * @returns The request to modify contents or the response (if used with `await`)
   */
  export function post(url: UrlLike, options?: orchid.BasicRequestOptions): orchid.Request;

  /**
   * Creates a PATCH request to a server and returns the response
   * @param options The request options
   * @returns The request to modify contents or the response (if used with `await`)
   */
  export function patch(options: orchid.BasicRequestOptions): orchid.Request;

  /**
   * Creates a PATCH request to a server and returns the response
   * @param url The URL to send to
   * @param options Any additional options to use
   * @returns The request to modify contents or the response (if used with `await`)
   */
  export function patch(url: UrlLike, options?: orchid.BasicRequestOptions): orchid.Request;

  /**
   * Creates a TRACE request to a server and returns the response
   * @param options The request options
   * @returns The request to modify contents or the response (if used with `await`)
   */
  export function trace(options: orchid.BasicRequestOptions): orchid.Request;

  /**
   * Creates a TRACE request to a server and returns the response
   * @param url The URL to send to
   * @param options Any additional options to use
   * @returns The request to modify contents or the response (if used with `await`)
   */
  export function trace(url: UrlLike, options?: orchid.BasicRequestOptions): orchid.Request;

  /**
   * Creates a CONNECT request to a server and returns the response
   * @param options The request options
   * @returns The request to modify contents or the response (if used with `await`)
   */
  export function connect(options: orchid.BasicRequestOptions): orchid.Request;

  /**
   * Creates a CONNECT request to a server and returns the response
   * @param url The URL to send to
   * @param options Any additional options to use
   * @returns The request to modify contents or the response (if used with `await`)
   */
  export function connect(url: UrlLike, options?: orchid.BasicRequestOptions): orchid.Request;

  /**
   * Creates a OPTIONS request to a server and returns the response
   * @param options The request options
   * @returns The request to modify contents or the response (if used with `await`)
   */
  export function options(options: orchid.BasicRequestOptions): orchid.Request;

  /**
   * Creates a OPTIONS request to a server and returns the response
   * @param url The URL to send to
   * @param options Any additional options to use
   * @returns The request to modify contents or the response (if used with `await`)
   */
  export function options(url: UrlLike, options?: orchid.BasicRequestOptions): orchid.Request;

  // ~ Classes ~
  /**
   * Represents the root of Orchid, this is a simple class
   * to create requests to without any overhead. You can use this
   * to extend middleware / serializers or whatever!
   *
   * You can also use the method functions (i.e `orchid.get`), which is
   * an extension to this.
   */
  export class HttpClient {
    constructor(options?: orchid.HttpClientOptions);

    /**
     * List of serializers that was injected in Orchid.
     */
    public serializers: Collection<string, orchid.Serializer<any>>;

    /**
     * List of middleware that was injected in Orchid.
     */
    public middleware: MiddlewareContainer;

    /**
     * The user agent to use
     */
    public userAgent: string;

    /**
     * Any request defaults populated
     */
    public defaults?: orchid.RequestDefaults;

    /**
     * The base URL
     */
    public baseUrl?: string;

    /**
     * Applies a middleware definition to this [HttpClient],
     * if you are creating a new instance, it's best recommended
     * to use the `middleware` option
     *
     * @param definition The middleware definition to inject
     * @returns This instance to chain methods
     */
    public use(definition: orchid.MiddlewareDefinition): this;

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
    public serializer(contentType: string, serializer: orchid.Serializer<any>): this;

    /**
     * Creates a request to the world and returns the response
     * @param url The URL or request options to use
     */
    public request(url: UrlLike): orchid.Request;

    /**
     * Creates a request to the world and returns the response
     * @param options The request options to use
     */
    public request(options: orchid.RequestOptions): orchid.Request;

    /**
     * Creates a request to the world and returns the response
     * @param url The URL to use
     * @param options Any additional options
     */
    public request(url: UrlLike, options?: Omit<orchid.RequestOptions, 'url'>): orchid.Request;

    /**
     * Creates a request to the world and returns the response
     * @param url The URL to use
     * @param method The method to use
     * @param options Any additional options
     */
    public request(url: UrlLike, method: orchid.HttpMethod, options?: Omit<orchid.RequestOptions, 'url' | 'method'>): orchid.Request;

    /**
     * Creates a GET request to the world and returns the response
     * @param url The URL or request options to use
     */
    public get(url: UrlLike): orchid.Request;

    /**
     * Creates a GET request to the world and returns the response
     * @param options The request options to use
     */
    public get(options: Omit<orchid.RequestOptions, 'method'>): orchid.Request;

    /**
     * Creates a GET request to the world and returns the response
     * @param url The URL to use
     * @param options Any additional options
     */
    public get(url: UrlLike, options?: Omit<orchid.RequestOptions, 'url' | 'method'>): orchid.Request;

    /**
     * Creates a PUT request to the world and returns the response
     * @param url The URL or request options to use
     */
    public put(url: UrlLike): orchid.Request;

    /**
     * Creates a PUT request to the world and returns the response
     * @param options The request options to use
     */
    public put(options: Omit<orchid.RequestOptions, 'method'>): orchid.Request;

    /**
     * Creates a PUT request to the world and returns the response
     * @param url The URL to use
     * @param options Any additional options
     */
    public put(url: UrlLike, options?: Omit<orchid.RequestOptions, 'url' | 'method'>): orchid.Request;

    /**
     * Creates a POST request to the world and returns the response
     * @param url The URL or request options to use
     */
    public post(url: UrlLike): orchid.Request;

    /**
      * Creates a POST request to the world and returns the response
      * @param options The request options to use
      */
    public post(options: Omit<orchid.RequestOptions, 'method'>): orchid.Request;

    /**
      * Creates a POST request to the world and returns the response
      * @param url The URL to use
      * @param options Any additional options
      */
    public post(url: UrlLike, options?: Omit<orchid.RequestOptions, 'url' | 'method'>): orchid.Request;

    /**
     * Creates a PATCH request to the world and returns the response
     * @param url The URL or request options to use
     */
    public patch(url: UrlLike): orchid.Request;

    /**
    * Creates a PATCH request to the world and returns the response
    * @param options The request options to use
    */
    public patch(options: Omit<orchid.RequestOptions, 'method'>): orchid.Request;

    /**
    * Creates a PATCH request to the world and returns the response
    * @param url The URL to use
    * @param options Any additional options
    */
    public patch(url: UrlLike, options?: Omit<orchid.RequestOptions, 'url' | 'method'>): orchid.Request;

    /**
     * Creates a DELETE request to the world and returns the response
     * @param url The URL or request options to use
     */
    public delete(url: UrlLike): orchid.Request;

    /**
     * Creates a DELETE request to the world and returns the response
     * @param options The request options to use
     */
    public delete(options: Omit<orchid.RequestOptions, 'method'>): orchid.Request;

    /**
     * Creates a DELETE request to the world and returns the response
     * @param url The URL to use
     * @param options Any additional options
     */
    public delete(url: UrlLike, options?: Omit<orchid.RequestOptions, 'url' | 'method'>): orchid.Request;

    /**
     * Creates a TRACE request to the world and returns the response
     * @param url The URL or request options to use
     */
    public trace(url: UrlLike): orchid.Request;

    /**
     * Creates a TRACE request to the world and returns the response
     * @param options The request options to use
     */
    public trace(options: Omit<orchid.RequestOptions, 'method'>): orchid.Request;

    /**
     * Creates a TRACE request to the world and returns the response
     * @param url The URL to use
     * @param options Any additional options
     */
    public trace(url: UrlLike, options?: Omit<orchid.RequestOptions, 'url' | 'method'>): orchid.Request;

    /**
     * Creates a CONNECT request to the world and returns the response
     * @param url The URL or request options to use
     */
    public connect(url: UrlLike): orchid.Request;

    /**
     * Creates a CONNECT request to the world and returns the response
     * @param options The request options to use
     */
    public connect(options: Omit<orchid.RequestOptions, 'method'>): orchid.Request;

    /**
     * Creates a CONNECT request to the world and returns the response
     * @param url The URL to use
     * @param options Any additional options
     */
    public connect(url: UrlLike, options?: Omit<orchid.RequestOptions, 'url' | 'method'>): orchid.Request;

    /**
     * Creates a OPTIONS request to the world and returns the response
     * @param url The URL or request options to use
     */
    public options(url: UrlLike): orchid.Request;

    /**
     * Creates a OPTIONS request to the world and returns the response
     * @param options The request options to use
     */
    public options(options: Omit<orchid.RequestOptions, 'method'>): orchid.Request;

    /**
     * Creates a OPTIONS request to the world and returns the response
     * @param url The URL to use
     * @param options Any additional options
     */
    public options(url: UrlLike, options?: Omit<orchid.RequestOptions, 'url' | 'method'>): orchid.Request;
  }

  /**
   * Root class for creating requests to the world
   */
  export class Request extends Promise<orchid.Response> {
    /** If we should follow redirects */
    public followRedirects: boolean;

    /** If we should compress data */
    public compressData: boolean;

    /** The headers to use */
    public headers: { [header: string]: any };

    /** Timeout in milliseconds before closing the request with a [TimeoutError] */
    public timeout: number;

    /** The method verb to use */
    public method: orchid.HttpMethod;

    /** The data to send (the content type/length is inferred) */
    public data: orchid.DataLike;

    /** The URL */
    public url: URL;

    /**
     * If we should compress data down or not
     */
    public compress(): this;

    /**
     * Adds a query parameter to the URL
     * @param obj The queries as an object of `key`=`value`
     */
    public query(obj: { [x: string]: string }): this;

    /**
    * Adds a query parameter to the URL
    * @param name The name of the query
    * @param value The value of the query
    */
    public query(name: string, value: string): this;

    /**
    * Adds a header to the request
    * @param obj The headers as an object of `key`=`value`
    */
    public header(obj: { [x: string]: string }): this;

    /**
    * Adds a header to the request
    * @param name The name of the header
    * @param value The value of the header
    */
    public header(name: string, value: any): this;

    /**
     * Attaches any data to this [Request] and sends it
     * @param data The data to send
     */
    public body(data: orchid.DataLike): this;

    /**
     * Sets a timeout to wait for
     * @param timeout The timeout to wait for
     * @returns This instance to chain methods
     */
    public setTimeout(timeout: number): this;

    /**
     * If we should follow redirects
     * @returns This instance to chain methods
     */
    public redirect(): this;
  }

  /**
   * Represents the response from the request
   */
  export class Response {
    /**
     * If the request is successful or not
     * @deprecated Use `response.success`
     */
    public successful: boolean;

    /**
     * Check if the response body is empty or not
     * @deprecated Use `response.empty`
     */
    public isEmpty: boolean;

    /**
     * If the request is successful or not
     */
    public success: boolean;

    /**
     * Check if the response body is empty or not
     */
    public empty: boolean;

    /** Prettifies the current status of this [Response] */
    public status: string;

    /** The status code */
    public statusCode: number;

    /** The headers from the request */
    public headers: IncomingHttpHeaders;

    /**
     * Converts the request body to a readable format from the `content-type` of the response
     */
    public body<T = string>(): T;

    /**
     * Converts the body to a JSON object or array
     */
    public json<T extends object | any[] = { [key: string]: string; }>(): T;

    /**
     * Returns the body as a Buffer
     * @deprecated Use `response.buffer` instead
     */
    public raw(): Buffer;

    /**
     * Returns the body as a Buffer
     */
    public buffer(): Buffer;

    /**
     * Pipes anything to this [Response] instance
     * @param item The item to use Stream.pipe in
     * @param options The options to use
     * @returns That stream's instance
     */
    public pipe<T extends NodeJS.WritableStream>(item: T, options?: { end?: boolean }): T;

    /**
     * Returns the response as a stream
     */
    public stream<T extends IncomingMessage | Gunzip | Deflate = IncomingMessage>(): T;
  }

  export abstract class Serializer<T = any> {}

  export class JsonSerializer<T extends object = {}> extends Serializer<T> {}
  export class TextSerializer extends Serializer<string> {}

  // ~ Namespaces ~
  export namespace middleware {
    export type LogInterface = {
      [Name in 'verbose' | 'error' | 'debug' | 'info' | 'warn']: (message: string) => void;
    };

    export enum LogLevel {
      Info = 1 << 0,
      Error = 1 << 1,
      Warning = 1 << 2,
      Verbose = 1 << 3,
      Debug = 1 << 4
    }

    interface LogOptions {
      /**
       * If we should opt to `console`, for custom loggers,
       * populate the `caller` option
       */
      useConsole?: boolean;

      /**
       * Function to call to log messages, this is overrided
       * with `console` if [LogOptions.useConsole] is true
       */
      // eslint-disable-next-line @typescript-eslint/ban-types
      caller?: Function;

      /**
       * The log level to use
       * @default LogLevel.Verbose
       */
      level?: orchid.middleware.LogLevel | orchid.middleware.LogLevel[];
    }

    /**
     * Compression middleware, inject this using `HttpClient.use` or in the `middleware`
     * options when creating a new [HttpClient].
     */
    export const compress: orchid.MiddlewareDefinition & { enabled: boolean };

    /**
     * Logging middleware, logs messages when a request or response resolves
     * @param options The options to use
     */
    export function logging(options?: orchid.middleware.LogOptions): orchid.MiddlewareDefinition & { logger: LogInterface };
  }
}

export = orchid;
export as namespace orchid;
