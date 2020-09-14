import HttpRequest, { HttpMethod, RequestOptions, NullableRequestOptions } from '../HttpRequest';
import type HttpClient from '../HttpClient';
import getOption from './getOption';
import { URL } from 'url';
import merge from './merge';

/**
 * Functions to create a Request
 * @param url The URL of the request
 * @param method The method of the request
 * @param options The options used
 * @returns The http request
 */
export default function createRequest(
  this: HttpClient, 
  url: string | URL | RequestOptions, 
  method: HttpMethod, 
  options?: RequestOptions
) {
  if ((typeof url === 'string' || url instanceof URL) && options === undefined) {
    let newUrl: URL | string = url;

    if (this.defaults !== null) {
      if (this.defaults.hasOwnProperty('baseUrl')) {
        if (url instanceof URL) newUrl = new URL(url.pathname, this.defaults.baseUrl);
        else if (typeof url === 'string') newUrl = new URL(`${this.defaults.baseUrl}${url.startsWith('/') ? url : `/${url}`}`);
        else throw new TypeError(`Expected "string" or URL (package: 'url') but gotten ${typeof url}`);
      }
    }

    return new HttpRequest(this, { method, url: newUrl });
  } else if ((typeof url === 'string' || url instanceof URL) && options !== undefined) {
    if (this.defaults !== null) {
      options = merge<NullableRequestOptions, RequestOptions>(options, {
        followRedirects: getOption('followRedirects', false, this.defaults),
        headers: getOption('headers', {}, this.defaults),
        timeout: getOption('timeout', 30000, this.defaults)
      });  

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

    return new HttpRequest(this, { method, ...options });
  } else if (!(url instanceof URL) && url instanceof Object && options === undefined) {
    if (this.defaults !== null) {
      const opts = merge<NullableRequestOptions, RequestOptions>(url, {
        followRedirects: getOption('followRedirects', false, this.defaults),
        headers: getOption('headers', {}, this.defaults),
        timeout: getOption('timeout', 30000, this.defaults)
      });

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

    return new HttpRequest(this, { method, ...url });
  } else if (url instanceof Object && options !== undefined) {
    throw new TypeError('Parameter `options` shouldn\'t be added in');
  } else {
    throw new TypeError(`Expecting 'string', RequestOptions, or an instanceof URL but gotten ${typeof url} (options: ${typeof options})`);
  }
}

/*
    if ((typeof url === 'string' || url instanceof URL) && options === undefined) {

    } else if ((typeof url === 'string' || url instanceof URL) && options !== undefined) {
      if (this.defaults !== null) {
        options = merge<NullableRequestOptions, RequestOptions>(options, {
          followRedirects: getOption('followRedirects', false, this.defaults),
          headers: getOption('headers', {}, this.defaults),
          timeout: getOption('timeout', 30000, this.defaults)
        });  
  
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
  
      return new HttpRequest(this, { method, ...options });
    } else if (!(url instanceof URL) && url instanceof Object && options === undefined) {
      if (this.defaults !== null) {
        const opts = merge<NullableRequestOptions, RequestOptions>(url, {
          followRedirects: getOption('followRedirects', false, this.defaults),
          headers: getOption('headers', {}, this.defaults),
          timeout: getOption('timeout', 30000, this.defaults)
        });
  
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
  
      return new HttpRequest(this, { method, ...url });
    } else if (url instanceof Object && options !== undefined) {
      throw new TypeError('Parameter `options` shouldn\'t be added in');
    } else {
      throw new TypeError(`Expecting 'string', RequestOptions, or an instanceof URL but gotten ${typeof url} (options: ${typeof options})`);
    }
*/
