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

import type { RequestOptions } from './structures/Request';
import { URL } from 'url';

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
export { default as HttpClient, UrlLike } from './HttpClient';
export { default as Serializer } from './structures/Serializer';
export { default as Response } from './structures/Response';
export { default as Request } from './structures/Request';

export { RequestOptions };
export * from './serializers';
export * from './middleware';

for (const method of HttpMethods.filter(r => r.toLowerCase() === r)) {
  exports[method] = function onMethod(url: string | URL | RequestOptions, options?: RequestOptions) {
    // TODO: this
  };
}
