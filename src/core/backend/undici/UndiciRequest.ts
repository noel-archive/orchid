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

/* eslint-disable @typescript-eslint/indent */

import { URL } from 'url';
import { Request, RequestOptions } from '../../Request';
import { Response } from '../../Response';
import { UndiciHttpClient } from './UndiciHttpClient';

const undici =
  require('undici') as typeof import('../../../@types/undici/index');

/**
 * Represents a object of the [[RequestOptions]] tailored to the
 * [[UndiciRequest]] backend.
 */
export interface UndiciRequestOptions extends RequestOptions {
  /**
   * The client to use, if no client is provided, it'll construct
   * a new client.
   */
  client?: undici.Client;

  /**
   * A custom undici agent to use, if none is provided, it'll use
   * orchid's default.
   */
  agent?: undici.Agent;
}

const Agent = new undici.Agent({ keepAliveTimeout: 5000 });

export class UndiciRequest extends Request<
  UndiciRequestOptions,
  UndiciHttpClient
> {
  /**
   * The client to use, if no client is provided, it'll construct
   * a new client.
   */
  public kClient: undici.Client;

  /**
   * A custom undici agent to use, if none is provided, it'll use
   * orchid's default.
   */
  public agent: undici.Agent;

  /** @internal */
  constructor(
    client: UndiciHttpClient,
    url: URL,
    options: UndiciRequestOptions
  ) {
    super(client, url, options);

    this.kClient = options.client ?? new undici.Client(new URL(url.origin));
    this.agent = options.agent ?? Agent;
  }

  /** @inheritdoc */
  override execute() {
    return new Promise<Response>((resolve, reject) => {
      // TODO: this
    });
  }
}

/*
  protected _execute() {
    this.#client.runMiddleware(MiddlewareType.Request, this);

    return new Promise<Response>((resolve, reject) => {
      const options: Client.RequestOptions = {
        headers: this.headers,
        method: this.method,
        signal: this.controller,
        path: `${this.url.pathname}${this.url.search}`,
        body: this.data instanceof FormData
          ? this.data.getBuffer()
          : typeof this.data === 'object'
            ? JSON.stringify(this.data)
            : this.data
      };

      const res = new Response(this.#client);
      const data: Uint8Array[] | Buffer[] = [];

      this.client.dispatch(options, {
        onData(chunk) {
          data.push(chunk);
          return true;
        },

        onError(error) {
          return reject(error);
        },

        onHeaders(statusCode, headers, resume) {
          res.statusCode = statusCode;
          res.parseHeaders(headers ?? []);
          resume();

          return true;
        },

        onComplete: () => {
          if (!this.keepClient)
            this.client.close();

          this.#client.runMiddleware(MiddlewareType.Response, this, res);
          res.pushBody(data);
          return resolve(res);
        },

        onUpgrade: () => null,
        onConnect: () => null
      });
    });
  }
*/
