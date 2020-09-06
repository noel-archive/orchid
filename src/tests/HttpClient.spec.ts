import { CycleType } from '../middleware';
import HttpClient from '../HttpClient';

const version = require('../../package.json').version;
describe('orchid.HttpClient', () => {
  it('should provide the default options', () => {
    const client = new HttpClient();

    expect(client.middleware.isEmpty()).toBeTruthy();
    expect(client.userAgent).toStrictEqual(`Orchid (v${version}, https://github.com/auguwu/Orchid)`);
    expect(client.defaults).toStrictEqual({});
  });

  it('should provide with newly created options', () => {
    const client = new HttpClient({
      agent: 'test/1.0.0 (v1.0.0, https://augu.dev)',
      middleware: [
        {
          name: 'test',
          cycleType: CycleType.None,
          intertwine() {
            this.middleware.add('a', 'b');
          }
        },
        {
          name: 'owo',
          cycleType: CycleType.Execute,
          intertwine() {
            console.log('deez nuts');
          }
        }
      ]
    });

    expect(client.middleware.isEmpty()).toBeFalsy();
    expect(client.userAgent).toStrictEqual('test/1.0.0 (v1.0.0, https://augu.dev)');
    expect(client.defaults).toStrictEqual({});
  });

  it('should not be empty (Middleware)', () => {
    const client = new HttpClient();
    expect(client.middleware.isEmpty()).toBeTruthy();

    client.use({
      name: 'test',
      cycleType: CycleType.Execute,
      intertwine() {
        this.middleware.add('this', true);
      }
    });
    expect(client.middleware.isEmpty()).toBeFalsy();
  });
});
