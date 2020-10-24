import { IncomingMessage, IncomingHttpHeaders, STATUS_CODES } from 'http';
import HttpError from './errors/HttpError';
import type zlib from 'zlib';
import Blob from './internals/Blob';

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

  constructor(core: IncomingMessage, isStreaming: boolean, private canBlob: boolean) {
    this.shouldStream = isStreaming;
    this.statusCode = core.statusCode ? core.statusCode! : 200;
    this.headers = core.headers;
    this.core = core;
    this.body = Buffer.alloc(0);
  }

  /** If the response is successful or not */
  get successful() {
    return this.statusCode >= 200 || this.statusCode < 300;
  }

  /** Returns a prettified version of the status */
  get status() {
    return `${this.statusCode} ${STATUS_CODES[this.statusCode]}`;
  }

  /** Returns if the body of the response is empty */
  get isEmpty() {
    return this.body.length === 0;
  }

  /**
   * Sets the encoding of the response
   * @param encoding The encoding to set
   */
  setEncoding(encoding: BufferEncoding) {
    this.core.setEncoding(encoding);
    return this;
  }

  /**
   * Adds a chunk to the body
   * @param chunk The chunk to add
   */
  addChunk(chunk: any) {
    this.body = Buffer.concat([this.body, chunk]);
  }

  /**
   * Turns the body into a JSON response
   * @returns The response as the typed object
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
   * @returns The text itself
   */
  text() {
    return this.body.toString();
  }

  /**
   * Returns the raw buffer
   * @returns The buffer itself
   */
  raw() {
    return this.body;
  }

  /**
   * Returns a Blob of the response
   */
  blob() {
    if (!this.canBlob) throw new Error('Missing `blob` middleware');
    return new Blob([this.raw()], this.headers.hasOwnProperty('content-type') ? { type: this.headers['content-type']! } : { type: '' });
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

  /**
   * Pipes anything to this [Response] instance
   * @param item The item to use Stream.pipe in
   * @param options The options to use
   * @returns That stream's instance
   */
  pipe<T extends NodeJS.WritableStream>(item: T, options?: { end?: boolean }) {
    return this.core.pipe(item, options);
  }
}
