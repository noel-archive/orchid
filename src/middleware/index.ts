import compress from './EnableCompressedData';
import streams from './EnableStreams';
import logging from './Logging';
import Client from '../HttpClient';
import forms from './FormData';

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

export { compress, streams, logging, forms };