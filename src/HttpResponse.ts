import { IncomingMessage, IncomingHttpHeaders, STATUS_CODES } from 'http';
import HttpError from './HttpError';
import zlib from 'zlib';

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
   * @param chunk The chunk to add
   */
  addChunk(chunk: any) {
    this.body = Buffer.concat([this.body, chunk]);
  }

  /**
   * Turns the body into a JSON response
   */
  json<T = any>(): T {
    try {
      return JSON.parse(this.body.toString());
    } catch {
      throw new HttpError(500, 'Unable to parse body into a JSON structure');
    }
  }

  /**
   * Turns the body into a string
   */
  text() {
    return this.body.toString();
  }

  /**
   * Returns the HTTP stream or the zlib stream if data was compressed
   */
  stream(): IncomingMessage | zlib.Deflate | zlib.Gunzip {
    if (!this.shouldStream) throw new Error('You didn\'t make this request into a Streamable object');
    return this.core as any; // This is a stream, yes it is
  }
}