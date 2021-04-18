# @augu/orchid
> :flight_arrival: **Simple and lightweight way to create a HTTP request to the world, with more features sprinkled in.**

## Features
- Middleware: Orchid has a Express-like interface for creating middleware to extend classes like Request, Response, and HttpClient.
- Serialization: Orchid provides a serialization system to serialize the response body from the Content Type from the server, so far JSON and Text are supported.
- Simple: Orchid has a simple API so there is no steep learning curve when moving!

## Usage
```js
const { HttpClient, middleware } = require('@augu/orchid');

const orchid = new HttpClient();
orchid
  .use(middleware.logging())
  .use(middleware.compress);

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
Orchid allows you to apply middleware to customize how Orchid works! Currently, there are 4 types of middleware youu can implement:

- `on.request`: Made when a request is being processed
- `on.response`: Made when orchid made a response!
- `none`: Nothing, apply your custom logic!
- `execute`: When you call `Request.execute()`, this will be ran

An example would be like:

```js
const { MiddlewareType } = require('@augu/orchid');

module.exports = {
  type: [MiddlewareType.None],
  name: 'name',

  run(client, type) {
    // this => this middleware
    // client => The HttpClient used
    // type => The middleware type
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
