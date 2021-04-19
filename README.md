# @augu/orchid
> 🛫 **Simple and lightweight way to create a HTTP request to the world, with more features sprinkled in.**
>
> 👉 View other branches: [1.x branch](https://github.com/auguwu/orchid/tree/1.x) | [2.x branch](https://github.com/auguwu/orchid/tree/2.x)

## Features
- Middleware: Orchid has a Express-like interface for creating middleware to extend classes like Request, Response, and HttpClient.
- Serialization: Orchid provides a serialization system to serialize the response body from the Content Type from the server, so far JSON and Text are supported.
- Path Parameters: Apply path parameters similar to Express routes!
- Simple: Orchid has a simple API so there is no steep learning curve when moving!

## Usage
```js
const { HttpClient, middleware } = require('@augu/orchid');

const orchid = new HttpClient();
orchid
  .use(middleware.logging())

orchid
  .get('https://floofy.dev')
  .then((res) => console.log(res.body()))
  .catch(error => console.error(error));
```

## Install
@augu/orchid requires Node.js v14 or higher to use since it uses ES2020 features like optional chaining (`?.`)

```sh
$ npm install @augu/orchid
```

## Middleware
Orchid allows to have custom middleware to do whatever you want from a request or response. An example would be:

```js
const { MiddlewareType } = require('@augu/orchid');

module.exports = {
  name: 'my.middleware',

  // this is a "MultiMiddleware" type
  types: [MiddlewareType.Request, MiddlewareType.Response],

  init() {
    // called when the middleware is added
  },

  onRequest(req) {
    // called when a request has been made
  },

  onResponse(client, req, res) {
    // called when a response is made
    // `client` and `req` are added to do whatever
  }
};
```

## Serialization
Orchid allows you to serialize your own data without doing it yourself every time you make a request. Currently, this is only limited
to `Response.body()`.

An example on building a XML serializer would look like this:

```js
const { Serializer } = require('@augu/orchid');

module.exports = class XMLSerializer extends Serializer {
  constructor() {
    super(/application\/xhtml[+]xml/gi);
  }

  serialize(data) {
    const str = data.toString();
    return someXMLParser(str);
  }
}
```

Then we inject it into our http client or adding it with `orchid#method`

```js
// HttpClient
const client = new HttpClient({
  serializers: [new XMLSerializer()]
});

// Method function
orchid.get({
  serializers: [new XMLSerializer()]
});
```

## Migration Guide
### v1.0 / v1.1 -> v1.2
All this version really does is add `middleware` or `agent` (or both!) to the constructor

```js
new HttpClient([]); // adds middleware only
new HttpClient('my agent'); // adds the agent only
new HttpClient([], 'my agent'); // adds middleware and the agent
```

### v1.2 -> v1.3
Now the HttpClient's constructor is an object like this:

```ts
interface HttpClientOptions {
  middleware?: Middleware[]; // add any middleware
  baseUrl?: string; // Use a base URL
  agent?: string; // Adds an agent
}
```

### v1.3 -> v1.4
The HttpClient's constructor is now like:

```ts
interface HttpClientOptions {
  middleware?: Middleware[];
  defaults?: DefaultRequestOptions;
  agent?: string;
}
    
interface DefaultRequestOptions {
  followRedirects?: boolean;
  headers?: { [x: string]: any }
  timeout?: number;
  baseUrl?: string;
}
```

## v1.x -> v2.x
Read the [migration](./migrating/v2.md) notes for more information.

## v2.x -> v3.x
Read the [migration](./migrating/v3.md) notes for more information.

## License
**@augu/orchid** is released under the MIT License, read [here](/LICENSE) for more information. :heart:
