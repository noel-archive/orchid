import HttpRequest, { RequestOptions } from './HttpRequest';
import MiddlewareContainer from './middleware/Container';
import { Middleware } from './middleware';

/**
 * The client itself, used for adding middleware or making requests to different APIs
 */
export default class HttpClient {
  /**
   * The middleware container, used to add/get middleware that was injected
   */
  public middleware: MiddlewareContainer;

  /**
   * Create a new instance of the Http Client
   */
  constructor() {
    this.middleware = new MiddlewareContainer();
  }

  /**
   * Adds middleware to the container
   * 
   * @warn Before you make a request, make sure you added all of your middleware
   * or Orchird will add the middleware *when* a request is made, so we can reuse it
   */
  use(middleware: Middleware) {
    middleware.intertwine.bind(this)();
    return this;
  }

  /**
   * Makes a request to a server on the internet
   * @param options The request options
   */
  request(options: RequestOptions) {
    return new HttpRequest(this, options);
  }
}