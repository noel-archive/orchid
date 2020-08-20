const { HttpClient, middleware } = require('../build');
const FormData = require('form-data');

const orchid = new HttpClient({
  defaults: {
    baseUrl: 'https://httpbin.org'
  },
  middleware: [
    middleware.logging({ namespace: 'Suite #1', useConsole: true }),
    middleware.forms()
  ]
});

const augu = new HttpClient({
  defaults: { baseUrl: 'https://augu.dev' },
  middleware: [middleware.logging({ namespace: 'Suite #1', useConsole: true })]
});

const data = new FormData();
data.append('a', 'b');

orchid.post('/post', { data }).then(console.log).catch(console.error);
augu.get('/').then(console.log).catch(console.error);
