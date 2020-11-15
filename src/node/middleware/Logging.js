/**
 * Copyright (c) 2020 August
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

const Middleware = require('../Middleware');
const utils = require('../utils');

class LoggingMiddleware extends Middleware {
  /**
   * Creates a new [LoggingMiddleware] instance
   * @param {LoggingOptions} [options] The options to use
   */
  constructor(options) {
    super('logging', 'none');

    this.options = utils.merge(options, {
      useConsole: true,
      binder: `[$(date:full)] [$(level:capitialise)/${process.pid}] => $(message)`,
      callee: undefined
    });
  }

  /**
   * Replaces the message of the [binder] option
   * @param {string} level The level
   * @param {string} message The message
   */
  replaceMessage(level, message) {
    const REGEX = /[$]\(([\w\.]+)\)/g;
    const args = {
      'level:capitalise': level.split(' ').map(e => `${e.charAt(0).toUpperCase()}${e.slice(1)}`).join(' '),
      'date:full': this.getFullDate(),
      message,
      level,
      date: this.getShortDate()
    };

    return this.options.binder.replace(REGEX, (_, key) => {
      if (args.hasOwnProperty(key)) return args[key];
      else return 'unknown';
    });
  }

  /**
   * Sets up this middleware instance
   * @param {import('../HttpClient')} client The client (that is passed)
   */
  setup(client) {
    // E
  }
}

module.exports = (options) => Middleware.setupMod(new LoggingMiddleware(options));

/**
 * @typedef {object} LoggingOptions
 * @prop {boolean} [useConsole=true] If we should use `console` instead of a custom `callee` function
 * @prop {string} [binder='[$(date:full)] [$(level)] => $(message)'] Binder message to show when being logged
 *    - `$(level:capitialise)`: Returns the log level but with the first letter being capitialised (example: **Info**)
 *    - `$(date:full)`: Returns a long version of the current date (example: **Nov 15th, 2020 | 06:29 AM**)
 *    - `$(message)`: Returns the message that Orchid sends
 *    - `$(level)`: Returns the log level it is using (example: **info**)
 *    - `$(date)`: Returns a shortened version of the current date (example: **15/11/20 | 06:28:20**)
 *
 * @prop {(message: string) => void} [callee=undefined] Returns the caller function to run
 * the `message` is the message that is converted when logging (from [LoggingOptions.binder])
 */
