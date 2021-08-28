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
import utils, { isObject } from '@augu/utils';
import type { HttpClient } from '../HttpClient';
import type { Response } from './Response';
import type { URL } from 'url';
import * as types from '../types';
import FormData from 'form-data';

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
  Client extends HttpClient = HttpClient
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
   * Returns the current [[HttpClient]] attached to this [[Request]].
   */
  public client: HttpClient;

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
   * @param client The client attached to this [[Request]].
   * @param url The URL to use when requesting
   * @param options Any additional options when requesting
   */
  constructor(client: Client, url: URL, options: Options) {
    this.followRedirects = options.followRedirects ?? false;
    this.controller =
      options.controller ?? options.abortController ?? new AbortController();
    this.compress = options.compress ?? false;
    this.headers = options.headers ?? {};
    this.client = client;
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

  /**
   * Injects any compression header details to this [[Request]].
   * @returns This [[Request]] object to chain methods.
   */
  useCompression() {
    this.compress = true;
    this.headers['accept-encoding'] = 'gzip, deflate';
  }

  /**
   * Bulk-adds query parameters to this [[Request]].
   * @param obj The object to bulk-add
   * @returns This [[Request]] object for chaining.
   */
  query(obj: Record<string, any>): this;

  /**
   * Adds a single query parameter to this [[Request]].
   * @param name The name of the query param
   * @param value The value of the query param
   * @returns This [[Request]] object for chaining.
   */
  query(name: string, value: any): this;
  query(nameOrObj: string | Record<string, any>, value?: string) {
    if (typeof nameOrObj === 'string') {
      if (this.url.searchParams.has(nameOrObj)) return this;

      this.url.searchParams.append(nameOrObj, value!);
    } else if (isObject(nameOrObj)) {
      for (const [key, val] of Object.entries(nameOrObj)) {
        if (this.url.searchParams.has(key)) continue;

        this.url.searchParams.append(key, val);
      }

      return this;
    } else {
      throw new TypeError(
        `expected Request.query(name, value) or Request.query({ ... }) but received ${
          typeof nameOrObj === 'object' ? 'array/null' : typeof nameOrObj
        }`
      );
    }
  }

  /**
   * Adds a list of headers by their key-values
   * @param values The headers key-value pair
   * @returns This [[Request]] object to chain methods.
   */
  addHeaders(values: Record<string, any>) {
    for (const [key, value] of Object.entries(values))
      this.headers[key.toLowerCase()] = value;

    return this;
  }

  /**
   * Adds a list of headers by their key-values
   * @param values The headers key-value pair
   * @deprecated This method is deprecated for the use of [[Request.addHeaders]], this will be removed in the next release.
   * @returns This [[Request]] object to chain methods.
   */
  header(values: Record<string, any>): this;

  /**
   * Adds a single header to this [[Request]].
   * @param name The name of the header
   * @param value The value of the header
   */
  header(name: string, value: any): this;
  header(name: string | Record<string, any>, value?: any) {
    if (typeof name === 'string') {
      if (this.headers.hasOwnProperty(name)) return this;

      this.headers[name.toLowerCase()] = value;
      return this;
    } else if (isObject(name)) {
      return this.addHeaders(name);
    } else {
      throw new TypeError(
        `expected Request.header(name, value) or Request.header({ ... }) but received ${
          typeof name === 'object' ? 'array/null' : typeof name
        }`
      );
    }
  }

  /**
   * Attaches any data payload to this [[Request]]. This will error
   * if this request is a GET request.
   *
   * @param data The data payload
   */
  body(data: types.DataLike) {
    if (this.method === 'GET' || this.method === 'get')
      throw new TypeError('Request.body(...) is not allowed on GET requests.');

    const contentType = Request._figureContentType(this, data);
    if (
      !this.headers.hasOwnProperty('content-type') &&
      contentType !== undefined
    ) {
      this.headers['content-type'] = contentType;
      return this;
    }

    this.data = data;
    return this;
  }

  /**
   * Attaches callbacks for the resolution and/or rejection of this Request promise
   * @param resolver The callback to execute when the Promise is resolved
   * @param rejecter The callback to execute when the Promise is rejected
   * @returns A Promise for the completion of which ever callback has been executed
   */
  then(
    resolver?: ((res: Response | PromiseLike<Response>) => unknown) | null,
    rejector?: ((error: Error) => unknown) | null
  ) {
    return this.execute().then(resolver).catch(rejector);
  }

  /**
   * Attaches a callback only when the Promise is rejected
   * @param rejecter The callback function to execute
   * @returns A Promise for the completion of the callback
   */
  catch<TResult>(rejector: (reason: any) => TResult | PromiseLike<TResult>) {
    return this.then(null, rejector);
  }

  /**
   * Abstract function to execute this [[Request]] to return a [[Res]] (response).
   */
  abstract execute(): Promise<Response>;
}
