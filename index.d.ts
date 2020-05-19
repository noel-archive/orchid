// TypeScript definitions for "@augu/orchid"
// Project: https://github.com/auguwu/orchid
// Definitions by:
//     - August <august@augu.dev>

declare module '@augu/orchid' {
  import { Deflate, Gunzip } from 'zlib';
  import { IncomingMessage } from 'http';
  import { URL } from 'url';

  /**
   * Entrypoint of Orchid
   */
  namespace orchid {
    /**
     * The middleware included into Orchid
     */
    namespace middleware {
      interface LogOptions {
        /**
         * Add a custom binding function for logging
         * @param level The level to use
         * @param message The message that Orchid sends
         */
        binding?(level: 'error' | 'warn' | 'info', message: string): string;
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
    }

    type HttpMethod= 'options' | 'connect' | 'delete' | 'trace' | 'head' | 'post' | 'put' | 'get'
      | 'OPTIONS' | 'CONNECT' | 'DELETE' | 'TRACE' | 'HEAD' | 'POST' | 'PUT' | 'GET';

    interface Middleware {
      intertwine(this: orchid.HttpClient): void;
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

    /** Returns the version of Orchid */
    export const version: string;

    /** The base client for making requests and adding middleware to Orchid */
    export class HttpClient {
      /** Constructs a new instance of the Http Client */
      constructor();

      /** The middleware container */
      public middleware: orchid.Container;

      /**
       * Adds middleware to Orchid
       * @param middleware The middleware to add
       * @returns This client to chain methods
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
      get(name: 'compress'): boolean | null;

      /**
       * Gets the streams data middleware
       */
      get(name: 'streams'): boolean | null;

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

    class HttpRequest {
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
       * @param sda Send Data As
       */
      body(packet: any, sda?: 'buffer' | 'json' | 'form'): this;

      /**
       * Sets a timeout to wait for
       * @param timeout The timeout to wait for
       */
      setTimeout(timeout: number): this;

      /**
       * If we should follow redirects
       */
      redirect(): this;

      /**
       * Execute the request
       */
      execute(): Promise<orchid.HttpResponse>;
    }

    class HttpResponse {
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