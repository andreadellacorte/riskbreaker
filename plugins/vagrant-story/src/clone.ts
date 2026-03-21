/** Deep clone JSON-serializable values (fixtures, command plans). */
export function jsonClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
