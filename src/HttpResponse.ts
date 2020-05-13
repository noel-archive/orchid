import { IncomingMessage } from 'http';
import HttpError from './HttpError';

export default class HttpResponse {
  /** The core message */
  private core: IncomingMessage;

  /** The body as a Buffer */
  private body: Buffer;

  constructor(core: IncomingMessage, public isStreaming: boolean) {
    this.core = core;
    this.body = Buffer.alloc(0);
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
   * Returns a stream
   */
  stream() {
    if (!this.isStreaming) throw new Error('You didn\'t make this request into a Streamable object');
    return this.core; // This is a stream, yes it is
  }
}