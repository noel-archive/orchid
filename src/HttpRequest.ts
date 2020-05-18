import HttpResponse from './HttpResponse';
import HttpClient from './HttpClient';
import HttpError from './HttpError';
import { URL } from 'url';
import https from 'https';
import http from 'http';
import zlib from 'zlib';

export interface RequestOptions {
  /** If we should follow redirects */
  followRedirects?: boolean;

  /** If we should compress the data */
  compress?: boolean;

  /** An amount of attempts before closing this request */
  attempts?: number;

  /** Any additional headers to add (you can add more with `HttpRequest#header`) */
  headers?: { [x: string]: any };

  /** The abort timeout until the request times out */
  timeout?: number;

  /** The method to use */
  method: HttpMethod | HttpMethodAsString;

  /** Make this request into a stream */
  stream?: boolean;

  /** Any packets of data to send */
  data?: any;

  /** The URL to make the request to */
  url: string | URL;
}

export enum HttpMethod {
  Options = 'options',
  Connect = 'connect',
  Delete = 'delete',
  Trace = 'trace',
  Head = 'head',
  Post = 'post',
  Put = 'put',
  Get = 'get'
}

type HttpMethodAsString = 'options' | 'connect' | 'delete' | 'trace' | 'head' | 'post' | 'put' | 'get'
  | 'OPTIONS' | 'CONNECT' | 'DELETE' | 'TRACE' | 'HEAD' | 'POST' | 'PUT' | 'GET';

function isUppercase(text: string) {
  const upper = text.toUpperCase();
  return text === upper;
}

export default class HttpRequest {
  /** If we should follow redirects */
  public followRedirects: boolean;

  /** If we should compress the data */
  public compressData: boolean;

  /** An amount of attempts before closing this request */
  public attempts: number;

  /** Any additional headers to add (you can add more with `HttpRequest#header`) */
  public headers: { [x: string]: any };

  /** The abort timeout until the request times out */
  public timeout: number | null;

  /** If this request should return the HTTP stream */
  public streaming: boolean;

  /** The data to send as */
  public sendDataAs?: 'json' | 'buffer' | 'form' | 'string';

  /** The method to use */
  public method: HttpMethodAsString;

  /** Any packets of data to send */
  public data: any;

  /** The URL to make the request to */
  public url: URL;

  /** The client that is private to this class */
  #client: HttpClient;

  /**
   * Creates a new HTTP request
   * @param client The client
   * @param options The options to use
   */
  constructor(client: HttpClient, options: RequestOptions) {
    if (typeof options.url !== 'string') throw new Error('The request URL was not a String');

    this.followRedirects = options.hasOwnProperty('followRedirects') ? options.followRedirects! : false;
    this.compressData = options.hasOwnProperty('compress') ? options.compress! : false;
    this.sendDataAs = undefined;
    this.streaming = options.hasOwnProperty('stream') ? options.stream! : false;
    this.attempts = options.hasOwnProperty('attempts') ? options.attempts! : 5;
    this.#client = client;
    this.headers = options.hasOwnProperty('headers') ? options.headers! : {};
    this.timeout = options.hasOwnProperty('timeout') ? options.timeout! : null;
    this.method = isUppercase(options.method) ? (options.method.toLowerCase() as HttpMethodAsString) : options.method;
    this.data = options.hasOwnProperty('data') ? options.data! : null;
    this.url = (options.url as any) instanceof URL ? (options.url as any as URL) : new URL(options.url as string);
  }

  /**
   * Make this request into a stream (must add the Streams middleware or it'll error!)
   */
  stream() {
    if (!this.#client.middleware.has('stream')) throw new Error('Missing the Stream middleware');
    this.streaming = true;

    return this;
  }

  /**
   * Make this request compress data (must add the Compress middleware)
   */
  compress() {
    if (!this.#client.middleware.has('compress')) throw new Error('Missing the Compress Data middleware');
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
  body(packet: any, sda?: 'buffer' | 'json' | 'form') {
    const qs = require('querystring');
    const a = packet instanceof Object && !this.sendDataAs && !Buffer.isBuffer(packet) 
      ? 'json' 
      : sda!.toLowerCase();

    this.sendDataAs = a as any;
    this.data = sda === 'json' ? JSON.stringify(packet) : sda === 'form' ? qs.stringify(packet) : packet;
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

  /**
   * Execute the request
   */
  execute() {
    return new Promise<HttpResponse>((resolve, reject) => {
      if (this.data) {
        if (!this.headers.hasOwnProperty('user-agent')) this.headers['user-agent'] = `Orchid/${require('../package.json').version} (https://github.com/auguwu/Orchid)`;
        if (
          this.sendDataAs === 'json' && 
          !this.headers.hasOwnProperty('content-type') || 
          this.headers['content-type'] !== 'application/json'
        ) this.headers['content-type'] = 'application/json';

        if (this.sendDataAs === 'form') {
          const ENCODING = 'application/x-www-form-urlencoded';
          if (!this.headers.hasOwnProperty('content-type') || this.headers['content-type'] !== ENCODING) this.headers['content-type'] = ENCODING;
          if (!this.headers.hasOwnProperty('content-length')) this.headers['content-length'] = Buffer.byteLength(this.data);
        }
      }

      const onRequest = async (res: http.IncomingMessage) => {
        let logger: any;
        if (this.#client.middleware.has('streams')) {
          const api = this.#client.middleware.get('streams');
          this.streaming = api!;
        }

        if (this.#client.middleware.has('compress')) {
          const api = this.#client.middleware.get('compress');
          this.compressData = api!;
        }

        if (this.#client.middleware.has('logger')) {
          logger = this.#client.middleware.get('logger')!;
        }

        if (logger) logger.info(`Made a request to ${this.url}!`);
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
          const req = new (this.constructor as typeof HttpRequest)(this.#client, {
            method: this.method,
            url
          });

          return await req.execute();
        }
      
        res.on('error', (error) => reject(new HttpError(1001, error.message)));
        res.on('data', chunk => response.addChunk(chunk));
        res.on('end', () => resolve(response));
      };

      const request = this.url.protocol === 'https:' ? https.request : http.request;
      const req = request(this.url, onRequest);

      if (this.timeout) {
        req.setTimeout(this.timeout, () => {
          req.abort();
          if (!this.streaming) reject(new HttpError(1002, 'Server has timed out'));
        });
      }

      req.on('error', reject);

      if (this.data) {
        if (this.sendDataAs === 'json') req.write(JSON.stringify(this.data));
        if (this.data instanceof Object) req.write(JSON.stringify(this.data));
        else req.write(this.data);
      }

      req.end();
    });
  }
}