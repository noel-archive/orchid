import getOption from '../util/getOption';

describe('orchid.utilities', () => {
  it('should return the default value for [util.getOption]', () => {
    // @ts-ignore
    const option = getOption('a', 'b', {});
    expect(option).toStrictEqual('b');
  });

  it('should return the value for [util.getOption]', () => {
    const option = getOption('owo', 'uwu', { owo: 'uwu' });
    expect(option).toStrictEqual('uwu');
  });
});
