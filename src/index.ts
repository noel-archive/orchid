import * as middleware from './middleware';
import HttpClient from './HttpClient';

export const version: string = require('../package.json').version;
export { HttpClient, middleware };