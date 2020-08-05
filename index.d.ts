// TypeScript definitions for "@augu/orchid"
// Project: https://github.com/auguwu/orchid
// Definitions by:
//     - August <august@augu.dev>

declare module '@augu/orchid' {
  import { IncomingMessage, IncomingHttpHeaders } from 'http';
  import { Deflate, Gunzip } from 'zlib';
  import { URL } from 'url';

  /**
   * Entrypoint of Orchid
   */
  namespace orchid {
    /**
     * The middleware included into Orchid
     */
    namespace middleware {
      /**
       * A binding function to add your own custom attributes for messages
       * @param ns The namespace that it's using
       * @param level The log level
       * @param message The message
       */
      type LogBinding = (ns: string, level: 'error' | 'warn' | 'info', message: string) => string;

      /**
       * Caller function to call any logging library
       * @param level The level to use
       * @param message The message
       */
      type CallerFunction = (level: 'error' | 'warn' | 'info', message: string) => void;

      interface LogOptions {
        /** If we should actually log it or not */
        useConsole?: boolean;

        /** The default namespace of the logger, default is `Orchid` */
        namespace?: string;

        /** The coller function (`useConsole` must be false to use it) */
        caller?: CallerFunction; // eslint-disable-line

        /**
         * A binding function to add your own custom attributes for messages
         */
        binding?: LogBinding;
      }

      /**
       * Enables logging into Orchid
       */
      export function logging(options?: LogOptions): orchid.Middleware;

      /**
       * Enables streams into Orchid
       */
      export function streams(): orchid.Middleware;

      /**
       * Enables compressed data into Orchid
       */
      export function compress(): orchid.Middleware;

      /**
       * Enables form data into Orchid
       */
      export function forms(): orchid.Middleware;
    }

    type HttpMethod = 'options' | 'connect' | 'delete' | 'trace' | 'head' | 'post' | 'put' | 'get'
      | 'OPTIONS' | 'CONNECT' | 'DELETE' | 'TRACE' | 'HEAD' | 'POST' | 'PUT' | 'GET';

    interface Middleware {
      intertwine(this: orchid.HttpClient): void;
      cycleType: CycleType;
      name: string;
    }

    interface RequestOptions {
      /** If we should follow redirects */
      followRedirects?: boolean;
    
      /** If we should compress the data */
      compress?: boolean;
    
      /** An amount of attempts before closing this request */
      attempts?: number;
    
      /** Any additional headers to add (you can add more with `HttpRequest#header`) */
      headers?: { [x: string]: any };
    
      /** The abort timeout until the request times out */
      timeout?: number;
    
      /** The method to use */
      method: HttpMethod;
    
      /** Make this request into a stream */
      stream?: boolean;
    
      /** Any packets of data to send */
      data?: any;
    
      /** The URL to make the request to */
      url: string | URL;
    }

    interface Logger {
      error(message: string): void;
      warn(message: string): void;
      info(message: string): void;
    }

    export enum CycleType {
      Execute = 'execute',
      Done = 'done',
      None = 'none'
    }

    interface HttpClientOptions {
      middleware?: Middleware[];
      defaults?: DefaultRequestOptions;
      agent?: string;
    }
    
    interface DefaultRequestOptions {
      followRedirects?: boolean;
      headers?: { [x: string]: any }
      timeout?: number;
      baseUrl?: string;
    }

    /** Returns the version of Orchid */
    export const version: string;

    /** The base client for making requests and adding middleware to Orchid */
    export class HttpClient {
      /**
       * Create a new instance of the Http Client
       * @param options Any additional options
       */
      constructor(options?: HttpClientOptions);

      /** The middleware container */
      public middleware: orchid.Container;

      /** The custom user agent */
      public userAgent: string;

      /** The base URL */
      public baseUrl: string | null;

      /**
       * Injects middleware to the Orchid instance
       * @param middleware Middleware instance
       */
      use(middleware: orchid.Middleware): this;

      /**
       * Makes a request
       * @param options The options to use
       */
      request(options: orchid.RequestOptions): orchid.HttpRequest;
    }

    /** The middleware container itself */
    class Container {
      /**
       * Gets the logger middleware
       */
      get(name: 'logger'): Logger | null;

      /**
       * Gets the compressed data middleware
       */
      get(name: 'compress'): boolean;

      /**
       * Gets the streams data middleware
       */
      get(name: 'streams'): boolean;

      /**
       * Gets the form data middleware
       */
      get(name: 'form'): boolean;

      /**
       * Gets the selected middleware from the container
       * @param name The name of the container
       */
      get<T = any>(name: string): T | null;

      /**
       * Adds the specified middleware to the container
       * @param name The name of the middleware
       * @param data The middleware itself
       */
      add<T = any>(name: string, data: T): void;

      /**
       * Checks if this container contains the middleware that was[n't] injected
       * @param name The middleware's name
       */
      has(name: string): boolean;
    }

    class HttpRequest extends Promise<HttpResponse> {
      /** If we should follow redirects */
      public followRedirects: boolean;

      /** If we should compress the data */
      public compressData: boolean;

      /** An amount of attempts before closing this request */
      public attempts: number;

      /** Any additional headers to add (you can add more with `HttpRequest#header`) */
      public headers: { [x: string]: any };

      /** The abort timeout until the request times out */
      public timeout: number | null;

      /** If this request should return the HTTP stream */
      public streaming: boolean;

      /** The data to send as */
      public sendDataAs?: 'json' | 'buffer' | 'form' | 'string';

      /** The method to use */
      public method: HttpMethod;

      /** Any packets of data to send */
      public data: any;

      /** The URL to make the request to */
      public url: URL;

      /**
       * Make this request into a stream (must add the Streams middleware or it'll error!)
       */
      stream(): this;

      /**
       * Make this request compress data (must add the Compress middleware)
       */
      compress(): this;

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
       * Sends data to the server
       * @param packet The data packet to send
       */
      body(packet: any): this;

      /**
       * Sets a timeout to wait for
       * @param timeout The timeout to wait for
       */
      setTimeout(timeout: number): this;

      /**
       * If we should follow redirects
       */
      redirect(): this;
    }

    class HttpResponse {
      /** Returns the status of the response */
      public statusCode: number;

      /** The headers that were fetched */
      public headers: IncomingHttpHeaders;

      /** Returns a prettified version of the status */
      public status: string;

      /** If it was successful or not */
      public successful: boolean;

      /**
       * Turns the body into a JSON response
       */
      json<T = any>(): T;

      /**
       * Turns the body into a string
       */
      text(): string;

      /**
       * Returns the HTTP stream or the zlib stream (if it was compressed)
       */
      stream(): IncomingMessage | Deflate | Gunzip;
    }
  }

  export = orchid;
}