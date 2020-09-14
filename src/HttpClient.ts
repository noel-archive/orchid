import HttpRequest, { RequestOptions, NullableRequestOptions } from './HttpRequest';
import { Middleware, CycleType } from './middleware';
import MiddlewareContainer from './middleware/Container';
import createRequest from './util/createRequest';
import getOption from './util/getOption';
import { URL } from 'url';
import merge from './util/merge';

const DEFAULT_USER_AGENT = `Orchid (v${require('../package.json').version}, https://github.com/auguwu/Orchid)`;

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

/**
 * The client itself, used for adding middleware or making requests to different APIs
 */
export default class HttpClient {
  /**
   * The middleware container, used to add/get middleware that was injected
   */
  public middleware: MiddlewareContainer;

  /**
   * The custom user agent
   */
  public userAgent: string;

  /** 
   * The default request options
   */
  public defaults: DefaultRequestOptions | null;

  /**
   * Create a new instance of the Http Client
   * @param {HttpClientOptions} options Any additional options
   */
  constructor(options?: HttpClientOptions) {
    this.middleware = new MiddlewareContainer();
    this.userAgent = getOption<HttpClientOptions, string>('agent', DEFAULT_USER_AGENT, options);
    this.defaults = getOption<HttpClientOptions, DefaultRequestOptions | null>('defaults', {}, options);
  
    if (options && options.hasOwnProperty('middleware')) {
      const middleware = options.middleware!;
      if (Array.isArray(middleware)) {
        for (const ware of middleware) this.use(ware);
      }
    }
  }

  /**
   * Adds middleware to the container
   * 
   * Before you make a request, make sure you added all of your middleware
   * or Orchid will add the middleware *when* a request is made, so we can reuse it.
   * You can also append middleware when you construct this http client, in it's constructor.
   * 
   * @param middleware The middleware to append
   * @returns This instance to chain methods
   */
  use(middleware: Middleware) {
    if (middleware.cycleType === CycleType.None) middleware.intertwine.apply(this);
    else this.middleware.add(middleware.name, middleware);

    return this;
  }

  /**
   * Sets an custom user agent
   * @param agent The agent to use
   * @returns This instance to chain methods
   */
  setAgent(agent: string) {
    this.userAgent = agent;
    return this;
  }

  /**
   * Makes a request to a server on the internet
   * @param options The request options
   * @returns A new Request instance to add metadata, etc
   */
  request(options: RequestOptions) {
    return createRequest.call(this, options.url, options.method || 'get', options);
  }

  /**
   * Makes a request as a GET request
   * @param url The URL string or the options itself
   * @param options The request options
   * @returns A new Request instance to add metadata, etc
   */
  get(url: string | RequestOptions, options?: RequestOptions) {
    return createRequest.call(this, url, 'get', options);
  }

  /**
   * Makes a request as a PUT request
   * @param url The URL string or the request options
   * @param options The request options
   * @returns A new Request instance to add metadata, etc
   */
  put(url: string | URL | RequestOptions, options?: RequestOptions) {
    return createRequest.call(this, url, 'put', options);
  }

  /**
   * Makes a request as a POST request
   * @param url The URL string or the request options
   * @param options The request options
   * @returns A new Request instance to add metadata, etc
   */
  post(url: string | URL | RequestOptions, options?: RequestOptions) {
    return createRequest.call(this, url, 'post', options);
  }

  /**
   * Makes a request as a HEAD request
   * @param url The URL string or the request options
   * @param options The request options
   * @returns A new Request instance to add metadata, etc
   */
  head(url: string | URL | RequestOptions, options?: RequestOptions) {
    return createRequest.call(this, url, 'head', options);
  }

  /**
   * Makes a request as a TRACE request
   * @param url The URL string or the request options
   * @param options The request options
   * @returns A new Request instance to add metadata, etc
   */
  trace(url: string | URL | RequestOptions, options?: RequestOptions) {
    return createRequest.call(this, url, 'trace', options);
  }

  /**
   * Makes a request as a DELETE request
   * @param url The URL string or the request options
   * @param options The request options
   * @returns A new Request instance to add metadata, etc
   */
  delete(url: string | URL | RequestOptions, options?: RequestOptions) {
    return createRequest.call(this, url, 'delete', options);
  }

  /**
   * Makes a request as a CONNECT request
   * @param url The URL string or the request options
   * @param options The request options
   * @returns A new Request instance to add metadata, etc
   */
  connect(url: string | URL | RequestOptions, options?: RequestOptions) {
    return createRequest.call(this, url, 'connect', options);
  }

  /**
   * Makes a request as a OPTIONS request
   * @param url The URL string or the request options
   * @param options The request options
   * @returns A new Request instance to add metadata, etc
   */
  options(url: string | URL | RequestOptions, options?: RequestOptions) {
    return createRequest.call(this, url, 'options', options);
  }
}
