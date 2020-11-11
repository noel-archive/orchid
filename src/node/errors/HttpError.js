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

/**
 * Represents a [HttpError] class, which is a Error-based class
 * that shows where it went wrong when creating a request.
 */
module.exports = class HttpError extends Error {
  /**
   * Represents a [HttpError] class, which is a Error-based class
   * that shows where it went wrong when creating a request.
   *
   * @param {HttpErrorData} options The data from the request
   */
  constructor({ url, method, body, status }) {
    super(`Unable to make a request to "${method.toUpperCase()} ${url}":\n${typeof body === 'object' ? JSON.stringify(body) : body}`);

    this.method = method;
    this.status = status;
    this.name   = `HttpError [${status}]`;
    this.url    = url;
  }
};

/**
 * @typedef {object} HttpErrorData
 * @prop {string} method The method used
 * @prop {number} status The status code
 * @prop {string} body The body of the data sent
 * @prop {string} url The URL used
 */
