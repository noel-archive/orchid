const { HttpClient, middleware } = require('../build');
const FormData = require('form-data');

const orchid = new HttpClient({
  baseUrl: 'https://httpbin.org',
  middleware: [
    middleware.logging({ namespace: 'Suite #1' }), 
    middleware.forms()
  ]
});

const data = new FormData();
data.append('a', 'b');

orchid
  .request({
    method: 'post',
    url: '/post',
    data
  }).then(res => console.log(res.json())).catch(console.error);