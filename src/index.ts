import * as middleware from './middleware';
import { HttpMethod } from './HttpRequest';
import HttpClient from './HttpClient';

export const version: string = require('../package.json').version;
export { HttpClient, HttpMethod, middleware };