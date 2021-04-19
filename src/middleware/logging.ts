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

import { MultiMiddleware, MiddlewareType } from '../core/Middleware';

interface LoggingOptions {
  /**
   * If we opt to use `console` as the logger or not.
   */
  useConsole?: boolean;

  /**
   * The log function to call when the middleware
   * logs something.
   */
  log?: (message: string) => void;
}

interface LoggingProps {
  isConsole: boolean;
  log: (message: string) => void;
}

/**
 * Middleware to log request and responses
 * @param options The options to use
 */
const logging = (options?: LoggingOptions): MultiMiddleware<MiddlewareType.Request | MiddlewareType.Response, LoggingProps> => ({
  name: 'logging',
  types: [MiddlewareType.Request, MiddlewareType.Response],

  init() {
    const useConsole = options?.log !== undefined ? false : (options?.useConsole ?? true);

    this.isConsole = useConsole;
    this.log = options?.log ?? console.log;

    this.log!('Successfully initialized logging middleware!');
  },

  onRequest(req, next) {
    this.log!(`Hitting request: "${req.method.toUpperCase()} ${req.url.pathname}${req.url.search}" (User-Agent: ${req.headers['user-agent'] ?? '(unknown)'})`);
    next();
  },

  onResponse(_, req, res, next) {
    this.log!(`${req.method.toUpperCase()} ${req.url.toString()} | ${res.statusCode} (User-Agent: ${req.headers['user-agent'] ?? '(unknown)'})`);
    next();
  }
});

export { logging };
