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

import { Request, RequestOptions } from '../../Request';
import { NodeHttpClient } from './NodeHttpClient';
import { Response } from '../../Response';

export class NodeRequest extends Request<RequestOptions, NodeHttpClient> {
  /** @inheritdoc */
  override execute() {
    // this.client.executeMiddleware('onrequest');

    return new Promise<Response>((resolve, reject) => {
      // TODO: this
    });
  }
}

/*
    this.#client.runMiddleware((type) => type === MiddlewareType.Executed, this);

    return new Promise<Response>((resolve, reject) => {
      // Apply the User-Agent header
      if (!this.headers.hasOwnProperty('user-agent'))
        this.headers['user-agent'] = this.#client.userAgent;

      const onResponse = (res: http.IncomingMessage) => {
        const resp = new Response(this.#client, res);
        if (this.compressData) {
          if (res.headers['content-encoding'] === 'gzip') res.pipe(createGunzip());
          if (res.headers['content-encoding'] === 'deflate') res.pipe(createDeflate());
        }

        if (res.headers.hasOwnProperty('location') && this.followRedirects) {
          const url = new URL(res.headers['location']!);
          const req = new (this.constructor as typeof Request)(this.#client, url, this.method, {
            followRedirects: this.followRedirects,
            compress: this.compressData,
            timeout: this.timeout,
            headers: this.headers,
            data: this.data
          });

          res.resume();
          return req
            .then(resolve)
            .catch(reject);
        }

        res.on('error', original => {
          const error = new HttpError('Tried to serialize request, but was unsuccessful');
          const logger = this.#client.middleware.get('logger') as LogInterface | undefined;
          logger?.error(`${error}\nCaused by:\n${original.stack}`);

          return reject(error);
        })
          .on('data', chunk => resp._chunk(chunk))
          .on('end', () => {
            if (!resp.success) return reject(Object.assign(new HttpError(resp.status), { body: resp.body() }));

            this.#client.runMiddleware(type => type === MiddlewareType.OnResponse, resp);
            return resolve(resp);
          });
      };

      const createRequest = this.url.protocol === 'https:' ? https.request : http.request;
      const req = createRequest({
        protocol: this.url.protocol,
        headers: this.headers,
        method: this.method,
        path: `${this.url.pathname}${this.url.search ?? ''}`,
        port: this.url.port,
        host: this.url.hostname
      }, onResponse);

      if (this.timeout !== null)
        req.setTimeout(this.timeout, () => {
          if (req.aborted) return;

          req.destroy();
          return reject(new TimeoutError(this.url.toString(), this.timeout!));
        });

      req.on('error', original => {
        const error = new HttpError(`Unable to create a request to "${this.method.toUpperCase()} ${this.url}"`);
        const logger = this.#client.middleware.get('logger') as LogInterface | undefined;

        logger?.error(`${error}\nCaused by:\n${original.stack}`);
        return reject(error);
      });

      // Just pipe the form data class to the request
      // It'll create the request anyway :shrug:
      if (this.data instanceof FormData) {
        this.#client.runMiddleware(type => type === MiddlewareType.OnRequest, this);
        this.data.pipe(req);
      } else {
        if (this.data) {
          if (isObject(this.data) || Array.isArray(this.data))
            req.write(JSON.stringify(this.data));
          else
            req.write(this.data);
        }

        this.#client.runMiddleware(type => type === MiddlewareType.OnRequest, this);
        req.end();
      }
    });
*/
