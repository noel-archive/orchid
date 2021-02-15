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

import { MiddlewareType, OnResponseMiddlewareDefinition, GenericMiddlewareDefinition, OnRequestExecuteMiddlewareDefinition } from '../structures/Middleware';
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
  /** If we should opt to `console` or not */
  useConsole?: boolean;

  /**
   * Custom caller function for external logging libraries
   * @param level The log level
   * @param message The message that was logged
   */
  caller?: (level: LogLevelAsString, message: string) => any;

  /**
   * Format function if we are using the `useConsole` option
   *
   * - `{{level}}`: The log level that was used
   * - `{{message}}`: The message
   */
  format?: string;

  /** The log level(s) to use */
  level?: LogLevel | LogLevel[];
}

const refineFormat = (format: string, { level, message }: { level: LogLevelAsString; message: string }) =>
  format
    .replace(/{{level}}/, level)
    .replace(/{{message}}/, message);

const logging = (options?: LoggingOptions): GenericMiddlewareDefinition | OnRequestExecuteMiddlewareDefinition | OnResponseMiddlewareDefinition => ({
  type: [MiddlewareType.None, MiddlewareType.OnResponse, MiddlewareType.Executed],
  name: 'logger',

  run(client: HttpClient, type: MiddlewareType, reqOrRes?: Request | Response, res?: Response) {
    if (type === MiddlewareType.None) {
      const opts: LoggingOptions = Object.assign({
        useConsole: true,
        level: LogLevel.Verbose
      }, options);

      if (!opts.useConsole && opts.caller === undefined)
        throw new TypeError('Missing `caller` function in `options`');

      const level: number = typeof opts.level === 'number'
        ? opts.level ?? LogLevel.Info
        : opts.level?.reverse().reduce((prev, curr, idx) => prev + (curr * (2 ** idx)), 0) ?? LogLevel.Info;

      const logger: LogInterface = {
        verbose(message) {
          if (!(level & LogLevel.Verbose)) return;

          if (opts.useConsole) {
            const format = opts.format ?? `[verbose :: ${process.pid}]  ~  {{message}}`;
            console.log(refineFormat(format, { level: 'verbose', message }));
          } else {
            opts.caller?.('verbose', message);
          }
        },

        error(message) {
          if (!(level & LogLevel.Error)) return;

          if (opts.useConsole) {
            const format = opts.format ?? `[error :: ${process.pid}]  ~  {{message}}`;
            console.log(refineFormat(format, { level: 'error', message }));
          } else {
            opts.caller?.('error', message);
          }
        },

        debug(message) {
          if (!(level & LogLevel.Debug)) return;

          if (opts.useConsole) {
            const format = opts.format ?? `[debug :: ${process.pid}]  ~  {{message}}`;
            console.log(refineFormat(format, { level: 'debug', message }));
          } else {
            opts.caller?.('debug', message);
          }
        },

        warn(message) {
          if (!(level & LogLevel.Verbose)) return;

          if (opts.useConsole) {
            const format = opts.format ?? `[warn :: ${process.pid}]  ~  {{message}}`;
            console.log(refineFormat(format, { level: 'warn', message }));
          } else {
            opts.caller?.('warn', message);
          }
        },

        info(message) {
          if (opts.useConsole) {
            const format = opts.format ?? `[info :: ${process.pid}]  ~  {{message}}`;
            console.log(refineFormat(format, { level: 'info', message }));
          } else {
            opts.caller?.('info', message);
          }
        }
      };

      (this as any).logger = logger;
      const shouldDebug = !!(level & LogLevel.Debug);
      logger.info(`Installed the logger middleware${shouldDebug ? ', you will now get debug information.' : '!'}`);

      return;
    }

    if (type === MiddlewareType.Executed) {
      const logger = client.middleware.get('logger')?.logger as LogInterface | undefined;
      const req = reqOrRes as Request;

      logger?.info(`Now making a request to "${req.method} ${req.url}" (User-Agent: ${req.headers['user-agent'] ?? 'unknown'})`);

      return;
    }

    if (type === MiddlewareType.OnResponse) {
      const logger = client.middleware.get('logger')?.logger as LogInterface | undefined;
      logger?.info(`Made a request to "${(reqOrRes as Request).method} ${(reqOrRes as Request).url}" | ${res!.status}`);

      return;
    }
  }
});

export default logging;
