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
import type { UrlLike } from './HttpClient';
import { HttpMethods } from '.';
import { URL } from 'url';

/**
 * Checks if a specific value is [UrlLike]
 * @param like The value
 * @returns if it is or not
 */
export function isUrlLike(like: unknown): like is UrlLike {
  return typeof like === 'string' || (
    like instanceof URL &&
    like.origin !== undefined
  );
}

/**
 * Check if [value] is related to [RequestOptions]
 * @param value The value
 */
export function isRequestLike(value: unknown): value is RequestOptions {
  return typeof value === 'object' && (
    ((value as RequestOptions).method !== undefined && HttpMethods.includes((value as RequestOptions).method!)) ||
    isUrlLike((value as RequestOptions).url)
  );
}
