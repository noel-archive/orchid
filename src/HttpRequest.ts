import { CycleType } from './middleware';
import HttpResponse from './HttpResponse';
import HttpClient from './HttpClient';
import HttpError from './HttpError';
import FormData from 'form-data';
import { URL } from 'url';
import https from 'https';
import http from 'http';
import zlib from 'zlib';

export interface RequestOptions {
  /** If we should follow redirects */
  followRedirects?: boolean;

  /** If we should compress the data */
  compress?: boolean;

  /** Any additional headers to add (you can add more with `HttpRequest#header`) */
  headers?: { [x: string]: any };

  /** The abort timeout until the request times out */
  timeout?: number;

  /** The method to use */
  method: HttpMethod;

  /** Make this request into a stream */
  stream?: boolean;

  /** Any packets of data to send */
  data?: any;

  /** The URL to make the request to */
  url: string | URL;
}

type HttpMethod = 'options' | 'connect' | 'delete' | 'trace' | 'head' | 'post' | 'put' | 'get'
  | 'OPTIONS' | 'CONNECT' | 'DELETE' | 'TRACE' | 'HEAD' | 'POST' | 'PUT' | 'GET';

function isUppercase(text: string) {
  const upper = text.toUpperCase();
  return text === upper;
}

function figureData(this: HttpRequest, packet: unknown): any {
  if (typeof packet === 'string') return packet;
  if (packet instanceof Object) {
    if (!this.headers.hasOwnProperty('content-type') || this.headers['content-type'] !== 'application/json') {
      this.headers['content-type'] = 'application/json';
    }

    return packet;
  }
  if (packet instanceof Buffer) return packet;
  if (packet instanceof FormData) {
    if (!this._has('form')) throw new Error('Missing "forms" middleware');
    if (!this.headers.hasOwnProperty('content-type') || this.headers['content-type'] !== 'application/x-www-form-urlencoded') this.headers['content-type'] = 'application/x-www-form-urlencoded';
    if (!this.headers.hasOwnProperty('content-type')) this.headers['content-length'] = Buffer.byteLength(packet.getBuffer());
    return packet.getBuffer();
  }
}

export default class HttpRequest {
  /** If we should follow redirects */
  public followRedirects: boolean;

  /** If we should compress the data */
  public compressData: boolean;

  /** Any additional headers to add (you can add more with `HttpRequest#header`) */
  public headers: { [x: string]: any };

  /** The abort timeout until the request times out */
  public timeout: number | null;

  /** The client that is private to this class */
  private client: HttpClient;

  /** If this request should return the HTTP stream */
  public streaming: boolean;

  /** The method to use */
  public method: HttpMethod;

  /** Any packets of data to send */
  public data: any;

  /** The URL to make the request to */
  public url: URL;

  /**
   * Creates a new HTTP request
   * @param client The client
   * @param options The options to use
   */
  constructor(client: HttpClient, options: RequestOptions) {
    if (typeof options.url !== 'string') throw new Error('The request URL was not a String');

    this.followRedirects = options.hasOwnProperty('followRedirects') ? options.followRedirects! : false;
    this.compressData = options.hasOwnProperty('compress') ? options.compress! : false;
    this.streaming = options.hasOwnProperty('stream') ? options.stream! : false;
    this.headers = options.hasOwnProperty('headers') ? options.headers! : {};
    this.timeout = options.hasOwnProperty('timeout') ? options.timeout! : null;
    this.client = client;
    this.method = isUppercase(options.method) ? (options.method.toLowerCase() as HttpMethod) : options.method;
    this.data = options.hasOwnProperty('data') ? figureData.apply(this, [options.data!]) : null;
    this.url = (options.url as any) instanceof URL ? (options.url as any as URL) : new URL(options.url as string);
  }

  _has(name: string) {
    return this.client.middleware.has(name);
  }  

  /**
   * Make this request into a stream (must add the Streams middleware or it'll error!)
   */
  stream() {
    if (!this.client.middleware.has('stream')) throw new Error('Missing the Stream middleware');
    this.streaming = true;

    return this;
  }

  /**
   * Make this request compress data (must add the Compress middleware)
   */
  compress() {
    if (!this.client.middleware.has('compress')) throw new Error('Missing the Compress Data middleware');
    if (!this.headers.hasOwnProperty('accept-encoding')) this.headers['accept-encoding'] = 'gzip, deflate';
    this.compressData = true;

    return this;
  }

  /**
   * Adds a query parameter to the URL
   * @param obj The queries as an object of `key`=`value`
   */
  query(obj: { [x: string]: string }): this;

  /**
   * Adds a query parameter to the URL
   * @param name The name of the query
   * @param value The value of the query
   */
  query(name: string, value: string): this;

