import { IncomingMessage, IncomingHttpHeaders, STATUS_CODES } from 'http';
import HttpError from './HttpError';
import type zlib from 'zlib';

export default class HttpResponse {
  /** If the response should use `stream` */
  public shouldStream: boolean;

  /** The status code */
  public statusCode: number;

  /** The headers that came */
  public headers: IncomingHttpHeaders;

  /** The core message */
  private core: IncomingMessage;

  /** The body as a Buffer */
  private body: Buffer;

  constructor(core: IncomingMessage, isStreaming: boolean) {
    this.shouldStream = isStreaming;
    this.statusCode = core.statusCode ? core.statusCode! : 200;
    this.headers = core.headers;
    this.core = core;
    this.body = Buffer.alloc(0);
  }

  /** If the response is successful or not */
  get successful() {
    return this.statusCode <= 200 || this.statusCode > 300;
  }

  /** Returns a prettified version of the status */
  get status() {
    return `${this.statusCode} ${STATUS_CODES[this.statusCode]}`;
  }

  /**
   * Adds a chunk to the body
   * @param {any} chunk The chunk to add
   * @returns {void}
   */
  addChunk(chunk: any) {
    this.body = Buffer.concat([this.body, chunk]);
  }

  /**
   * Turns the body into a JSON response
   * @returns {T} The response as the typed object
   */
  json<T = { [x: string]: any }>(): T {
    try {
      return JSON.parse(this.body.toString());
    } catch {
      throw new HttpError(1006, 'Unable to parse body into a JSON structure');
    }
  }

  /**
   * Turns the body into a string
   * @returns {string} The text itself
   */
  text() {
    return this.body.toString();
  }

  /**
   * Returns the raw buffer
   * @returns {Buffer} The buffer itself
   */
  raw() {
    return this.body;
  }

  /**
   * Returns the HTTP stream or the zlib stream if data was compressed
   * @returns {IncomingMessage | zlib.Deflate | zlib.Gunzip} Returns the following:
   * - **IncomingMessage**: Nothing was changed, i.e HttpRequest#compress wasn't called
   * - **zlib.Deflate**: Returns the deflate that zlib has used
   * - **zlib.Gunzip**: Returns a deflate but gun-zipped
   */
  stream(): IncomingMessage | zlib.Deflate | zlib.Gunzip {
    if (!this.shouldStream) throw new Error('You didn\'t make this request into a Streamable object');
    return this.core as any; // This is a stream, yes it is
  }
}
