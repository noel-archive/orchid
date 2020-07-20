const { HttpClient, middleware } = require('../build');
const FormData = require('form-data');
const { Signale } = require('signale');

const logger = new Signale({ scope: 'Suite #2' });
const orchid = new HttpClient({
  baseUrl: 'https://httpbin.org',
  middleware: [
    middleware.logging({ namespace: 'Suite #1', useConsole: true }),
    middleware.forms()
  ]
});

const augu = new HttpClient({
  baseUrl: 'https://augu.dev',
  middleware: [middleware.logging({ binding: (_, __, message) => message, useConsole: false, caller: (level, message) => logger[level](message) })]
});

const data = new FormData();
data.append('a', 'b');

orchid
  .request({
    method: 'post',
    url: '/post',
    data
  }).catch(console.error);

augu.request({ method: 'get', url: '/' }).catch(console.error);