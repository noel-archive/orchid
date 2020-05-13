export default class HttpError extends Error {
  constructor(code: number, message: string) {
    super(message);

    Error.captureStackTrace(this);
    this.name = `HttpError [${code}]`;
  }
}