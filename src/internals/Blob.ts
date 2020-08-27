// Credit: https://github.com/node-fetch/fetch-blob
// Didn't feel like adding more dependencies

import { Readable } from 'stream';

interface Source {
  parts: (Blob | Buffer)[];
  size: number;
  type: string;
}

const source = new WeakMap<Blob, Source>();

async function *read(parts: (Blob | Buffer)[]) {
  for (const part of parts) {
    if ('stream' in part) yield *part.stream();
    else yield part;
  }
}

type BlobPart = ArrayBufferLike | ArrayBufferView | Blob | Buffer | string;
interface Options {
  type: string;
}

export default class Blob {
  /**
   * Constructor for a `Blob` object, The content
	 * of the blob consists of the concatenation of the values given
	 * in the parameter array.
   * 
   * @param parts The parts of the blob
   * @param options Options to use
   */
  constructor(parts: BlobPart[], options: Options = { type: '' }) {
    let size = 0;
    const allParts = parts.map(element => {
      let buffer: Buffer | Blob;

      if (element instanceof Buffer) buffer = element;
      else if (ArrayBuffer.isView(element)) buffer = Buffer.from(element.buffer, element.byteOffset, element.byteLength);
      else if (element instanceof ArrayBuffer) buffer = Buffer.from(element);
      else if (element instanceof Blob) buffer = element;
      else buffer = Buffer.from(typeof element === 'string' ? element : String(element));

      size += buffer instanceof Buffer 
        ? buffer.length 
        : buffer instanceof Blob 
          ? buffer.size()
          : 0;
        
      return buffer;
    });

    source.set(this, {
      parts: allParts,
      type: options.type === undefined ? '' : String(options.type).toLowerCase(),
      size
    });
  }

  /**
   * Returns the MIME type of the Blob
   */
  get type() {
    return source.get(this)!.type;
  }

  /**
   * Gets the size of this blob
   */
  size() {
    return source.get(this)!.size;
  }

  /**
   * String containing the contents of the blob interpreted at UTF-8
   */
  async text() {
    const buffer = await this.raw();
    return Buffer.from(buffer).toString();
  }

  /**
   * Returns the binary data as an ArrayBuffer
   */
  async raw() {
    const data = new Uint8Array(this.size());
    let offset = 0;
    for await (const chunk of this.stream()) {
      data.set(chunk, offset);
      offset += chunk.length;
    }

    return data.buffer;
  }

  /**
   * Returns a Readable stream
   */
  stream(): Readable {
    return Readable.from(read(source.get(this)!.parts));
  }

  /**
   * Returns a new Blob object containing data from a subset of points from this Blob
   * @param start The start
   * @param end The end
   * @param type The type
   */
  slice(start: number = 0, end: number = this.size(), type: string = '') {
    const size = this.size();
    let starting = start < 0 ? Math.max(size + start, 0) : Math.min(start, size);
    let ending = end < 0 ? Math.max(size + end, 0) : Math.min(end, size);

    const span = Math.max(ending - starting, 0);
    const parts = source.get(this)!.parts.values();
    const blobs: (Buffer | Blob)[] = [];
    let added = 0;

    for (const part of parts) {
      const partSize = ArrayBuffer.isView(part) ? part.byteLength : part.size();
      if (starting && partSize <= starting) {
        starting -= partSize;
        ending -= partSize;
      } else {
        const chunk = part.slice(starting, Math.min(partSize, ending));
        blobs.push(chunk);

        added += ArrayBuffer.isView(chunk) ? chunk.byteLength : chunk.size();
        starting = 0;

        if (added >= span) break;
      }
    }
  
    const blob = new Blob([], { type });
    Object.assign(source.get(blob)!, { size: span, parts: blobs });

    return blob;
  }
}