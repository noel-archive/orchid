import HttpRequest, { RequestOptions } from './HttpRequest';
import { Middleware, CycleType } from './middleware';
import MiddlewareContainer from './middleware/Container';
import getOption from './util/getOption';
import { URL } from 'url';

const DEFAULT_USER_AGENT = `Orchid (v${require('../package.json').version}, https://github.com/auguwu/Orchid)`;

interface HttpClientOptions {
  middleware?: Middleware[];
  baseUrl?: string;
  agent?: string;
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

  /** The base URL or null if none was provided */
  public baseUrl: string | null;

  /**
   * Create a new instance of the Http Client
   * @param options Any additional options
   */
  constructor(options?: HttpClientOptions) {
    this.middleware = new MiddlewareContainer();
    this.userAgent = getOption<HttpClientOptions, string>('agent', DEFAULT_USER_AGENT, options);
    this.baseUrl = getOption<HttpClientOptions, string | null>('baseUrl', null, options);
  
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
    if (this.baseUrl !== null) {
      if (options.url instanceof URL) {
        const url = new URL(options.url.pathname, this.baseUrl);
        options.url = url;
      } else if (typeof options.url === 'string') {
        const url = new URL(`${this.baseUrl}${options.url.startsWith('/') ? options.url : `/${options.url}`}`);
        options.url = url;
      } else {
        throw new TypeError(`Expected "string" or URL (package: 'url') but gotten ${typeof options.url}`);
      }
    }

    return new HttpRequest(this, options);
  }
}