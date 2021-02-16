/**
 * Copyright (c) 2020-2021 August
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import HttpClient, { HttpClientOptions, UrlLike } from './HttpClient';
import Request, { RequestOptions } from './structures/Request';

const { version: pkgVersion } = require('../package.json');

/** All of the http methods available for the HttpClient */
export type HttpMethod =
  | 'options'
  | 'connect'
  | 'delete'
  | 'trace'
  | 'head'
  | 'post'
  | 'put'
  | 'get'
  | 'patch'
  | 'OPTIONS'
  | 'CONNECT'
  | 'DELETE'
  | 'TRACE'
  | 'HEAD'
  | 'POST'
  | 'PUT'
  | 'GET'
  | 'PATCH';

/** Returns the version of `@augu/orchid` */
export const version: string = pkgVersion;

/** Returns the http methods as an Array */
export const HttpMethods: Readonly<HttpMethod[]> = [
  'options',
  'connect',
  'delete',
  'trace',
  'head',
  'post',
  'put',
  'get',
  'patch',
  'OPTIONS',
  'CONNECT',
  'DELETE',
  'TRACE',
  'HEAD',
  'POST',
  'PUT',
  'GET',
  'PATCH'
] as const;

export { MiddlewareDefinition, MiddlewareType } from './structures/Middleware';
export { default as TimeoutError } from './errors/TimeoutError';
export { default as Serializer } from './structures/Serializer';
export { default as HttpError } from './errors/HttpError';
export { default as Response } from './structures/Response';

export { RequestOptions, HttpClient, UrlLike, Request };
export * as middleware from './middleware';
export * from './serializers';

export interface SingleRequestOptions extends HttpClientOptions, Omit<RequestOptions, 'method'> {}

for (const method of HttpMethods.filter(r => r.toLowerCase() === r)) {
  const methodName = method === 'delete' ? 'del' : method;
  exports[methodName] = function onMethod(url: UrlLike | SingleRequestOptions, options?: Omit<SingleRequestOptions, 'url'>) {
    const client = new HttpClient({
      serializers: options?.serializers,
      middleware: options?.middleware,
      userAgent: options?.userAgent,
      defaults: options?.defaults,
      baseUrl: options?.baseUrl
    });

    return client[method](url, options);
  };
}
