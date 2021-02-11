# @augu/orchid
> :flight_arrival: **Simple and lightweight way to create a HTTP request to the world, with more features sprinkled in.**

## Features
- Middleware: Orchid has a Express-like interface for creating middleware to extend classes like Request, Response, and HttpClient.
- Serialization: Orchid provides a serialization system to serialize the response body from the Content Type from the server, so far JSON and Text are supported.
- Simple: Orchid has a simple API so there is no steep learning curve.

## Usage
```ts
import { HttpClient, HttpMethod, middleware } from '@augu/orchid';

const orchid = new HttpClient();
orchid
  .use(middleware.logging())
  .use(middleware.compress())
  .use(middleware.streams());

orchid
  .request({
    method: 'get', // 'GET' also works!
    url: 'https://augu.dev'
  }).execute().then((res) => {
    console.log(res.text());
  }).catch(console.error);
```

## Install
@augu/orchid requires Node.js v14 or higher to use since it uses ES2020 features like optional chaining (`?.`)

```sh
$ npm install @augu/orchid
```

## Middleware
Orchid allows anyone to apply custom middleware very easily, middleware except `form`, `logging`, `compress`, and `streams` will run when the request is being requested, readyed, etc (using Middleware#cycleType).

To make custom middleware, it's easy as cake! All you need is a function to return a Middleware object, like so:

```js
const { CycleType } = require('@augu/orchid');

module.exports = () => ({
  cycleType: CycleType.Execute,
  name: 'my:mid',
  intertwine() {
    // Now we do stuff here, we don't add the middleware since it does itself
  }
});
```

By putting this in your Orchid instance (in the constructor or using HttpClient#use), you can apply this middleware and Orchid will call Middleware#**intertwine** and calls it a day. But, if you use `cycleType`, then it'll run by it's type.

The type varies from it's callee, so if you wanna run it WHEN we call HttpRequest#execute, then use CycleType.EXECUTE

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
Orchid allows you to have Serialization and new middleware API, read [here](#) for more information.

## License
**@augu/orchid** is released under the MIT License, read [here](/LICENSE) for more information. :heart:
