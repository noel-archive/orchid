# @augu/orchid
> :flight_arrival: **| Simple, lightweight and customizable HTTP client for Node and the browser :rocket:**

## Usage
v2 Usage soon

### Browsers
Add this to your style tag to expose the `orchid` object

```html
<!-- This will add the latest build of Orchid, best recommended to use this! -->
<script src='https://cdn.floofy.dev/libraries/orchid/latest/orchid.js'></script>

<!-- This will target a specific build, it's best recommended to use the latest build -->
<script src='https://cdn.floofy.dev/libraries/orchid/<version>/orchid.js'></script>
```

## Middleware
v2 Usage soon

## Serializers
> :warning: **This feature is under v2 or higher and will not work in v1.**

Serializers in Orchid is a way to serialize data without doing it yourself in your code and will be injected into `HttpResponse`, so you can do `HttpResponse.json()` for the **JsonSerializer** as an example.

```js
const { Serializer } = require('@augu/orchid');

// Define it as a [Serializer] object, will be infered as `Serializer`
const serializer = {
  name: 'json',
  type: 'application/json', // content type

  // `data` => Buffer
  serialize(data) {
    const body = data.toString();
    return JSON.parse(body);
  }
};

// Define it as a class, must be extended
class JsonSerializer extends Serializer {
  constructor() {
    super({
      name: 'json',
      type: 'application/json'
    });
  }

  // data => Buffer
  serialize(data) {
    const body = data.toString();
    return JSON.parse(body);
  }
}
```

To apply your serializer, you must add it when creating a `HttpClient` or `BrowserHttpClient` or pass in by `serializers` when using the methods.

```js
// HttpClient/BrowserHttpClient
const { HttpClient } = require('@augu/orchid');
const MySerializer = require('./path/to/my/serializer');

const client = new HttpClient({
  serializers: [Serializer]
});

client
  .get('https://some-api.com/:version/cat', {
    serialize: 'cat'
    params: {
      version: '1'
    }
  })
  .then(res => {
    // Data will be inferred as the custom serializer (if you named it `cat`)
    const data = res.data();
    console.log(`Cat Image: ${data.cat}`);
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

### 1.4.x -> v2
- For browser usage, use the `BrowserHttpClient` else use `HttpClient`
- URLs can be stacked with path parameters
- Base URL is now in the `HttpClientOptions` instead of the `DefaultRequestOptions`
- Middleware functionality now is different when creating
- Serializers are now a new thing :tada:

> HttpClient v2 example

```js
const { HttpClient, HttpError, middleware } = require('@augu/orchid');
const client = new HttpClient({
  baseUrl: 'https://some-url.com'
});

client
  .get('/some/:path', {
    params: {
      path: 'something'
    }
  })
  .then(res => {
    // Data is now inferred from it's "Content-Type"
    // So, you don't need to use `res.json()` for JSON blobs
    // Methods like res.json() are here to backwards compailibity
    const data = res.data();
    console.log(data);
  }).catch(error => {
    // `HttpError` is now exposed, so you can check if it's an instance of `HttpError`
    if (error instanceof HttpError) console.log(`Failed on request ${error.url} (${error.status}):\n${error.message}`);
  });
```

> Middleware v2 example

```js
const { Middleware } = require('@augu/orchid');

// Define it as an object, it'll be created with `Middleware` in mind
// when injecting
const mod = {
  name: 'middleware',
  type: 'execute',
  setup() {
    // Proceed setup here
  }
};

// Define it as the `Middleware` class, can be extendable if wished.
const mod = new Middleware({
  name: 'middleware',
  type: 'execute'
});

mod.setup((client) => {
  // setup stuff here
  // function arguments are different by it's `type`
  // 
  // 'none' will return `client`
  // 'request'/'response' will return it's correspondant type
  // 'executed' will return nothing
  // 'serialised' will return the data that was serialised
});
```

## License
**Orchid** is released under the MIT License, read [here](/LICENSE) for more information