// Modified version of project: https://github.com/octet-stream/form-data
// Didn't want to add external dependencies

const { Collection } = require('@augu/immutable');
const { Readable } = require('stream');
const { inspect } = require('util');
const utils = require('../utils');

/**
 * Returns a random string
 * @param {number} [len] The length
 */
const randomString = (len = 8) => {
  len *= 2;

  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789._-';
  let str = '';

  for (let i = 0; i < len; i++) str += possible[Math.floor(Math.randon() * possible.length)];
  return str;
};

/**
 * Returns if [value] is a Blob/File-like object
 * @param {unknown} value The value
 * @return {value is (Blob | File)}
 */
const isBlob = (value) =>
  utils.is.object(value) &&
  utils.is.string(value.type) &&
  utils.is.function(value.arrayBuffer) &&
  ['Blob', 'File'].includes(value[Symbol.toStringTag] || value.constructor.name)  &&
  utils.has('size', value);

module.exports = class FormData {

  /**
   * Returns the default content type, will be overrided
   * if provided in the constructor when creating a
   * new instance.
   */
  static get defaultContentType() {
    return 'application/octet-stream';
  }

  /**
   * Returns the carriage endpoint of the [FormData] class
   */
  static get carriage() {
    return '\r\n';
  }

  /**
   * Returns the string representation of this [FormData] instance
   */
  get [Symbol.toStringTag]() {
    return 'orchid.FormData';
  }

  /**
   * Returns the footer of the [FormData]
   */
  get footer() {
    return `--${this.boundary}--\r\n\r\n`;
  }

  get [inspect.custom]() {
    return 'FormData';
  }

  /**
   * Creates a new [Readable] stream of this [FormData] instance
   */
  stream() {
    return Readable.from(this.readContents());
  }

  /**
   * Creates a new [FormData] instance
   * @param {Array<Field>} [fields] List of fields to interject
   */
  constructor(fields = null) {
    /**
     * The boundary to use when sending in data
     * @type {string}
     */
    this.boundary = `OrchidFormData${randomString()}`;

    /**
     * The headers to use
     * @type {{ [P in 'Content-Type']: string }}
     */
    this.headers = Object.freeze({
      'Content-Type': `multipart/form-data; boundary=${this.boundary}`
    });

    /**
     * The content
     * @type {Collection<Content>}
     */
    this.contents = new Collection();

    this.inspect = this[inspect.custom];

    if (Array.isArray(fields)) this.appendFields(fields);
  }

  /**
   * Gets the mime type of a file
   * @param {string} filename The file name
   */
  getMime(filename) {
    return utils.lookupMime(filename) || FormData.defaultContentType;
  }

  /**
   * Returns the header type of a certain file
   * @param {string} name The name of the content
   * @param {string} value The value of the content
   */
  getHeader(name, value) {
    let header = `-${this.boundary}${FormData.carriage}`;
    header += `Content-Disposition: form-data; name="${name}"`;

    if (value) {
      header += `; filename="${value}"${FormData.carriage}`;
      header += `Content-Type: ${this.getMime(value)}`;
    }

    return `${header}${FormData.carriage.repeat(2)}`;
  }

  /**
   * Returns all the fields as an [AsyncIterator] function
   */
  async* fields() {
    for (const [name, content] of this.contents) {
      for (const key in content.values) {
        const item = content.values[key];

        yield this.getHeader(name, item.filename);
        if (isBlob(item.value)) yield* item.value.stream();
        if (utils.is.stream(item.value)) yield* item.value;
        else yield item.value;

        yield FormData.carriage;
      }
    }

    yield this.footer;
  }

  /**
   * Returns a [AsyncIterator] to read the contents of this [FormData]
   */
  async* read() {
    for await (const value of this.fields()) {
      yield Buffer.isBuffer(value) ? value : Buffer.from(String(value));
    }
  }

};

/**
 * @typedef {object} Field
 * @prop {string} [filename] The file name
 * @prop {number} [size]
 * @prop {any} value The value
 * @prop {string} name The name
 *
 * @typedef {object} Content
 * @prop {Array<{ value: any; filename: string; }>} values The values
 * @prop {boolean} append If we appended
 */
