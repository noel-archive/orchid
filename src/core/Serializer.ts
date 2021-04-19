/**
 * Copyright (c) 2020-2021 August
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/**
 * Represents a [Serializer] class, which serializes objects from a specific content-type
 *
 * __**Built-in Serializers**__
 * - `application/json`: JsonSerializer
 * - `*` or `text/html`: TextSerializer
 */
export class Serializer<T = unknown> {
  /** The content-type to use */
  public contentType: RegExp | string;

  /**
   * Constructs a new instance of [Serializer]
   * @param contentType The content-type to use to serialize
   */
  constructor(contentType: string | RegExp) {
    this.contentType = contentType;
  }

  /**
   * Serializes data and returns the output
   * @param data The data (that is a Buffer) to serialize
   * @returns The data represented as [T].
   * @throws {SyntaxError} When the user hasn't overloaded this function
   */
  serialize(data: Buffer): T {
    throw new SyntaxError(`Serializer.serialize was not over-ridden (content type: ${this.contentType})`);
  }
}
