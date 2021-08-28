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

import { IncomingMessage, STATUS_CODES } from 'http';

/**
 * Represents a object of constructing a [[Response]].
 */
export interface ResponseOptions {
  /**
   * The status code of the [[Response]].
   */
  statusCode: number;

  /**
   * List of the response headers that was returned.
   */
  headers: Record<string, string | readonly string[]>;

  /**
   * Returns the current incoming message object from the http module.
   * This is only supported in the node.js backend only, not in undici backend.
   */
  stream?: IncomingMessage;
}

/**
 * Represents a http response from the initial request
 */
export class Response {
  /**
   * Returns the status code of this [[Response]].
   */
  public statusCode: number = 200;

  /**
   * List of the response headers that was returned.
   */
  public headers: Record<string, string | readonly string[]> = {};
  #stream?: IncomingMessage;
  #body!: Buffer;

  /** @internal */
  constructor(data: Buffer, options: ResponseOptions) {
    this.statusCode = options.statusCode;
    this.headers = options.headers;
    this.#body = data;
  }

  /**
   * Returns the status text, i.e, `200 OK`.
   */
  get statusText() {
    return `${this.statusCode} ${STATUS_CODES[this.statusCode]}`;
  }

  /**
   * Returns the body payload as a JSON object casted as [[T]].
   */
  json<T extends { [x: string]: any } | any[] = Record<string, unknown>>(): T {
    return JSON.parse(this.#body.toString());
  }

  /**
   * Returns the body payload a Buffer object
   */
  buffer() {
    return this.#body;
  }

  /**
   * Returns the body payload as a string of text.
   * @param encoding The encoding to use to de-serialize
   */
  text(encoding: BufferEncoding = 'utf-8') {
    return this.#body.toString(encoding);
  }

  /**
   * Returns the current incoming message object from the http module.
   * This is only supported in the node.js backend only, not in undici backend.
   */
  stream() {
    return this.#stream;
  }
}
