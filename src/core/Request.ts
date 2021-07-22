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

import { AbortController } from './abort/AbortController';
import type { URL } from 'url';
import * as types from '../types';
import FormData from 'form-data';
import utils from '@augu/utils';
import { Response } from './Response';

/**
 * Represents a object of the available [Request] options available.
 */
export interface RequestOptions {
  /**
   * If we should follow the `Location` header if any on 3xx statuses
   */
  followRedirects?: boolean;

  /**
   * The abort controller to use when aborting requests.
   */
  abortController?: AbortController;

  /** @deprecated Use [[RequestOptions.abortController]] instead. */
  controller?: AbortController;

  /**
   * If the data should include compression headers
   */
  compress?: boolean;

  /**
   * Key-value pair of the headers the request must send.
   */
  headers?: Record<string, unknown>;

  /**
   * The HTTP method verb to use
   */
  method: types.HttpMethod;

  /**
   * Any piece of data to send to the server
   */
  data?: types.DataLike;
}

/**
 * Factory class to construct requests within **orchid**.
 */
export abstract class Request<
  Options extends RequestOptions = RequestOptions,
  Res extends Response = Response
> {
  /**
   * If we should follow the `Location` header if any on 3xx statuses
   */
  public followRedirects: boolean;

  /**
   * The abort controller to use when aborting requests.
   */
  public controller: AbortController;

  /**
   * If the data should include compression headers
   */
  public compress: boolean;

  /**
   * Key-value pair of the headers the request must send.
   */
  public headers: Record<string, unknown>;

  /**
   * The HTTP method verb to use
   */
  public method: types.HttpMethod;

  /**
   * Any piece of data to send to the server
   */
  public data?: types.DataLike;

  /**
   * The URL of the request
   */
  public url: URL;

  /**
   * Creates a new [[Request]] object.
   * @param url The URL to use when requesting
   * @param options Any additional options when requesting
   */
  constructor(url: URL, options: Options) {
    this.followRedirects = options.followRedirects ?? false;
    this.controller =
      options.controller ?? options.abortController ?? new AbortController();
    this.compress = options.compress ?? false;
    this.headers = options.headers ?? {};
    this.method = options.method;
    this.data = options.data;
    this.url = url;

    const contentType = Request._figureContentType(this, this.data);
    if (contentType !== undefined) this.headers['content-type'] = contentType;
  }

  private static _figureContentType(
    req: Request,
    data?: types.DataLike
  ): string | undefined {
    if (data instanceof FormData) {
      req.data = data.getBuffer();

      const headers = data.getHeaders();
      return headers['content-type'];
    }

    if (utils.isObject(data) || Array.isArray(data)) {
      req.data = JSON.stringify(data);
      return 'application/json';
    }
  }

  abstract execute(): Promise<Res>;
}
