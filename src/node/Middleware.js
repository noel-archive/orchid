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

const TYPES = [
  // Must implement it's own middleware call
  'none',

  // When a request is constructed
  'request',

  // When a response is constructed
  'response',

  // When we execute the request
  'execute',

  // When we called [HttpRequest.execute]
  'called'
];

/**
 * Represents a class to create [Middleware]
 */
module.exports = class Middleware {
  /**
   * Creates a new [Middleware] instance
   * @param {string} name The name of the middleware
   * @param {'none' | 'request' | 'response' | 'execute' | 'called'} type The type to use
   */
  constructor(name, type) {
    if (typeof type !== 'string') throw new TypeError(`Expected \`string\`, but gotten ${typeof type}`);
    if (!TYPES.includes(types)) throw new TypeError(`Middleware type "${type}" doesn't exist`);

    /**
     * The middleware's name
     * @type {string}
     */
    this.name = name;

    /**
     * The type of middleware it is,
     * this is determined by the `setup` function.
     *
     * @type {'none' | 'request' | 'response' | 'execute' | 'called'}
     */
    this.type = type;
  }

  /**
   * Sets up a Middleware object
   * @param {(new () => Middleware)} cls The class instance
   * @returns {MiddlewareBlock}
   */
  static setupMod(cls) {
    if (cls instanceof Middleware) return {
      setup: cls.setup.bind(cls),
      type: cls.type,
      name: cls.name
    };

    const clazz = new cls();

    return {
      setup: clazz.setup.bind(clazz),
      type: clazz.type,
      name: clazz.name
    };
  }

  setup(...args) {
    throw new TypeError('Missing over-ridded `setup` function');
  }
};

/**
 * @typedef {(...args: any[]) => void} SetupFunction
 *
 * @typedef {object} MiddlewareBlock
 * @prop {SetupFunction} setup The setup function
 * @prop {'none' | 'request' | 'response' | 'execute' | 'called'} type The type
 * @prop {string} name The middleware name
 */
