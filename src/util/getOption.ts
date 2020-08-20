/**
 * Checks if a property exists in an object, returns a default value if none was provided
 * @param prop The property to find
 * @param defaultValue The default value if not found
 * @param options The options itself
 */
// eslint-disable-next-line
export default function getOption<T extends object, U = unknown>(prop: keyof T, defaultValue: U, options?: T): U {
  if (options === undefined) return defaultValue;
  else if (options.hasOwnProperty(prop)) return options[prop as any];
  else return defaultValue;
}
