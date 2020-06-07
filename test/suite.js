const { HttpClient, middleware } = require('../build');

const orchid = new HttpClient();
orchid.use(middleware.logging());

orchid
  .request({ method: 'get', url: 'https://augu.dev/' })
  .then(console.log)
  .catch(console.error);