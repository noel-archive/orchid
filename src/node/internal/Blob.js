// Credit: https://github.com/node-fetch/fetch-blob
// Didn't feel like adding more dependencies

const { Readable } = require('stream');

/** @type {WeakMap<Blob, Source>} */
const sources = new WeakMap();

/**
 * Async generator function to read a [Blob] or [Buffer]
 * @param {Array<Blob | Buffer>} parts The parts to read
 */
async function *read(parts) {
  for (const part of parts) {
    if ('stream' in part) yield *part.stream();

    yield part;
  }
}

class Blob {
  /**
   * Creates a new [Blob] instance
   * @param {BlobPart[]} parts The parts to create a [Blob] instance
   * @param {{ type: string }} [options] The options to use
   */
  constructor(parts, options = { type: '' }) {
    let size = 0;
    const allParts = parts.map(element => {
      let buffer;

      if (element instanceof Buffer) buffer = element;
      else if (ArrayBuffer.isView(element)) buffer = Buffer.from(element.buffer, element.byteOffset, element.byteLength);
      else if (element instanceof ArrayBuffer) buffer = Buffer.from(element);
      else if (element instanceof Blob) buffer = element;
      else buffer = Buffer.from(typeof element === 'string' ? element : String(element));

      size += buffer instanceof Buffer
        ? buffer.length
        : buffer instanceof Blob
          ? buffer.size
          : 0;

      return buffer;
    });

    sources.set(this, {
      parts: allParts,
      type: options.type === undefined ? '' : String(options.type).toLowerCase(),
      size
    });
  }

  get type() {
    return sources.get(this).type;
  }

  get size() {
    return sources.get(this).size;
  }

  /**
   * Returns a text-represented value of this [Blob] instance
   * @returns {Promise<string>}
   */
  async text() {
    const buffer = await this.raw();
    return Buffer.from(buffer).toString();
  }

  /**
   * Returns the raw data from this [Blob] instance
   * @returns {Promise<ArrayBufferLike>}
   */
  async raw() {
    const data = new Uint8Array(this.size);
    let offset = 0;

    for await (const chunk of this.stream()) {
      data.set(chunk, offset);
      offset += chunk.length;
    }

    return data.buffer;
  }

  /**
   * Returns a [Readable] stream
   * @returns {Readable}
   */
  stream() {
    return Readable.from(read(sources.get(this).parts));
  }

  /**
   * Slices a chunk of data by it's `start` and `end`
   * @param {number} [start] The start value
   * @param {number} [end] The end value
   * @param {string} [type] The type to use
   */
  slice(start = 0, end = this.size, type = '') {
    const size = this.size;
    let starting = start < 0 ? Math.max(size + start, 0) : Math.min(start, size);
    let ending = end < 0 ? Math.max(size + end, 0) : Math.min(end, size);

    const span = Math.max(ending - starting, 0);
    const parts = sources.get(this).parts.values();
    const blobs = [];
    let added = 0;

    for (const part of parts) {
      const partSize = ArrayBuffer.isView(part) ? part.byteLength : part.size;
      if (starting && partSize <= starting) {
        starting -= partSize;
        ending -= partSize;
      } else {
        const chunk = part.slice(starting, Math.min(partSize, ending));
        blobs.push(chunk);

        added += ArrayBuffer.isView(chunk) ? chunk.byteLength : chunk.size;
        starting = 0;

        if (added >= span) break;
      }
    }

    const blob = new Blob([], { type });
    Object.assign(sources.get(blob), { size: span, parts: blobs });

    return blob;
  }
}

module.exports = Blob;

/**
 * @typedef {ArrayBufferLike | ArrayBufferView | Blob | Buffer | string} BlobPart
 *
 * @typedef {object} Source
 * @prop {Array<Blob | Buffer>} parts
 * @prop {number} size
 * @prop {string} type
 */
