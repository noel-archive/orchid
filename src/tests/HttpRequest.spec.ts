import HttpResponse from '../HttpResponse';
import HttpRequest from '../HttpRequest';
import HttpClient from '../HttpClient';
import compress from '../middleware/EnableCompressedData';
import { URL } from 'url';

interface JsonPlaceholder {
  completed: boolean;
  userId: number;
  title: string;
  id: number;
}

describe('orchid.HttpRequest', () => {
  let client!: HttpClient;
  beforeEach(() =>
    client = new HttpClient()
  );

  it('should provide a new HttpRequest with the default values', () => {
    const request = new HttpRequest(client, { url: 'https://test.org' });

    expect(request.url).toBeInstanceOf(URL);
    expect(request.method).toStrictEqual('GET');
    expect(request.timeout).toBeNull();
    expect(request.streaming).toBeFalsy();
  });

  it('should throw an error if we don\'t have the Streaming middleware injected', () => {
    const request = new HttpRequest(client, {
      stream: true,
      url: 'https://test.org'
    });

    expect(() => request.stream()).toThrow(Error);
  });

  it('should enable compressed data', () => {
    client.use(compress());
    const request = new HttpRequest(client, {
      url: 'https://test.org'
    });

    expect(() => request.compress()).not.toThrow(Error);
    expect((() => {
      request.compress();
      return request.headers;
    })()).toStrictEqual({ 'accept-encoding': 'gzip, deflate' });
  });

  it('should add `{ a: b }` as an header', () => {
    const request = new HttpRequest(client, { url: 'https://test.org' });

    expect(request.headers).toStrictEqual({});
    request.header({ a: 'b' });

    expect(request.headers).toStrictEqual({ a: 'b' });
  });

  it('should return a HttpResponse back', async() => {
    const client = new HttpClient();
    const res = await client.get('https://jsonplaceholder.typicode.com/todos/1');

    expect(res).toBeInstanceOf(HttpResponse);
  });

  it('should return a JSON response back', async() => {
    const client = new HttpClient();
    const res = await client.get('https://jsonplaceholder.typicode.com/todos/1');

    expect(res).toBeInstanceOf(HttpResponse);

    const data = res.json<JsonPlaceholder>();
    expect(data).toStrictEqual<JsonPlaceholder>({
      completed: false,
      userId: 1,
      title: 'delectus aut autem',
      id: 1
    });
  });
});
