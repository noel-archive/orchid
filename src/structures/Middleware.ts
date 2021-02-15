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

import type { Serializer, Request, Response, HttpClient } from '..';

export enum MiddlewareType {
  /** Runs when serialization happens (called from `Request.body()` or any other built-in method) */
  Serialization = 'serialize',

  /** Runs when we receive a response (Called from `Request.execute()`) */
  OnResponse = 'on.response',

  /** Runs when we first create a request (Called from `Request.execte()`) */
  OnRequest = 'on.request',

  /** Runs when we *first* call `Request.execute()` */
  Executed = 'execute',

  /**  */
  None = 'none'
}

export interface IMiddlewareDefinition {
  /**
   * Runs the middleware for this definition
   * @param args The arguments from the definition type
   */
  run(client: HttpClient, type: MiddlewareType, ...args: any[]): void;

  /**
   * The middleware type to use
   */
  type: MiddlewareType | MiddlewareType[];

  /**
   * The name of the middleware
   */
  name: string;
}

export interface SerializeMiddlewareDefinition extends IMiddlewareDefinition {
  /**
   * Runs the middleware for the `serialize` middleware type
   * @param response The response
   * @param serializer The serializer that it's trying to serialize
   */
  run(client: HttpClient, type: MiddlewareType, response: Response, serializer: Serializer<any>): void;

  type: MiddlewareType.Serialization | MiddlewareType[];
}

export interface OnResponseMiddlewareDefinition extends IMiddlewareDefinition {
  /**
   * Runs the middleware with the `on.response` middleware type
   * @param response The response
   */
  run(client: HttpClient, type: MiddlewareType, response: Response): void;

  type: MiddlewareType.OnResponse | MiddlewareType[];
}

export interface OnRequestMiddlewareDefinition extends IMiddlewareDefinition {
  /**
   * Runs the middleware with the `on.request` middleware type
   * @param request The response
   */
  run(client: HttpClient, type: MiddlewareType, request: Request): void;

  type: MiddlewareType.OnRequest | MiddlewareType[];
}

export interface OnRequestExecuteMiddlewareDefinition extends IMiddlewareDefinition {
  /**
   * Runs the middleware with the `executed` middleware type
   * @param request The request
   */
  run(client: HttpClient, type: MiddlewareType, request: Request): void;

  type: MiddlewareType.Executed | MiddlewareType[];
}

export interface GenericMiddlewareDefinition extends IMiddlewareDefinition {
  /**
   * Runs the middleware with the `none` middleware type
   */
  run(client: HttpClient, type: MiddlewareType): void;

  type: MiddlewareType.None | MiddlewareType[];
}

export type MiddlewareDefinition =
  | IMiddlewareDefinition
  | SerializeMiddlewareDefinition
  | OnResponseMiddlewareDefinition
  | OnRequestExecuteMiddlewareDefinition
  | OnRequestMiddlewareDefinition
  | GenericMiddlewareDefinition;

export default class Middleware {
  [x: string]: any;

  public name: string;
  public type: MiddlewareType[];
  public run: MiddlewareDefinition['run'];

  constructor(definition: IMiddlewareDefinition) {
    this.name = definition.name;
    this.type = typeof definition.type === 'string' ? [definition.type] : definition.type;
    this.run = definition.run;

    for (const key of Object.keys(definition).filter(x => !['name', 'type', 'run'].includes(x)))
      this[key] = definition[key];
  }

  /**
   * Executes this middleware definition
   * @param client The http client for `this` => HttpClient
   * @param args Any additional arguments to run
   */
  execute(client: HttpClient, type: MiddlewareType, ...args: any[]) {
    return (this.run as any)(client, type, ...args);
  }
}
