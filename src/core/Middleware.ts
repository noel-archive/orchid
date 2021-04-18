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

/**
 * List of middleware types available
 */
export enum MiddlewareType {
  /**
   * Called when [[HttpClient.use]] is used.
   */
  Initialization = 'on:init',

  /**
   * Called when [[Request.execute]] is called.
   */
  Execution      = 'on:execute',

  /**
   * Called when a [[Response]] object is serialized
   */
  Response       = 'on:response',

  /**
   * Called when a [[Request]] was *just* made
   */
  Request        = 'on:request'
}

/**
 * The runner function to use based on it's [[Type]].
 */
// todo: make this better? idk it looks ugly but it'll have to do 💅
export type RunFunction<Type extends MiddlewareType> = Type extends MiddlewareType.Execution
  ? (req: any, next: NextFunction) => void
  : Type extends MiddlewareType.Initialization
    ? () => void
    : Type extends MiddlewareType.Request
      ? (req: any, next: NextFunction) => void
      : Type extends MiddlewareType.Response
        ? (res: any, next: NextFunction) => void
        : never;

/**
 * Represents a "next" function, to call the next middleware
 * if anything occurs. If a `error` is passed down, it'll
 * stop the middleware process and throws a Promise rejection.
 */
export type NextFunction = (error?: Error) => void;

/**
 * Represents a middleware object, this is used for [[HttpClient.use]]. When [[HttpClient.use]] is called,
 * it'll run the `init` lifecycle hook (can be omitted), to append any [[Props]] (if any), then the specific
 * [[Type]] is called, it'll run the middleware with the `run` function, where all logic happens with extra
 * arguments dependent on the [[Type]] with a `next` parameter which will call the next middleware.
 *
 * Example middleware:
 *
 * ```js
 * const mod: Middleware<MiddlewareFunction<MiddlewareType.Request>, {}> = {
 *   name: 'my.middleware',
 *   type: MiddlewareType.Request,
 *   init() {
 *      // init function when `client.use` is called
 *   },
 *   run(req, next) {
 *     // req => orchid.Request
 *     next();
 *   }
 * };
 * ```
 */
export type Middleware<Type extends MiddlewareType, Props extends Record<string, unknown> = {}> = MiddlewareDefinition<Type> & {
  [P in keyof Props]?: Props[P];
}

/**
 * Definition object for middleware, read the [[Middleware]] type
 * for more in-depth information.
 */
export interface MiddlewareDefinition<Type extends MiddlewareType> {
  /**
   * Called when [[HttpClient.use]] is called, to initialize this middleware
   * with any additional properties it desires.
   */
  init?(): void;

  /**
   * The name of the middleware
   */
  name: string;

  /**
   * The run function to use
   */
  run: RunFunction<Type>;
}
