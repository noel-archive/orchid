# @augu/orchid
> :flight_arrival: **| Simple, lightweight and customizable HTTP client**
> 
> [Documentation](https://docs.augu.dev/orchid) **|** [NPM](https://npmjs.com/package/@augu/orchid)

## Usage
```ts
import { HttpClient, HttpMethod, middleware } from '@augu/orchid';

const http = new HttpClient()
  .use(middleware.logging()) // Enables logging (if ur into that kind of stuff)
  .use(middleware.enableStreams()) // Enables to make the request into a stream
  .use(middleware.enableZlib()); // Enables compressed data

const url = new URI('https://augu.dev');
http.request({
  url, // You can use a string if you want
  method: HttpMethod.Get,
}).then(res => {
  const html = res.text();
  console.log(html);
}).catch(error => {
  console.error(`${error.name} [${error.code}]: ${error.message}`);
});
```

## License
**Orchid** is released under the MIT License, read [here](/LICENSE) for more information