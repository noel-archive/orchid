/**
 * Merges 1 or more objects into a huge object!
 * @param args Any arguments to apply
 */
export default function merge<
  T extends object, // eslint-disable-line @typescript-eslint/ban-types
  U extends object = T // eslint-disable-line @typescript-eslint/ban-types
>(...items: T[]) {
  const obj = {} as U;
  for (let i = 0; i < items.length; i++) {
    for (const k in items[i]) {
      obj[<any> k] = items[i][k];
    }
  }

  return obj;
}
