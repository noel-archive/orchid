import { compress, logging, forms, streams, CycleType } from './middleware';
import HttpClient from './HttpClient';

const middleware = { compress, logging, forms, streams };

export const version: string = require('../package.json').version;
export { HttpClient, middleware, CycleType };