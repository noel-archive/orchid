# @augu/orchid
> :flight_arrival: **| Simple, lightweight and customizable HTTP client**
> 
> [Documentation](https://docs.augu.dev/orchid) **|** [NPM](https://npmjs.com/package/@augu/orchid)

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

## License
**Orchid** is released under the MIT License, read [here](/LICENSE) for more information