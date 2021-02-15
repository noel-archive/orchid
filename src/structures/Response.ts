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

import { IncomingHttpHeaders, IncomingMessage, STATUS_CODES } from 'http';
import type { HttpClient, Serializer } from '..';
import type { Deflate, Gunzip } from 'zlib';

/** Represents what a response is like */
export default class Response {
  /** The status code returned */
  public statusCode: number;

  /** The headers that was returned */
  public headers: IncomingHttpHeaders;

  #client: HttpClient;
  #body: Buffer;
  #res: IncomingMessage;

  /**
   * Creates a new [Response] class
   * @param core The incoming message
   */
  constructor(client: HttpClient, core: IncomingMessage) {
    this.statusCode = core.statusCode!;
    this.headers = core.headers;
    this.#client = client;
    this.#body = Buffer.alloc(0);
    this.#res = core;
  }

  /**
   * @inheritdoc [module:orchid/Response#success]
   * @deprecated Use `response.success` for a more accurate value
   */
  get successful() {
    return this.statusCode >= 200 || this.statusCode <= 300;
  }

  /**
   * If the request was successful or not
   */
  get success() {
    return this.statusCode <= 300 || this.statusCode > 400;
  }

  /**
   * @inheritdoc [module:orchid/Response#empty]
   * @deprecated Use `response.empty`
   */
  get isEmpty() {
    return this.#body.length === 0;
  }

  /**
   * Check if the response body is empty or not
   */
  get empty() {
    return this.#body.length === 0;
  }

  /** Prettifies the current status of this [Response] */
  get status() {
    return `${this.statusCode} ${STATUS_CODES[this.statusCode]}`;
  }

  _chunk(chunk: any) {
    this.#body = Buffer.concat([this.#body, chunk]);
  }

  /**
   * Converts the request body to a readable format
   * from the `content-type` of the response
   */
  body<T = string>(): T {
    const contentType = this.headers['content-type'];
    const serializer = this.#client.serializers.find(serial =>
      serial.contentType instanceof RegExp ? serial.contentType.test(contentType!) : serial.contentType.includes(contentType!)
    );

    if (serializer === null) {
      const text = this.#client.serializers.get('*') as Serializer<any>;
      return text.serialize(this.#body);
    } else {
      return serializer.serialize(this.#body) as T;
    }
  }

  /**
   * Converts the body to a JSON object or array
   */
  json<T extends object | any[] = { [key: string]: string; }>(): T {
    return JSON.parse(this.#body.toString());
  }

  /**
   * Returns the response as a string
   */
  text() {
    return this.#body.toString();
  }

  /**
   * @inheritdoc [module:orchid/Response#buffer]
   * @deprecated Use `response.buffer()` instead
   */
  raw() {
    return this.buffer();
  }

  /**
   * Returns the body as a Buffer
   */
  buffer() {
    return this.#body;
  }

  /**
   * Pipes anything to this [Response] instance
   * @param item The item to use Stream.pipe in
   * @param options The options to use
   * @returns That stream's instance
   */
  pipe<T extends NodeJS.WritableStream>(item: T, options?: { end?: boolean }) {
    return this.#res.pipe(item, options);
  }

  /**
   * Returns the response as a stream
   */
  stream<T extends IncomingMessage | Gunzip | Deflate = IncomingMessage>() {
    return this.#res as unknown as T;
  }
}