  /**
   * Adds a query parameter to the URL
   * @param name An object of key-value pairs of the queries
   * @param value The value (if added)
   */
  query(name: string | { [x: string]: string }, value?: string) {
    if (name instanceof Object) {
      for (const [key, val] of Object.entries(name)) this.url.searchParams[key] = val; 
    } else {
      this.url.searchParams[name as string] = value!;
    }

    return this;
  }

  /**
   * Adds a header to the request
   * @param obj The headers as an object of `key`=`value`
   */
  header(obj: { [x: string]: string }): this;

  /**
   * Adds a header to the request
   * @param name The name of the header
   * @param value The value of the header
   */
  header(name: string, value: any): this;

  /**
   * Adds a header to the request
   * @param name An object of key-value pairs of the headers
   * @param value The value (if added)
   */
  header(name: string | { [x: string]: string }, value?: any) {
    if (name instanceof Object) {
      for (const [key, val] of Object.entries(name)) this.headers[key] = val;
    } else {
      this.header[name as string] = value!;
    }

    return this;
  }

  /**
   * Sends data to the server
   * @param packet The data packet to send
   */
  body(packet: unknown) {
    this.data = figureData.apply(this, [packet]);
    return this;
  }

  /**
   * Sets a timeout to wait for
   * @param timeout The timeout to wait for
   */
  setTimeout(timeout: number) {
    if (isNaN(timeout)) throw new Error('Timeout was not a number.');

    this.timeout = timeout;
    return this;
  }

  /**
   * If we should follow redirects
   */
  redirect() {
    this.followRedirects = true;
    return this;
  }

  then(resolve?: (res: HttpResponse) => void, reject?: (error: HttpError) => void) {
    return this.execute()
      .then(resolve, reject);
  }

  catch(callback: (error: HttpError) => void) {
    return this.then(undefined, callback);
  }

  /**
   * Execute the request
   */
  protected execute() {
    const logger = this.client.middleware.get('logger');
    if (logger) logger.info(`Attempting to make a request to "${this.method.toUpperCase()} ${this.url}"`);

    const middleware = this.client.middleware.filter(CycleType.Execute);
    for (const ware of middleware) ware.intertwine.apply(this.client);

    return new Promise<HttpResponse>((resolve, reject) => {
      if (!this.headers.hasOwnProperty('user-agent')) this.headers['user-agent'] = this.client.userAgent;

      const onRequest = async (res: http.IncomingMessage) => {
        if (this.client.middleware.has('streams')) {
          this.streaming = this.client.middleware.get('streams');
        }

        if (this.client.middleware.has('compress')) {
          this.compressData = this.client.middleware.get('compress');
        }

        const response = new HttpResponse(res, this.streaming);
        if (this.compressData) {
          switch (res.headers['content-encoding']) {
            case 'gzip': {
              res.pipe(zlib.createGunzip());
            } break;

            case 'deflate': {
              res.pipe(zlib.createDeflate());
            } break;
          }
        }

        if (res.headers.hasOwnProperty('location') && this.followRedirects) {
          const url = new URL(res.headers.location!, this.url);
          const req = new (this.constructor as typeof HttpRequest)(this.client, {
            method: this.method,
            url
          });

          return await req.execute();
        }
      
        res.on('error', (error) => {
          const httpError = new HttpError(1003, `Tried to serialise data, was unsuccessful (${error.message})`);
          if (logger) logger.error(`Tried to serialise data, was unsuccessful (${error.message})`);
          return reject(httpError);
        });
        res.on('data', chunk => response.addChunk(chunk));
        res.on('end', () => {
          if (!response.successful) return reject(new HttpError(response.statusCode, response.status.replace(`${response.statusCode} `, '')));
          else {
            const middleware = this.client.middleware.filter(CycleType.Done);
            for (const ware of middleware) ware.intertwine.apply(this.client);

            return resolve(response);
          }
        });
      };

      const request = this.url.protocol === 'https:' ? https.request : http.request;
      const req = request({
        protocol: this.url.protocol,
        headers: this.headers,
        method: this.method,
        path: `${this.url.pathname}${this.url.search}`,
        port: this.url.port,
        host: this.url.hostname
      }, onRequest);

      if (this.timeout) {
        req.setTimeout(this.timeout, () => {
          req.abort();
          if (!this.streaming) reject(new HttpError(1002, 'Server has timed out'));
        });
      }

      req.on('error', (error) => {
        const httpError = new HttpError(1004, `Unable to make a ${this.method.toUpperCase()} request to ${this.url} (${error.message})`);
        if (logger) logger.error(`Unable to make a ${this.method.toUpperCase()} request to ${this.url} (${error.message})`);
        return reject(httpError);
      });

      if (this.data) {
        if (this.data instanceof Object) req.write(JSON.stringify(this.data));
        else req.write(this.data);
      }

      req.end();
    });
  }
}