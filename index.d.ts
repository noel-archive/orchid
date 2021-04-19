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

import { Client, Agent } from 'undici';
import { Collection } from '@augu/collections';
import { EventBus } from '@augu/utils';
import FormData from 'form-data';
import { URL } from 'url';

declare namespace orchid {
  /**
   * Bundled in middleware into orchid
   */
  export namespace middleware {
    interface LogOptions {
      /**
       * If we opt to use `console` as the logger or not.
       */
      useConsole?: boolean;

      /**
       * The log function to call when the middleware
       * logs something.
       */
      log?: (message: string) => void;
    }

    interface LoggingProps {
      isConsole: boolean;
      log: (message: string) => void;
    }

    interface PingsProps {
      reqPing: number;
      pings: number[];
    }

    /**
     * Middleware to log request and responses
     * @param options The options to use
     */
    export function logging(options?: orchid.middleware.LogOptions): orchid.MultiMiddleware<orchid.MiddlewareType.Request | orchid.MiddlewareType.Response, LoggingProps>;

    /**
     * Middleware to show the average latency of multiple request -> responses
     */
    export const pings: orchid.MultiMiddleware<orchid.MiddlewareType.Request | orchid.MiddlewareType.Response, PingsProps>;
  }

  // ~ Constants ~
  /**
   * Returns the version of @augu/orchid
   */
  export const version: string;

  /**
   * List of http method verbs available
   */
  export const HttpMethods: Readonly<HttpMethod[]>;

  // ~ Types ~
  /** Type alias to infer the string after `on` in a string */
  export type DispatchEventName<K extends string> = K extends `on${infer P}` ? P : never;

  /**
   * List of events available to a single [[AbortSignal]]
   */
  export interface AbortSignalEvents {
    /**
     * Emitted when [[AbortController.abort]] is called.
     * @param event The event packet
     */
    onabort(event: AbortSignalEvent): void;
  }

  /**
   * Event payload from `onabort` event
   */
  export interface AbortSignalEvent {
    /**
     * The target abort signal
     */
    target: AbortSignal;

    /**
     * The event type, always `'abort'`
     */
    type: 'abort';
  }

  /**
   * List of middleware types available
   */
  export enum MiddlewareType {
    /**
     * Called when a [[Response]] object is serialized
     */
    Response = 'on:response',

    /**
     * Called when a [[Request]] was *just* made
     */
    Request = 'on:request'
  }

  /**
   * The runner function to use based on it's [[Type]].
   */
  // todo: make this better? idk it looks ugly but it'll have to do 💅
  export type RunFunction<Type extends MiddlewareType> = Type extends MiddlewareType.Request
    ? (req: Request) => void
    : Type extends MiddlewareType.Response
      ? (res: Response) => void
      : never;

  /**
   * Represents a middleware object, this is used for [[HttpClient.use]]. When [[HttpClient.use]] is called,
   * it'll run the `init` lifecycle hook (can be omitted), to append any [[Props]] (if any), then the specific
   * [[Type]] is called, it'll run the middleware with the `run` function, where all logic happens with extra
   * arguments dependent on the [[Type]] with a `next` parameter which will call the next middleware.
   *
   * Example middleware:
   *
   * ```js
   * const mod: Middleware<MiddlewareFunction<MiddlewareType.Request>, {}> = {
   *   name: 'my.middleware',
   *   type: MiddlewareType.Request,
   *   init() {
   *      // init function when `client.use` is called
   *   },
   *   run(req, next) {
   *     // req => orchid.Request
   *     next();
   *   }
   * };
   * ```
   */
  export type Middleware<Type extends MiddlewareType, Props = {}> = MiddlewareDefinition<Type> & {
    [P in keyof Props]?: Props[P];
  };

  /**
   * Represents middleware definition to multiple types, refer to the [[Middleware]] type alias
   * for more information.
   */
  export type MultiMiddleware<Type extends MiddlewareType, Props = {}> = MultiMiddlewareDefinition<Type> & {
    [P in keyof Props]?: Props[P];
  };

