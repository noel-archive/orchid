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

import { isObject } from '@augu/utils';
import { URL } from 'url';

/**
 * Extra utilities used through-out orchid
 */
export class Util {
  // regex for matching `/:...` where `:...` is found
  private static PATH_PREFIX_REGEX = /[:]\w+/gi;

  /**
   * Finds all the matches for `:...` in a URL and converts it
   * @param url The URL to use
   * @param params The parameters the request has specified
   */
  static matchPathParams(url: string | URL, params: Record<string, any> = {}) {
    if (url instanceof URL)
      return url;

    const matches = url.match(this.PATH_PREFIX_REGEX);
    if (matches === null)
      return url;

    for (let i = 0; i < matches.length; i++) {
      const name = matches[i].split(':').pop()!;
      const param = params[name];

      if (!param)
        throw new SyntaxError(`Missing parameter for "${name}" (matched: ${matches[i]})`);

      if (isObject(param) || Array.isArray(param) || param === undefined || param === null)
        throw new TypeError(`non-primitives aren't allowed for param params (name: ${name}; matched: ${matches[i]})`);

      url = url.replace(matches[i], encodeURIComponent(String(param)));
    }

    return url;
  }
}
