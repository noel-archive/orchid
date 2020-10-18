const { HttpClient, middleware, get } = require('../build');
const FormData = require('form-data');

const orchid = new HttpClient({
  defaults: {
    baseUrl: 'https://httpbin.org',
    headers: {
      a: 'b',
      c: 'd'
    }
  },
  middleware: [
    middleware.logging({ namespace: 'Suite #1', useConsole: true }),
    middleware.forms()
  ]
});

const augu = new HttpClient({
  defaults: { baseUrl: 'https://augu.dev' },
  middleware: [middleware.logging({ namespace: 'Suite #2', useConsole: true })]
});

const data = new FormData();
data.append('a', 'b');

orchid
  .post('/post', { data: [Buffer.from('abcdef'), Buffer.from('ghijkl')] })
  .then((res) => console.log(res.json()))
  .catch(console.error);

augu
  .get('/')
  .then(() => console.log('cutie!'))
  .catch(console.error);

get('https://derpyenterprises.org', {
  middleware: [middleware.logging({ namespace: 'Suite #3', useConsole: true })]
})
  .then(() => console.log('derpy!'))
  .catch(console.error);
