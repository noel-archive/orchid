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

import { GenericMiddlewareDefinition, MiddlewareType, OnRequestMiddlewareDefinition, OnResponseMiddlewareDefinition } from '../structures/Middleware';
import type { HttpClient, Request, Response } from '..';
import { calculateHRTime } from '@augu/utils';

const createId = () => {
  const charList = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXZ0123456789._-@?!';
  let text = '';

  for (let i = 0; i < 4; i++)
    text += charList.charAt(Math.floor(Math.random() * charList.length));

  return text;
};

const time: OnRequestMiddlewareDefinition | OnResponseMiddlewareDefinition | GenericMiddlewareDefinition = ({
  type: [MiddlewareType.OnResponse, MiddlewareType.OnRequest, MiddlewareType.None],
  name: 'time',

  run(this: HttpClient, type: MiddlewareType, reqOrRes?: Request | Response, res?: Response) {
    if (type === MiddlewareType.None) {
      this.middleware.set('time', { pings: [], currentId: null, lastPing: -1, startPing: -1 });

      const logger = this.middleware.get('logger');
      logger?.info('Installed the time middleware');
      return;
    }

    if (type === MiddlewareType.OnRequest) {
      const time = this.middleware.get('time')!;
      const start = process.hrtime();
      const currentId = createId();

      this.middleware.set('time', {
        pings: time.pings,
        currentId,
        lastPing: time.lastPing,
        startPing: start
      });

      return;
    }

    if (type === MiddlewareType.OnResponse) {
      const { startPing, pings } = this.middleware.get('time')!;
      const time = calculateHRTime(startPing);

      pings.push(time);
      this.middleware.set('time', {
        pings,
        startPing: -1,
        currentId: null,
        lastPing: time
      });

      const logger = this.middleware.get('logger');
      logger?.info(`Request -> Response took ~${time}ms to execute.`);

      return;
    }
  }
});

export default time;
