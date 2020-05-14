// TypeScript definitions for "@augu/orchid"
// Project: https://github.com/auguwu/orchid
// Definitions by:
//     - August <august@augu.dev>

declare module '@augu/orchid' {
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
      /**
       * Enables logging into Orchid
       */
      export const logging: () => orchid.Middleware;

      /**
       * Enables streams into Orchid
       */
      export const streams: () => orchid.Middleware;

      /**
       * Enables compressed data into Orchid
       */
      export const compress: () => orchid.Middleware;
    }

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
    
      /** Any lifecycle hooks to add */
      hooks?: Hooks;
    
      /** Any packets of data to send */
      data?: any;
    
      /** The URL to make the request to */
      url: string | URL;
    }
    
    /** Interface of hooks to implement */
    interface Hooks {
      /**
       * Lifecycle hook when an error occurs (automatically added when the Logging middleware is injected)
       * @param error 
       */
      onError?(error: Error): void;
    }

    interface Logger {
      error(message: string): void;
      warn(message: string): void;
      info(message: string): void;
    }

    interface CompressMiddleware {
      enabled: boolean;
      type: 'gzip' | 'inflate';
    }

    /** Returns the version of Orchid */
    export const version: string;

    /**
     * The methods to use
     */
    export enum HttpMethod {
      Options = 'options',
      Connect = 'connect',
      Delete = 'delete',
      Trace = 'trace',
      Head = 'head',
      Post = 'post',
      Put = 'put',
      Get = 'get'
    }

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
      get(name: 'compress'): CompressMiddleware | null;

      /**
       * Gets the streams data middleware
       */
      get(name: 'streams'): boolean | null;

      /**
       * Gets the selected middleware from the container
       * @param name The name of the container
       */
      get(name: string): any;

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

      /** Any lifecycle hooks to add */
      public hooks: Hooks;

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
       * Adds a query parameter to the URL
       * @param name An object of key-value pairs of the queries
       * @param value The value (if added)
       */
      query(name: string | { [x: string]: string }, value?: string): this;

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
       */
      header(name: string | { [x: string]: string }, value?: any): this;

      /**
       * Sends data to the server
       * @param packet The data packet to send
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
       * Returns a stream
       */
      stream(): IncomingMessage;
    }
  }

  export = orchid;
}