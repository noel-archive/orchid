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

import type { Response } from './Response';
import type { Request } from './Request';

/**
 * Represents a definition object for constructing [[Middleware]]s.
 */
export interface MiddlewareDefinition {
  [x: string]: any; // let any parameter be here

  /**
   * The name of this [[Middleware]].
   */
  name: string;

  /**
   * Function to call when [[HttpClient.use]] is called or when creatting a new instance of [[HttpClient]]
   * with [[HttpClientOptions.middleware]] defined.
   */
  init?(): void;

  /**
   * Function to receive when a request is being executed.
   * @param request The request object
   */
  onRequest?(request: Request): void;

  /**
   * Function to receive when a response has been created.
   * @param response The response object
   */
  onResponse?(response: Response): void;

  /**
   * Function to receive when an error occured while running the request.
   * @param request The request object
   * @param error The error that occured
   */
  onRequestError?(request: Request, error: Error): void;
}

/**
 * Represents a class to define middleware within **orchid**. You don't use
 * this class, this is just an abstraction class for a [[MiddlewareDefinition]].
 */
export class Middleware {
  // The definition object that was received
  private _def: MiddlewareDefinition;

  /**
   * The name of this [[Middleware]] object.
   */
  public name: string;

  constructor(definition: MiddlewareDefinition) {
    this.name = definition.name;
    this._def = definition;
  }

  /**
   * Function to receive when a request is being executed.
   * @param request The request object
   */
  onRequest(request: Request) {
    if (this._def.onRequest !== undefined) this._def.onRequest(request);
  }

  /**
   * Function to receive when a response has been created.
   * @param response The response object
   */
  onResponse(res: Response) {
    if (this._def.onResponse !== undefined) return this._def.onResponse(res);
  }

  /**
   * Function to receive when an error occured while running the request.
   * @param request The request object
   * @param error The error that occured
   */
  onRequestError(request: Request, error: Error) {
    if (this._def.onRequestError !== undefined)
      return this._def.onRequestError(request, error);
  }
}