  /**
   * Definition object for middleware, read the [[Middleware]] type
   * for more in-depth information.
   */
  export interface MiddlewareDefinition<Type extends MiddlewareType> {
    /**
     * Called when [[HttpClient.use]] is called, to initialize this middleware
     * with any additional properties it desires.
     */
    init?(): void;

    /**
     * The middleware type
     */
    type: Type;

    /**
     * The name of the middleware
     */
    name: string;

    /**
     * The run function to use
     */
    run: RunFunction<Type>;
  }

  /**
   * Definition object for multi-middleware; read the [[Middleware]] type
   * for more of an in-depth explaination
   */
  // yes this looks like shit but it'll have to do i guess
  export type MultiMiddlewareDefinition<Type extends MiddlewareType> = Omit<MiddlewareDefinition<Type>, 'type' | 'run'> & {
    types: MiddlewareType[];
  } & Required<(Type extends MiddlewareType
    ? Type extends MiddlewareType.Response
      ? {
        /**
         * Ran when Orchid has serialized a response when requesting
         * @param res The response object
         * @param next Next function to call the next middleware
         */
        onResponse(client: any, req: Request, res: Response): void;
      }
      : Type extends MiddlewareType.Request
        ? {
          /**
           * Ran when the FIRST hit of a request has been made
           * @param client The orchid client to use
           * @param req The request object
           * @param next The next function
           */
          onRequest(req: Request): void
        }
        : never
      : never)>;

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
     * The base URL to use, if this is set then [[HttpClient.kClient]] is automatically set
     * and [[RequestOptions.keepClient]] is set to `true`
     */
    baseUrl?: string;
  }

  /**
   * Request defaults
   */
  export type RequestDefaults = Partial<Pick<RequestOptions, 'compress' | 'followRedirects' | 'headers'>>;

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
   * Singular options for `orchid.get(...)`/etc...
   */
  export type MethodRequestOptions = HttpRequestOptions & HttpClientOptions;

  // ~ Classes ~
  /**
   * Polyfill for [[AbortSignal]] without adding any over-head dependencies
   */
  export class AbortSignal {
    /**
     * The event emitter to dispatch events
     */
    public eventEmitter: EventBus<AbortSignalEvents>;

    /**
     * If this signal is aborted or not
     */
    public aborted: boolean;

    /**
     * Pops a event's specific listener from the callstack.
     * @param name The name of the event to pop out
     * @param handler The handler function
     */
    public removeEventListener<K extends keyof AbortSignalEvents>(name: K, handler: AbortSignalEvents[K]): void;

    /**
     * Pushes a new event to the event callstack
     * @param name The name of the event to push
     * @param handler The handler function
     */
    public addEventListener<K extends keyof AbortSignalEvents>(name: K, handler: AbortSignalEvents[K]): void;

    /**
     * Dispatch a event from this [[AbortSignal]]
     * @param type The type to dispatch
     */
    public dispatchEvent<K extends keyof AbortSignalEvents>(type: DispatchEventName<K>): void;
  }

  /**
   * Polyfill for AbortController specified here: https://developer.mozilla.org/en-US/docs/Web/API/AbortController
   *
   * I made my own polyfill to not add over-head polyfill dependencies
   */
  export class AbortController {
    public signal: AbortSignal;

    /**
     * Aborts the request
     */
    public abort(): void;
  }

  export class Request extends Promise<Response> {
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

    /**
     * @param client The [[HttpClient]] attached to this [[Request]]
     * @param url The URL to use
     * @param method The HTTP method verb to use
     * @param options Any additional options to construct this Request
     */
    constructor(client: HttpClient, url: string | URL, method: HttpMethod, options?: Omit<RequestOptions, 'url' | 'method'>);

    /**
     * Adds or removes any compression header details to this request
     * @returns This request object to chain methods
     */
    public compress(): Request;

    /**
     * Adds a query parameter to the URL
     * @param obj The queries as an object of `key`=`value`
     */
    public query(obj: { [x: string]: string }): Request;

    /**
     * Adds a query parameter to the URL
     * @param name The name of the query
     * @param value The value of the query
     */
    public query(name: string, value: string): Request;

    /**
     * Adds a query parameter to the URL
     * @param name An object of key-value pairs of the queries
     * @param [value] The value (if added)
     * @returns This instance to chain methods
     */
    public query(name: string | { [x: string]: string }, value?: string): Request;

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
      * Adds a header to the request
      * @param name An object of key-value pairs of the headers
      * @param value The value (if added)
      * @returns This instance to chain methods
      */
    public header(name: string | { [x: string]: any }, value?: any): Request;

    /**
     * Attach any data to this Request
     * @param data The data
     */
    public body(data: DataLike): Request;
  }

  /**
   * Represents a http response from the initial request
   */
  export class Response {
    public statusCode: number;
    public headers: Record<string, string | string[]>;

    constructor(client: HttpClient);

    /**
     * If the request was successful or not
     */
    public get success(): boolean;

    /**
     * Check if the response body is empty or not
     */
    public get empty(): boolean;

    /**
     * Converts the response body to a JSON object or array
     */
    public json<T extends Record<string, unknown> | any[] = Record<string, unknown>>(): T;

    /**
     * Converts the response body to a string
     */
    public text(encoding?: BufferEncoding): string;

    /**
     * Returns the response body as a buffer
     */
    public buffer(): Buffer;

    /**
     * Converts the response body to any serializable entity. For text: use
     * [[Response.text]]. For JSON, use [[Response.json]]. This function is only
     * for custom serialization entities like XML.
     */
    public body<T = string>(): T;
  }

  /**
   * Represents a [Serializer] class, which serializes objects from a specific content-type
   *
   * __**Built-in Serializers**__
   * - `application/json`: JsonSerializer
   * - `*` or `text/html`: TextSerializer
   */
  export abstract class Serializer<T = unknown> {
    /** The content-type to use */
    public contentType: string | RegExp;

    /**
     * Constructs a new instance of [Serializer]
     * @param contentType The content-type to use to serialize
     */
    constructor(contentType: string | RegExp);

    /**
     * Serializes data and returns the output
     * @param data The data (that is a Buffer) to serialize
     * @returns The data represented as [T].
     * @throws {SyntaxError} When the user hasn't overloaded this function
     */
    public serialize(data: Buffer): T;
  }

  export class JsonSerializer extends Serializer<{}> {}
  export class TextSerializer extends Serializer<string> {}

  export class HttpClient {
    /**
     * List of serializers available to this [[HttpClient]]
     */
    public serializers: Collection<string | RegExp, Serializer<any>>;

    /**
     * List of middleware available to this [[HttpClient]]
     */
    public middleware: Collection<string, Middleware<MiddlewareType> | MultiMiddleware<MiddlewareType>>;

    /**
     * The user agent to this [[HttpClient]]
     */
    public userAgent: string;

    /**
     * The request defaults
     */
    public defaults: RequestDefaults;

    /**
     * The base URl to use
     */
    public baseUrl?: string;

    /**
     * The undici client attached to this [[HttpClient]], this is set
     * when `baseURL` is set in [[HttpClientOptions]].
     */
    public kClient?: Client;

    /**
     * Constructs a new [[HttpClient]] instance
     * @param options The http client options to use
     */
    constructor(options?: HttpClientOptions);

    /**
     * Attempts to create a request and returns a response object
     * @param url The URL or request options to use
     * @param method The http method verb or request options to use
     * @param options Any additional options to use
     */
    request(
      url: string | Omit<HttpRequestOptions, 'method'>,
      method?: HttpMethod | Omit<HttpRequestOptions, 'method' | 'url'>,
      options?: Omit<HttpRequestOptions, 'url' | 'method'>
    ): Request;

    // yes
    public get(url: string): Request;
    public get(url: Omit<HttpRequestOptions, 'method'>): Request;
    public get(url: string, options?: Omit<HttpRequestOptions, 'method' | 'url'>): Request;

    public put(url: string): Request;
    public put(url: Omit<HttpRequestOptions, 'method'>): Request;
    public put(url: string, options?: Omit<HttpRequestOptions, 'method' | 'url'>): Request;

    public post(url: string): Request;
    public post(url: Omit<HttpRequestOptions, 'method'>): Request;
    public post(url: string, options?: Omit<HttpRequestOptions, 'method' | 'url'>): Request;

    public head(url: string): Request;
    public head(url: Omit<HttpRequestOptions, 'method'>): Request;
    public head(url: string, options?: Omit<HttpRequestOptions, 'method' | 'url'>): Request;

    public trace(url: string): Request;
    public trace(url: Omit<HttpRequestOptions, 'method'>): Request;
    public trace(url: string, options?: Omit<HttpRequestOptions, 'method' | 'url'>): Request;

    public patch(url: string): Request;
    public patch(url: Omit<HttpRequestOptions, 'method'>): Request;
    public patch(url: string, options?: Omit<HttpRequestOptions, 'method' | 'url'>): Request;

    public delete(url: string): Request;
    public delete(url: Omit<HttpRequestOptions, 'method'>): Request;
    public delete(url: string, options?: Omit<HttpRequestOptions, 'method' | 'url'>): Request;

    public connect(url: string): Request;
    public connect(url: Omit<HttpRequestOptions, 'method'>): Request;
    public connect(url: string, options?: Omit<HttpRequestOptions, 'method' | 'url'>): Request;

    public options(url: string): Request;
    public options(url: Omit<HttpRequestOptions, 'method'>): Request;
    public options(url: string, options?: Omit<HttpRequestOptions, 'method' | 'url'>): Request;

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
    public serializer(contentType: string, definition: Serializer<any>): HttpClient;

    /**
     * Applies a middleware definition to this [HttpClient],
     * if you are creating a new instance, it's best recommended
     * to use the `middleware` option
     *
     * @param definition The middleware definition to inject
     * @returns This instance to chain methods
     */
    public use(middleware: Middleware<MiddlewareType> | MultiMiddleware<MiddlewareType>): HttpClient;
  }

  // ~ Functions ~
  export function get(url: string): Request;
  export function get(url: Omit<HttpRequestOptions, 'method'>): Request;
  export function get(url: string, options?: Omit<HttpRequestOptions, 'method' | 'url'>): Request;

  export function put(url: string): Request;
  export function put(url: Omit<HttpRequestOptions, 'method'>): Request;
  export function put(url: string, options?: Omit<HttpRequestOptions, 'method' | 'url'>): Request;

  export function post(url: string): Request;
  export function post(url: Omit<HttpRequestOptions, 'method'>): Request;
  export function post(url: string, options?: Omit<HttpRequestOptions, 'method' | 'url'>): Request;

  export function head(url: string): Request;
  export function head(url: Omit<HttpRequestOptions, 'method'>): Request;
  export function head(url: string, options?: Omit<HttpRequestOptions, 'method' | 'url'>): Request;

  export function trace(url: string): Request;
  export function trace(url: Omit<HttpRequestOptions, 'method'>): Request;
  export function trace(url: string, options?: Omit<HttpRequestOptions, 'method' | 'url'>): Request;

  export function patch(url: string): Request;
  export function patch(url: Omit<HttpRequestOptions, 'method'>): Request;
  export function patch(url: string, options?: Omit<HttpRequestOptions, 'method' | 'url'>): Request;

  export function del(url: string): Request;
  export function del(url: Omit<HttpRequestOptions, 'method'>): Request;
  export function del(url: string, options?: Omit<HttpRequestOptions, 'method' | 'url'>): Request;

  export function connect(url: string): Request;
  export function connect(url: Omit<HttpRequestOptions, 'method'>): Request;
  export function connect(url: string, options?: Omit<HttpRequestOptions, 'method' | 'url'>): Request;

  export function options(url: string): Request;
  export function options(url: Omit<HttpRequestOptions, 'method'>): Request;
  export function options(url: string, options?: Omit<HttpRequestOptions, 'method' | 'url'>): Request;
}

export = orchid;
export as namespace orchid;
