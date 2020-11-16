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

const Months = {
  0: 'Jan',
  1: 'Feb',
  2: 'Mar',
  3: 'Apr',
  4: 'May',
  5: 'Jun',
  6: 'Jul',
  7: 'Aug',
  8: 'Sept',
  9: 'Oct',
  10: 'Nov',
  11: 'Dec'
};

/**
 * Inner function to return the actual prettified message
 * @param {LogMessage} msg The message
 * @returns {string} The formatted message
 */
function format(msg) {
  if (msg instanceof Date) return msg.toUTCString();
  if (msg instanceof Array) return `[${msg.map(format).join(', ')}]`;
  if (msg instanceof Error) {
    const e = [`${msg.name}: ${msg.message}`];
    const stack = msg.stack ? msg.stack.split('\n').map(s => s.trim()) : [];
    stack.shift();

    const all = stack.map(s => {
      if (/(.+(?=)|.+) ((.+):\d+|[:\d+])[)]/g.test(s)) return s.match(/(.+(?=)|.+) ((.+):\d+|[:\d+])[)]/g)[0];
      if (/(.+):\d+|[:\d+][)]/g.test(s)) return s.match(/(.+):\d+|[:\d+][)]/g)[0];

      return s;
    });

    e.push(...all.map(item => ` • in "${item.replace('at', '').trim()}"`));
    return e.join('\n');
  }

  if (typeof msg === 'object' && !Array.isArray(msg)) return inspect(msg, { depth: 2 });

  return msg;
}

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
   * Gets the full date
   */
  getFullDate() {
    const now = new Date();
    const esc = (type) => `0${type}`.slice(-2);

    const month = Months[now.getMonth()];
    const date = now.getDate();
    const year = now.getFullYear();

    /**
     * Find the number's ordinal suffix
     * @param {number} i The number to find
     */
    function findOrdinal(i) {
      const j = i % 10;
      const k = i % 100;

      /* eslint-disable eqeqeq */
      if (j == 1 && k != 11) return 'st';
      if (j == 2 && k != 12) return 'nd';
      if (j == 3 && k != 13) return 'rd';
      /* eslint-enable eqeqeq */

      return 'th';
    }

    return `[${month} ${date}${findOrdinal(date)}, ${year} | ${esc(now.getHours())}:${esc(now.getMinutes())}:${esc(now.getSeconds())}]`;
  }

  /**
   * Gets the shorten date
   */
  getShortDate() {
    const now = new Date();
    const esc = (type) => `0${type}`.slice(-2);

    const month = Months[now.getMonth()];
    const date = now.getDate();
    const year = now.getFullYear();

    return `[${date}/${month}/${year} | ${esc(now.getHours())}:${esc(now.getMinutes())}:${esc(now.getSeconds())}]`;
  }

  /**
   * Creates a log function for this middleware
   * @param {string} level The level
   * @return {(message: unknown) => void}
   */
  createLogFunction(level) {
    return (msg) => {
      const message = format(msg);

      if (this.options.useConsole && typeof this.options.callee !== 'undefined') throw new TypeError('Can\'t provide a caller function if `useConsole` is true');
      if (!this.options.useConsole && typeof this.options.callee === 'undefined') throw new TypeError('Missing `callee` function');

      const m = this.replaceMessage(level, message);
      const levelFunc = level === 'success' ? 'info' : level;

      if (!this.options.useConsole) this.options.callee(m);
      else console[levelFunc](m);
    };
  }

  /**
   * Sets up this middleware instance
   * @param {import('../HttpClient')} client The client (that is passed)
   */
  setup(client) {
    const logger = {
      success: this.createLogFunction('success'),
      error: this.createLogFunction('error'),
      warn: this.createLogFunction('warn'),
      info: this.createLogFunction('info')
    };

    client.middleware.set('logger', logger);
    logger.info('Injected middleware "logging" successfully');
  }
}

module.exports = (options) => Middleware.setupMod(new LoggingMiddleware(options));

/**
 * @typedef {object} LoggingOptions
 * @prop {boolean} [useConsole=true] If we should use `console` instead of a custom `callee` function
 * @prop {string} [binder='[$(date:full)] [$(level)] => $(message)'] Binder message to show when being logged
 *- `$(level:capitialise)`: Returns the log level but with the first letter being capitialised (example: **Info**)
 *- `$(date:full)`: Returns a long version of the current date (example: **Nov 15th, 2020 | 06:29 AM**)
 *- `$(message)`: Returns the message that Orchid sends
 *- `$(level)`: Returns the log level it is using (example: **info**)
 *- `$(date)`: Returns a shortened version of the current date (example: **15/11/20 | 06:28:20**)
 *
 * @prop {(message: string) => void} [callee=undefined] Returns the caller function to run
 * the `message` is the message that is converted when logging (from [LoggingOptions.binder])
 */
