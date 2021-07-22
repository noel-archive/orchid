/**
 * Copyright (c) 2020-2021 Noelware
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

import { AbortSignal } from './AbortSignal';

/**
 * Polyfill for AbortController specified here: https://developer.mozilla.org/en-US/docs/Web/API/AbortController
 *
 * I made my own polyfill to not add over-head polyfill dependencies
 */
export class AbortController {
  public signal: AbortSignal = new AbortSignal();

  /**
   * Aborts the request
   */
  abort() {
    if (this.signal.aborted)
      return;

    this.signal.aborted = true;
    this.signal.dispatchEvent('abort');
  }

  /**
   * Returns a string representation of this object
   */
  toString() {
    return '[object AbortController]';
  }

  get [Symbol.toStringTag]() {
    return 'orchid.AbortController';
  }
}
