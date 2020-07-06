import HttpRequest, { RequestOptions } from './HttpRequest';
import MiddlewareContainer from './middleware/Container';
import { Middleware, CycleType } from './middleware';

const DEFAULT_USER_AGENT = `Orchid (v${require('../package.json').version}, https://github.com/auguwu/Orchid)`;

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
   * Creates a new instance of the Http Client
   * @param agent The user agent to set
   */
  constructor(agent?: string);
  
  /**
   * Creates a new instance of the Http Client
   * @param middleware Any middleware to inject
   */
  constructor(middleware?: Middleware[]);

  /**
   * Create a new instance of the Http Client
   * @param middleware Any middleware to inject
   * @param agent The agent to use
   */
  constructor(middleware?: Middleware[] | string, agent?: string) {
    this.middleware = new MiddlewareContainer();
    this.userAgent = agent 
      ? agent 
      : middleware 
        ? !Array.isArray(middleware) 
          ? middleware
          : DEFAULT_USER_AGENT
        : DEFAULT_USER_AGENT;
  
    if (middleware) {
      if (Array.isArray(middleware)) {
        for (const ware of middleware) this.use(ware);
      }
    }
  }

  /**
   * Adds middleware to the container
   * 
   * @param middleware The middleware to append
   * @warn Before you make a request, make sure you added all of your middleware
   * or Orchird will add the middleware *when* a request is made, so we can reuse it.
   * You can also append middleware when you construct this http client, in it's constructor.
   * 
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
   * @returns A new request instance
   * to add metadata, etc
   */
  request(options: RequestOptions) {
    return new HttpRequest(this, options);
  }
}