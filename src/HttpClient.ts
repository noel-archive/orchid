import HttpRequest, { RequestOptions, NullableRequestOptions } from './HttpRequest';
import { Middleware, CycleType } from './middleware';
import MiddlewareContainer from './middleware/Container';
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
    if (this.defaults !== null) {
      options = merge<NullableRequestOptions, RequestOptions>(options, {
        followRedirects: getOption('followRedirects', false, this.defaults),
        headers: getOption('headers', {}, this.defaults),
        timeout: getOption('timeout', 30000, this.defaults)
      });

      if (this.defaults.baseUrl !== undefined) {
        if (options.url instanceof URL) {
          options.url = new URL(options.url.pathname, this.defaults.baseUrl);
        } else if (typeof options.url === 'string') {
          options.url = new URL(options.url, this.defaults.baseUrl);
        } else {
          throw new TypeError(`Expected "string" or URL (package: 'url') but gotten ${typeof options.url}`);
        }
      }
    }

    return new HttpRequest(this, options);
  }

  /**
   * Makes a request as a GET request
   * @param url The URL string or the options itself
   * @param options The request options
   * @returns A new Request instance to add metadata, etc
   */
  get(url: string | RequestOptions, options?: RequestOptions) {
    if ((typeof url === 'string' || url instanceof URL) && options === undefined) {
      let newUrl: URL | string = url;

      if (this.defaults !== null) {
        if (this.defaults.hasOwnProperty('baseUrl')) {
          if (url instanceof URL) newUrl = new URL(url.pathname, this.defaults.baseUrl);
          else if (typeof url === 'string') newUrl = new URL(`${this.defaults.baseUrl}${url.startsWith('/') ? url : `/${url}`}`);
          else throw new TypeError(`Expected "string" or URL (package: 'url') but gotten ${typeof url}`);
        }
      }

      return new HttpRequest(this, { method: 'GET', url: newUrl });
    } else if ((typeof url === 'string' || url instanceof URL) && options !== undefined) {
      if (this.defaults !== null) {
        options = Object.assign<NullableRequestOptions, RequestOptions>({
          followRedirects: getOption('followRedirects', false, this.defaults),
          headers: getOption('headers', {}, this.defaults),
          timeout: getOption('timeout', 30000, this.defaults)
        }, options);
  
        if (this.defaults.baseUrl !== undefined) {
          if (url instanceof URL) {
            options.url = new URL(url.pathname, this.defaults.baseUrl);
          } else if (typeof url === 'string') {
            options.url = new URL(`${this.defaults.baseUrl}${url.startsWith('/') ? url : `/${url}`}`);
          } else {
            throw new TypeError(`Expected "string" or URL (package: 'url') but gotten ${typeof url}`);
          }
        }
      }
  
      return new HttpRequest(this, { method: 'GET', ...options });
    } else if (!(url instanceof URL) && url instanceof Object && options === undefined) {
      if (this.defaults !== null) {
        const opts = Object.assign<NullableRequestOptions, RequestOptions>({
          followRedirects: getOption('followRedirects', false, this.defaults),
          headers: getOption('headers', {}, this.defaults),
          timeout: getOption('timeout', 30000, this.defaults)
        }, url);
  
        if (this.defaults.baseUrl !== undefined) {
          if (opts.url instanceof URL) {
            opts.url = new URL(opts.url.pathname, this.defaults.baseUrl);
          } else if (typeof opts.url === 'string') {
            opts.url = new URL(`${this.defaults.baseUrl}${opts.url.startsWith('/') ? opts.url : `/${opts.url}`}`);
          } else {
            throw new TypeError(`Expected "string" or URL (package: 'url') but gotten ${typeof opts.url}`);
          }
        }
      }
  
      return new HttpRequest(this, { method: 'GET', ...url });
    } else if (url instanceof Object && options !== undefined) {
      throw new TypeError('Parameter `options` shouldn\'t be added in');
    } else {
      throw new TypeError(`Expecting 'string', RequestOptions, or an instanceof URL but gotten ${typeof url} (options: ${typeof options})`);
    }
  }

  /**
   * Makes a request as a PUT request
   * @param url The URL string or the request options
   * @param options The request options
   * @returns A new Request instance to add metadata, etc
   */
  put(url: string | URL | RequestOptions, options?: RequestOptions) {
    if ((typeof url === 'string' || url instanceof URL) && options === undefined) {
      let newUrl: URL | string = url;

      if (this.defaults !== null) {
        if (this.defaults.hasOwnProperty('baseUrl')) {
          if (url instanceof URL) newUrl = new URL(url.pathname, this.defaults.baseUrl);
          else if (typeof url === 'string') newUrl = new URL(`${this.defaults.baseUrl}${url.startsWith('/') ? url : `/${url}`}`);
          else throw new TypeError(`Expected "string" or URL (package: 'url') but gotten ${typeof url}`);
        }
      }

      return new HttpRequest(this, { method: 'PUT', url: newUrl });
    } else if ((typeof url === 'string' || url instanceof URL) && options !== undefined) {
      if (this.defaults !== null) {
        options = Object.assign<NullableRequestOptions, RequestOptions>({
          followRedirects: getOption('followRedirects', false, this.defaults),
          headers: getOption('headers', {}, this.defaults),
          timeout: getOption('timeout', 30000, this.defaults)
        }, options);
  
        if (this.defaults.baseUrl !== undefined) {
          if (url instanceof URL) {
            options.url = new URL(url.pathname, this.defaults.baseUrl);
          } else if (typeof url === 'string') {
            options.url = new URL(`${this.defaults.baseUrl}${url.startsWith('/') ? url : `/${url}`}`);
          } else {
            throw new TypeError(`Expected "string" or URL (package: 'url') but gotten ${typeof url}`);
          }
        }
      }
  
      return new HttpRequest(this, { method: 'PUT', ...options });
    } else if (!(url instanceof URL) && url instanceof Object && options === undefined) {
      if (this.defaults !== null) {
        const opts = Object.assign<NullableRequestOptions, RequestOptions>({
          followRedirects: getOption('followRedirects', false, this.defaults),
          headers: getOption('headers', {}, this.defaults),
          timeout: getOption('timeout', 30000, this.defaults)
        }, url);
  
        if (this.defaults.baseUrl !== undefined) {
          if (opts.url instanceof URL) {
            opts.url = new URL(opts.url.pathname, this.defaults.baseUrl);
          } else if (typeof opts.url === 'string') {
            opts.url = new URL(`${this.defaults.baseUrl}${opts.url.startsWith('/') ? opts.url : `/${opts.url}`}`);
          } else {
            throw new TypeError(`Expected "string" or URL (package: 'url') but gotten ${typeof opts.url}`);
          }
        }
      }
  
      return new HttpRequest(this, { method: 'PUT', ...url });
    } else if (url instanceof Object && options !== undefined) {
      throw new TypeError('Parameter `options` shouldn\'t be added in');
    } else {
      throw new TypeError(`Expecting 'string', RequestOptions, or an instanceof URL but gotten ${typeof url} (options: ${typeof options})`);
    }
  }

  /**
   * Makes a request as a POST request
   * @param url The URL string or the request options
   * @param options The request options
   * @returns A new Request instance to add metadata, etc
   */
  post(url: string | URL | RequestOptions, options?: RequestOptions) {
    if ((typeof url === 'string' || url instanceof URL) && options === undefined) {
      let newUrl: URL | string = url;

      if (this.defaults !== null) {
        if (this.defaults.hasOwnProperty('baseUrl')) {
          if (url instanceof URL) newUrl = new URL(url.pathname, this.defaults.baseUrl);
          else if (typeof url === 'string') newUrl = new URL(`${this.defaults.baseUrl}${url.startsWith('/') ? url : `/${url}`}`);
          else throw new TypeError(`Expected "string" or URL (package: 'url') but gotten ${typeof url}`);
        }
      }

      return new HttpRequest(this, { method: 'POST', url: newUrl });
    } else if ((typeof url === 'string' || url instanceof URL) && options !== undefined) {
      if (this.defaults !== null) {
        options = Object.assign<NullableRequestOptions, RequestOptions>({
          followRedirects: getOption('followRedirects', false, this.defaults),
          headers: getOption('headers', {}, this.defaults),
          timeout: getOption('timeout', 30000, this.defaults)
        }, options);
  
        if (this.defaults.baseUrl !== undefined) {
          if (url instanceof URL) {
            options.url = new URL(url.pathname, this.defaults.baseUrl);
          } else if (typeof url === 'string') {
            options.url = new URL(`${this.defaults.baseUrl}${url.startsWith('/') ? url : `/${url}`}`);
          } else {
            throw new TypeError(`Expected "string" or URL (package: 'url') but gotten ${typeof url}`);
          }
        }
      }
  
      return new HttpRequest(this, { method: 'POST', ...options });
    } else if (!(url instanceof URL) && url instanceof Object && options === undefined) {
      if (this.defaults !== null) {
        const opts = Object.assign<NullableRequestOptions, RequestOptions>({
          followRedirects: getOption('followRedirects', false, this.defaults),
          headers: getOption('headers', {}, this.defaults),
          timeout: getOption('timeout', 30000, this.defaults)
        }, url);
  
        if (this.defaults.baseUrl !== undefined) {
          if (opts.url instanceof URL) {
            opts.url = new URL(opts.url.pathname, this.defaults.baseUrl);
          } else if (typeof opts.url === 'string') {
            opts.url = new URL(`${this.defaults.baseUrl}${opts.url.startsWith('/') ? opts.url : `/${opts.url}`}`);
          } else {
            throw new TypeError(`Expected "string" or URL (package: 'url') but gotten ${typeof opts.url}`);
          }
        }
      }
  
      return new HttpRequest(this, { method: 'POST', ...url });
    } else if (url instanceof Object && options !== undefined) {
      throw new TypeError('Parameter `options` shouldn\'t be added in');
    } else {
      throw new TypeError(`Expecting 'string', RequestOptions, or an instanceof URL but gotten ${typeof url} (options: ${typeof options})`);
    }
  }

  /**
   * Makes a request as a OPTIONS request
   * @param url The URL string or the request options
   * @param options The request options
   * @returns A new Request instance to add metadata, etc
   */
  head(url: string | URL | RequestOptions, options?: RequestOptions) {
    if ((typeof url === 'string' || url instanceof URL) && options === undefined) {
      let newUrl: URL | string = url;

      if (this.defaults !== null) {
        if (this.defaults.hasOwnProperty('baseUrl')) {
          if (url instanceof URL) newUrl = new URL(url.pathname, this.defaults.baseUrl);
          else if (typeof url === 'string') newUrl = new URL(`${this.defaults.baseUrl}${url.startsWith('/') ? url : `/${url}`}`);
          else throw new TypeError(`Expected "string" or URL (package: 'url') but gotten ${typeof url}`);
        }
      }

      return new HttpRequest(this, { method: 'HEAD', url: newUrl });
    } else if ((typeof url === 'string' || url instanceof URL) && options !== undefined) {
      if (this.defaults !== null) {
        options = Object.assign<NullableRequestOptions, RequestOptions>({
          followRedirects: getOption('followRedirects', false, this.defaults),
          headers: getOption('headers', {}, this.defaults),
          timeout: getOption('timeout', 30000, this.defaults)
        }, options);
  
        if (this.defaults.baseUrl !== undefined) {
          if (url instanceof URL) {
            options.url = new URL(url.pathname, this.defaults.baseUrl);
          } else if (typeof url === 'string') {
            options.url = new URL(`${this.defaults.baseUrl}${url.startsWith('/') ? url : `/${url}`}`);
          } else {
            throw new TypeError(`Expected "string" or URL (package: 'url') but gotten ${typeof url}`);
          }
        }
      }
  
      return new HttpRequest(this, { method: 'HEAD', ...options });
    } else if (!(url instanceof URL) && url instanceof Object && options === undefined) {
      if (this.defaults !== null) {
        const opts = Object.assign<NullableRequestOptions, RequestOptions>({
          followRedirects: getOption('followRedirects', false, this.defaults),
          headers: getOption('headers', {}, this.defaults),
          timeout: getOption('timeout', 30000, this.defaults)
        }, url);
  
        if (this.defaults.baseUrl !== undefined) {
          if (opts.url instanceof URL) {
            opts.url = new URL(opts.url.pathname, this.defaults.baseUrl);
          } else if (typeof opts.url === 'string') {
            opts.url = new URL(`${this.defaults.baseUrl}${opts.url.startsWith('/') ? opts.url : `/${opts.url}`}`);
          } else {
            throw new TypeError(`Expected "string" or URL (package: 'url') but gotten ${typeof opts.url}`);
          }
        }
      }
  
      return new HttpRequest(this, { method: 'HEAD', ...url });
    } else if (url instanceof Object && options !== undefined) {
      throw new TypeError('Parameter `options` shouldn\'t be added in');
    } else {
      throw new TypeError(`Expecting 'string', RequestOptions, or an instanceof URL but gotten ${typeof url} (options: ${typeof options})`);
    }
  }

  /**
   * Makes a request as a TRACE request
   * @param url The URL string or the request options
   * @param options The request options
   * @returns A new Request instance to add metadata, etc
   */
  trace(url: string | URL | RequestOptions, options?: RequestOptions) {
    if ((typeof url === 'string' || url instanceof URL) && options === undefined) {
      let newUrl: URL | string = url;

      if (this.defaults !== null) {
        if (this.defaults.hasOwnProperty('baseUrl')) {
          if (url instanceof URL) newUrl = new URL(url.pathname, this.defaults.baseUrl);
          else if (typeof url === 'string') newUrl = new URL(`${this.defaults.baseUrl}${url.startsWith('/') ? url : `/${url}`}`);
          else throw new TypeError(`Expected "string" or URL (package: 'url') but gotten ${typeof url}`);
        }
      }

      return new HttpRequest(this, { method: 'TRACE', url: newUrl });
    } else if ((typeof url === 'string' || url instanceof URL) && options !== undefined) {
      if (this.defaults !== null) {
        options = Object.assign<NullableRequestOptions, RequestOptions>({
          followRedirects: getOption('followRedirects', false, this.defaults),
          headers: getOption('headers', {}, this.defaults),
          timeout: getOption('timeout', 30000, this.defaults)
        }, options);
  
        if (this.defaults.baseUrl !== undefined) {
          if (url instanceof URL) {
            options.url = new URL(url.pathname, this.defaults.baseUrl);
          } else if (typeof url === 'string') {
            options.url = new URL(`${this.defaults.baseUrl}${url.startsWith('/') ? url : `/${url}`}`);
          } else {
            throw new TypeError(`Expected "string" or URL (package: 'url') but gotten ${typeof url}`);
          }
        }
      }
  
      return new HttpRequest(this, { method: 'TRACE', ...options });
    } else if (!(url instanceof URL) && url instanceof Object && options === undefined) {
      if (this.defaults !== null) {
        const opts = Object.assign<NullableRequestOptions, RequestOptions>({
          followRedirects: getOption('followRedirects', false, this.defaults),
          headers: getOption('headers', {}, this.defaults),
          timeout: getOption('timeout', 30000, this.defaults)
        }, url);
  
        if (this.defaults.baseUrl !== undefined) {
          if (opts.url instanceof URL) {
            opts.url = new URL(opts.url.pathname, this.defaults.baseUrl);
          } else if (typeof opts.url === 'string') {
            opts.url = new URL(`${this.defaults.baseUrl}${opts.url.startsWith('/') ? opts.url : `/${opts.url}`}`);
          } else {
            throw new TypeError(`Expected "string" or URL (package: 'url') but gotten ${typeof opts.url}`);
          }
        }
      }
  
      return new HttpRequest(this, { method: 'TRACE', ...url });
    } else if (url instanceof Object && options !== undefined) {
      throw new TypeError('Parameter `options` shouldn\'t be added in');
    } else {
      throw new TypeError(`Expecting 'string', RequestOptions, or an instanceof URL but gotten ${typeof url} (options: ${typeof options})`);
    }
  }

  /**
   * Makes a request as a DELETE request
   * @param url The URL string or the request options
   * @param options The request options
   * @returns A new Request instance to add metadata, etc
   */
  delete(url: string | URL | RequestOptions, options?: RequestOptions) {
    if ((typeof url === 'string' || url instanceof URL) && options === undefined) {
      let newUrl: URL | string = url;

      if (this.defaults !== null) {
        if (this.defaults.hasOwnProperty('baseUrl')) {
          if (url instanceof URL) newUrl = new URL(url.pathname, this.defaults.baseUrl);
          else if (typeof url === 'string') newUrl = new URL(`${this.defaults.baseUrl}${url.startsWith('/') ? url : `/${url}`}`);
          else throw new TypeError(`Expected "string" or URL (package: 'url') but gotten ${typeof url}`);
        }
      }

      return new HttpRequest(this, { method: 'DELETE', url: newUrl });
    } else if ((typeof url === 'string' || url instanceof URL) && options !== undefined) {
      if (this.defaults !== null) {
        options = Object.assign<NullableRequestOptions, RequestOptions>({
          followRedirects: getOption('followRedirects', false, this.defaults),
          headers: getOption('headers', {}, this.defaults),
          timeout: getOption('timeout', 30000, this.defaults)
        }, options);
  
        if (this.defaults.baseUrl !== undefined) {
          if (url instanceof URL) {
            options.url = new URL(url.pathname, this.defaults.baseUrl);
          } else if (typeof url === 'string') {
            options.url = new URL(`${this.defaults.baseUrl}${url.startsWith('/') ? url : `/${url}`}`);
          } else {
            throw new TypeError(`Expected "string" or URL (package: 'url') but gotten ${typeof url}`);
          }
        }
      }
  
      return new HttpRequest(this, { method: 'DELETE', ...options });
    } else if (!(url instanceof URL) && url instanceof Object && options === undefined) {
      if (this.defaults !== null) {
        const opts = Object.assign<NullableRequestOptions, RequestOptions>({
          followRedirects: getOption('followRedirects', false, this.defaults),
          headers: getOption('headers', {}, this.defaults),
          timeout: getOption('timeout', 30000, this.defaults)
        }, url);
  
        if (this.defaults.baseUrl !== undefined) {
          if (opts.url instanceof URL) {
            opts.url = new URL(opts.url.pathname, this.defaults.baseUrl);
          } else if (typeof opts.url === 'string') {
            opts.url = new URL(`${this.defaults.baseUrl}${opts.url.startsWith('/') ? opts.url : `/${opts.url}`}`);
          } else {
            throw new TypeError(`Expected "string" or URL (package: 'url') but gotten ${typeof opts.url}`);
          }
        }
      }
  
      return new HttpRequest(this, { method: 'DELETE', ...url });
    } else if (url instanceof Object && options !== undefined) {
      throw new TypeError('Parameter `options` shouldn\'t be added in');
    } else {
      throw new TypeError(`Expecting 'string', RequestOptions, or an instanceof URL but gotten ${typeof url} (options: ${typeof options})`);
    }
  }

  /**
   * Makes a request as a CONNECT request
   * @param url The URL string or the request options
   * @param options The request options
   * @returns A new Request instance to add metadata, etc
   */
  connect(url: string | URL | RequestOptions, options?: RequestOptions) {
    if ((typeof url === 'string' || url instanceof URL) && options === undefined) {
      let newUrl: URL | string = url;

      if (this.defaults !== null) {
        if (this.defaults.hasOwnProperty('baseUrl')) {
          if (url instanceof URL) newUrl = new URL(url.pathname, this.defaults.baseUrl);
          else if (typeof url === 'string') newUrl = new URL(`${this.defaults.baseUrl}${url.startsWith('/') ? url : `/${url}`}`);
          else throw new TypeError(`Expected "string" or URL (package: 'url') but gotten ${typeof url}`);
        }
      }

      return new HttpRequest(this, { method: 'CONNECT', url: newUrl });
    } else if ((typeof url === 'string' || url instanceof URL) && options !== undefined) {
      if (this.defaults !== null) {
        options = Object.assign<NullableRequestOptions, RequestOptions>({
          followRedirects: getOption('followRedirects', false, this.defaults),
          headers: getOption('headers', {}, this.defaults),
          timeout: getOption('timeout', 30000, this.defaults)
        }, options);
  
        if (this.defaults.baseUrl !== undefined) {
          if (url instanceof URL) {
            options.url = new URL(url.pathname, this.defaults.baseUrl);
          } else if (typeof url === 'string') {
            options.url = new URL(`${this.defaults.baseUrl}${url.startsWith('/') ? url : `/${url}`}`);
          } else {
            throw new TypeError(`Expected "string" or URL (package: 'url') but gotten ${typeof url}`);
          }
        }
      }
  
      return new HttpRequest(this, { method: 'CONNECT', ...options });
    } else if (!(url instanceof URL) && url instanceof Object && options === undefined) {
      if (this.defaults !== null) {
        const opts = Object.assign<NullableRequestOptions, RequestOptions>({
          followRedirects: getOption('followRedirects', false, this.defaults),
          headers: getOption('headers', {}, this.defaults),
          timeout: getOption('timeout', 30000, this.defaults)
        }, url);
  
        if (this.defaults.baseUrl !== undefined) {
          if (opts.url instanceof URL) {
            opts.url = new URL(opts.url.pathname, this.defaults.baseUrl);
          } else if (typeof opts.url === 'string') {
            opts.url = new URL(`${this.defaults.baseUrl}${opts.url.startsWith('/') ? opts.url : `/${opts.url}`}`);
          } else {
            throw new TypeError(`Expected "string" or URL (package: 'url') but gotten ${typeof opts.url}`);
          }
        }
      }
  
      return new HttpRequest(this, { method: 'CONNECT', ...url });
    } else if (url instanceof Object && options !== undefined) {
      throw new TypeError('Parameter `options` shouldn\'t be added in');
    } else {
      throw new TypeError(`Expecting 'string', RequestOptions, or an instanceof URL but gotten ${typeof url} (options: ${typeof options})`);
    }
  }

  /**
   * Makes a request as a OPTIONS request
   * @param url The URL string or the request options
   * @param options The request options
   * @returns A new Request instance to add metadata, etc
   */
  options(url: string | URL | RequestOptions, options?: RequestOptions) {
    if ((typeof url === 'string' || url instanceof URL) && options === undefined) {
      let newUrl: URL | string = url;

      if (this.defaults !== null) {
        if (this.defaults.hasOwnProperty('baseUrl')) {
          if (url instanceof URL) newUrl = new URL(url.pathname, this.defaults.baseUrl);
          else if (typeof url === 'string') newUrl = new URL(`${this.defaults.baseUrl}${url.startsWith('/') ? url : `/${url}`}`);
          else throw new TypeError(`Expected "string" or URL (package: 'url') but gotten ${typeof url}`);
        }
      }

      return new HttpRequest(this, { method: 'OPTIONS', url: newUrl });
    } else if ((typeof url === 'string' || url instanceof URL) && options !== undefined) {
      if (this.defaults !== null) {
        options = Object.assign<NullableRequestOptions, RequestOptions>({
          followRedirects: getOption('followRedirects', false, this.defaults),
          headers: getOption('headers', {}, this.defaults),
          timeout: getOption('timeout', 30000, this.defaults)
        }, options);
  
        if (this.defaults.baseUrl !== undefined) {
          if (url instanceof URL) {
            options.url = new URL(url.pathname, this.defaults.baseUrl);
          } else if (typeof url === 'string') {
            options.url = new URL(`${this.defaults.baseUrl}${url.startsWith('/') ? url : `/${url}`}`);
          } else {
            throw new TypeError(`Expected "string" or URL (package: 'url') but gotten ${typeof url}`);
          }
        }
      }
  
      return new HttpRequest(this, { method: 'OPTIONS', ...options });
    } else if (!(url instanceof URL) && url instanceof Object && options === undefined) {
      if (this.defaults !== null) {
        const opts = Object.assign<NullableRequestOptions, RequestOptions>({
          followRedirects: getOption('followRedirects', false, this.defaults),
          headers: getOption('headers', {}, this.defaults),
          timeout: getOption('timeout', 30000, this.defaults)
        }, url);
  
        if (this.defaults.baseUrl !== undefined) {
          if (opts.url instanceof URL) {
            opts.url = new URL(opts.url.pathname, this.defaults.baseUrl);
          } else if (typeof opts.url === 'string') {
            opts.url = new URL(`${this.defaults.baseUrl}${opts.url.startsWith('/') ? opts.url : `/${opts.url}`}`);
          } else {
            throw new TypeError(`Expected "string" or URL (package: 'url') but gotten ${typeof opts.url}`);
          }
        }
      }
  
      return new HttpRequest(this, { method: 'OPTIONS', ...url });
    } else if (url instanceof Object && options !== undefined) {
      throw new TypeError('Parameter `options` shouldn\'t be added in');
    } else {
      throw new TypeError(`Expecting 'string', RequestOptions, or an instanceof URL but gotten ${typeof url} (options: ${typeof options})`);
    }
  }
}
