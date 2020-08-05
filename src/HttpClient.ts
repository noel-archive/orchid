import HttpRequest, { RequestOptions, NullableRequestOptions } from './HttpRequest';
import { Middleware, CycleType } from './middleware';
import MiddlewareContainer from './middleware/Container';
import getOption from './util/getOption';
import { URL } from 'url';
import { url } from 'inspector';

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
   * @param options Any additional options
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
   * or Orchird will add the middleware *when* a request is made, so we can reuse it.
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
    if (this.defaults !== null) {
      options = Object.assign<NullableRequestOptions, RequestOptions>({
        followRedirects: getOption('followRedirects', false, this.defaults),
        headers: getOption('headers', {}, this.defaults),
        timeout: getOption('timeout', 30000, this.defaults)
      }, options);

      if (this.defaults.baseUrl !== undefined) {
        if (options.url instanceof URL) {
          options.url = new URL(options.url.pathname, this.defaults.baseUrl);
        } else if (typeof options.url === 'string') {
          options.url = new URL(`${this.defaults.baseUrl}${options.url.startsWith('/') ? options.url : `/${options.url}`}`);
        } else {
          throw new TypeError(`Expected "string" or URL (package: 'url') but gotten ${typeof options.url}`);
        }
      }
    }

    return new HttpRequest(this, options);
  }
}