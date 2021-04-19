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

import type { Serializer } from './Serializer';

/**
 * Represents a http response from the initial request
 */
export class Response {
  public statusCode: number = 0;
  public headers: Record<string, string | string[]> = {};
  #client: any;
  #body!: Buffer;

  constructor(client: any) {
    this.#client = client;
  }

  /**
   * If the request was successful or not
   */
  get success() {
    return this.statusCode <= 300 || this.statusCode > 400;
  }

  /**
   * Check if the response body is empty or not
   */
  get empty() {
    return this.#body !== undefined ? this.#body.length === 0 : true;
  }

  // parses the headers to form a object (not included in typings)
  // credit: https://github.com/helperdiscord/petitio/blob/master/src/lib/PetitioResponse.ts#L43
  parseHeaders(headers: string[]) {
    for (let i = 0; i < headers.length; i += 2) {
      const key = headers[i].toLowerCase();
      const value = headers[i + 1];
      let val = this.headers[key];

      if (val !== undefined) {
        if (!Array.isArray(val)) {
          val = [val];
          this.headers[key] = val;
        }

        (val as any[]).push(value);
      } else {
        this.headers[key] = value;
      }
    }
  }

  // creates a unified body to form a request (not included in typings)
  pushBody(buffers: Uint8Array[] | Buffer[]) {
    const len = this.headers['content-length'] as string;
    this.#body = Buffer.concat(buffers, len !== undefined ? Number(len) : undefined);
  }

  /**
   * Converts the response body to a JSON object or array
   */
  json<T extends Record<string, unknown> | any[] = Record<string, unknown>>(): T {
    return JSON.parse(this.#body.toString('utf-8'));
  }

  /**
   * Converts the response body to a string
   */
  text(encoding: BufferEncoding = 'utf-8') {
    return this.#body.toString(encoding);
  }

  /**
   * Returns the response body as a buffer
   */
  buffer() {
    return this.#body;
  }

  /**
   * Converts the response body to any serializable entity. For text: use
   * [[Response.text]]. For JSON, use [[Response.json]]. This function is only
   * for custom serialization entities like XML.
   */
  body<T = string>() {
    const contentType = this.headers['content-type'] as string;
    const serializer = this.#client.serializers.find(serial =>
      serial.contentType instanceof RegExp ? serial.contentType.test(contentType!) : serial.contentType.includes(contentType!)
    );

    if (serializer === null) {
      const text = this.#client.serializers.get('*') as Serializer<string>;
      return text.serialize(this.#body);
    } else {
      return serializer.serialize(this.#body) as T;
    }
  }
}
