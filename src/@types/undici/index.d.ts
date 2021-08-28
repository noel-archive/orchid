import Dispatcher from './dispatcher';
import { setGlobalDispatcher, getGlobalDispatcher } from './global-dispatcher';
import Pool from './pool';
import Client from './client';
import errors from './errors';
import Agent from './agent';
import MockClient from './mock-client';
import MockPool from './mock-pool';
import MockAgent from './mock-agent';
import mockErrors from './mock-errors';
import { request, pipeline, stream, connect, upgrade } from './api';

declare namespace undici {
  const Dispatcher: typeof import('./dispatcher');
  const Pool: typeof import('./pool');
  const Client: typeof import('./client');
  const errors: typeof import('./errors');
  const Agent: typeof import('./agent');
  const setGlobalDispatcher: typeof import('./global-dispatcher').setGlobalDispatcher;
  const getGlobalDispatcher: typeof import('./global-dispatcher').getGlobalDispatcher;
  const request: typeof import('./api').request;
  const stream: typeof import('./api').stream;
  const pipeline: typeof import('./api').pipeline;
  const connect: typeof import('./api').connect;
  const upgrade: typeof import('./api').upgrade;
  const MockClient: typeof import('./mock-client');
  const MockPool: typeof import('./mock-pool');
  const MockAgent: typeof import('./mock-agent');
  const mockErrors: typeof import('./mock-errors');
}

export {
  Dispatcher,
  Pool,
  Client,
  errors,
  Agent,
  request,
  stream,
  pipeline,
  connect,
  upgrade,
  setGlobalDispatcher,
  getGlobalDispatcher,
  MockClient,
  MockPool,
  MockAgent,
  mockErrors,
};

declare function undici(url: string, opts: Pool.Options): Pool;
export default undici;
export as namespace undici;
