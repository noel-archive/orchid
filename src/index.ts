import { compress, logging, forms, streams, blobs, CycleType, Middleware } from './middleware';
import type { HttpMethod, RequestOptions } from './HttpRequest';
import HttpClient from './HttpClient';
import { URL } from 'url';
import Blob from './internals/Blob';

const middleware = { compress, logging, forms, streams, blobs };

interface Options extends RequestOptions {
  middleware?: Middleware[];
  agent?: string;
}

for (const method of ['OPTIONS', 'CONNECT', 'DEL', 'TRACE', 'HEAD', 'POST', 'PUT', 'GET']) {
  /**
   * Creates a new Request using the method
   * @param url The URL or options
   * @param opts The options to add
   */
  exports[method.toLowerCase()] = (url: string | URL | Options, opts?: Options) => {
    const client = new HttpClient();
    if (url instanceof Object && !(url instanceof URL)) {
      if (url.hasOwnProperty('middleware')) {
        if (Array.isArray(url.middleware)) {
          for (const middleware of url.middleware) client.use(middleware);
        }
      }

      if (url.hasOwnProperty('url')) client.setAgent(url.agent!);
    }

    if (opts) {
      if (opts.hasOwnProperty('middleware')) {
        if (Array.isArray(opts.middleware)) {
          for (const middleware of opts.middleware) client.use(middleware);
        }
      }

      if (opts.hasOwnProperty('url')) client.setAgent(opts.agent!);
    }

    if (opts && !opts.hasOwnProperty('url')) opts.url = url as (string | URL);
  
    // Not needed
    if (opts) delete opts.method;

    const httpMethod: HttpMethod = method === 'del' ? 'delete' : method as HttpMethod;
    const options = opts !== undefined 
      ? opts
      : url instanceof URL && typeof url === 'string'
        ? { method: httpMethod, url }
        : url as Options;

    delete options.middleware;
    delete options.agent;

    return client.request(options);
  };
}

export const version: string = require('../package.json').version;
export { HttpClient, middleware, CycleType, Blob };
