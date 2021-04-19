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

import { EventBus } from '@augu/utils';

/**
 * List of events available to a single [[AbortSignal]]
 */
interface AbortSignalEvents {
  /**
   * Emitted when [[AbortController.abort]] is called.
   * @param event The event packet
   */
  onabort(event: AbortSignalEvent): void;
}

interface AbortSignalEvent {
  target: AbortSignal;
  type: 'abort';
}

type DispatchEventName<K extends string> = K extends `on${infer P}` ? P : never;

/**
 * Polyfill for [[AbortSignal]] without adding any over-head dependencies
 */
export class AbortSignal {
  /**
   * The event emitter to dispatch events
   */
  public eventEmitter: EventBus<AbortSignalEvents> = new EventBus();

  /**
   * If this signal is aborted or not
   */
  public aborted: boolean = false;

  get [Symbol.toStringTag]() {
    return 'orchid.AbortSignal';
  }

  /**
   * Returns a string representation of this object
   */
  toString() {
    return '[object AbortSignal]';
  }

  /**
   * Pops a event's specific listener from the callstack.
   * @param name The name of the event to pop out
   * @param handler The handler function
   */
  removeEventListener<K extends keyof AbortSignalEvents>(name: K, handler: AbortSignalEvents[K]) {
    this.eventEmitter.removeListener(name, handler);
  }

  /**
   * Pushes a new event to the event callstack
   * @param name The name of the event to push
   * @param handler The handler function
   */
  addEventListener<K extends keyof AbortSignalEvents>(name: K, handler: AbortSignalEvents[K]) {
    this.eventEmitter.on(name, handler);
  }

  /**
   * Dispatch a event from this [[AbortSignal]]
   * @param type The type to dispatch
   */
  dispatchEvent<K extends keyof AbortSignalEvents>(type: DispatchEventName<K>) {
    const event: AbortSignalEvent = { type, target: this };
    const handler = `on${type}`;

    if (typeof this[handler] === 'function')
      this[handler](event);

    this.eventEmitter.emit(handler as keyof AbortSignalEvents, event);
  }
}

/**
 * Polyfill for AbortController specified here: https://developer.mozilla.org/en-US/docs/Web/API/AbortController
 *
 * I made my own polyfill to not add over-head polyfill dependencies
 */
export class AbortController {
  public signal: AbortSignal = new AbortSignal();

  /**
   * Aborts the request
   */
  abort() {
    if (this.signal.aborted)
      return;

    this.signal.aborted = true;
    this.signal.dispatchEvent('abort');
  }

  /**
   * Returns a string representation of this object
   */
  toString() {
    return '[object AbortController]';
  }

  get [Symbol.toStringTag]() {
    return 'orchid.AbortController';
  }
}
