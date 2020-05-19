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

## License
**Orchid** is released under the MIT License, read [here](/LICENSE) for more information