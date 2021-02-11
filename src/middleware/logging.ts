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

import { MiddlewareType, OnRequestMiddlewareDefinition, OnResponseMiddlewareDefinition, GenericMiddlewareDefinition, OnRequestExecuteMiddlewareDefinition } from '../structures/Middleware';
import type { HttpClient, Request, Response } from '..';

export interface LogInterface {
  verbose(message: string): void;
  error(message: string): void;
  debug(message: string): void;
  warn(message: string): void;
  info(message: string): void;
}

export enum LogLevel {
  Info = 1 << 0,
  Error = 1 << 1,
  Warning = 1 << 2,
  Verbose = 1 << 3,
  Debug = 1 << 4
}

type LogLevelAsString = 'info' | 'error' | 'warn' | 'verbose' | 'debug' | 'log';

interface LoggingOptions {
  useConsole?: boolean;
  caller?: (level: LogLevelAsString, message: string) => any;
  level?: LogLevel | LogLevel[];
}

const convertLogLevelAsString = (level: LogLevel): LogLevelAsString => {
  switch (level) {
    case LogLevel.Info:
      return 'info';

    case LogLevel.Debug:
      return 'debug';

    case LogLevel.Error:
      return 'error';

    case LogLevel.Verbose:
      return 'verbose';

    case LogLevel.Warning:
      return 'warn';

    default:
      return 'log';
  }
};

const logging = (options?: LoggingOptions): GenericMiddlewareDefinition | OnRequestExecuteMiddlewareDefinition | OnResponseMiddlewareDefinition | OnRequestMiddlewareDefinition => ({
  type: [MiddlewareType.None, MiddlewareType.OnRequest, MiddlewareType.OnResponse],
  name: 'logger',

  run(this: HttpClient, type: MiddlewareType, reqOrRes?: Request, res?: Response) {
    if (type === MiddlewareType.None) {
      const opts: LoggingOptions = Object.assign({
        useConsole: true,
        level: LogLevel.Info
      }, options);

      if (!opts.useConsole && opts.caller === undefined)
        throw new TypeError('Missing `caller` function in `options`');

      const level = typeof opts.level === 'number' ? opts.level! : opts.level?.map(val => val).flat() ?? LogLevel.Info as number;
    }
  }
});

export default logging;
