export default class TimeoutError extends Error {
  public timeout: number;
  public url: string;

  constructor(url: string, timeout: number) {
    super(`URL ${url} has timeout after ${timeout}ms`);

    Error.captureStackTrace(this, this.constructor);

    this.timeout = timeout;
    this.name = 'TimeoutError';
    this.url = url;
  }
}
