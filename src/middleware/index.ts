import type Client from '../HttpClient';
import compress from './EnableCompressedData';
import streams from './EnableStreams';
import logging from './Logging';
import forms from './FormData';
import blobs from './Blob';

export interface Middleware {
  intertwine(this: Client): void;
  cycleType: CycleType;
  name: string;
}

export enum CycleType {
  Execute = 'execute',
  Done = 'done',
  None = 'none'
}

export { compress, streams, logging, forms, blobs };
