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

import { HttpClient, HttpClientOptions, HttpMethods, HttpRequestOptions, isRequestOptions, isUrlLike } from './HttpClient';

/**
 * Returns the version of `@augu/orchid`
 */
export const version: string = (require('../package.json')).version;

// Export objects
export * from './core/AbortController';
export * from './core/Serializer';
export * from './core/Middleware';
export * from './core/Response';
export * from './core/Request';

export * from './middleware/logging';
export * from './middleware/timer';

export { HttpClient, HttpRequestOptions, HttpMethods, isRequestOptions, isUrlLike };

type MethodRequestOptions = HttpRequestOptions & HttpClientOptions;

const methods = HttpMethods.slice(0, 9);
for (let i = 0; i < methods.length; i++) {
  const name = methods[i] === 'delete' ? 'del' : methods[i];
  exports[name] = (url: string | MethodRequestOptions, options?: Omit<MethodRequestOptions, 'url' | 'method'>) => {
    const opts = isRequestOptions(url) ? url as MethodRequestOptions : options !== undefined && isRequestOptions(options) ? options as MethodRequestOptions : undefined;
    if (opts === undefined)
      throw new TypeError('couldnt locate request options');

    const client = new HttpClient({
      serializers: opts.serializers,
      middleware: opts.middleware,
      userAgent: opts.userAgent,
      defaults: opts.defaults,
      baseUrl: opts.baseUrl
    });

    return client.request(opts);
  };
}
