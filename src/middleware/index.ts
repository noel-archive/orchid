import compress from './EnableCompressedData';
import streams from './EnableStreams';
import logging from './Logging';
import Client from '../HttpClient';

export interface Middleware {
  intertwine(this: Client): void;
  name: string;
}

export { compress, streams, logging };