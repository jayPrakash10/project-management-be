export function camelToSnake(value: string): string {
  return value.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

export function snakeToCamel(value: string): string {
  return value.replace(/_([a-z0-9])/g, (_match, letter: string) => letter.toUpperCase());
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype;
}

function convertRow(row: unknown): unknown {
  if (!isPlainObject(row)) {
    return row;
  }
  const converted: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    converted[snakeToCamel(key)] = value;
  }
  return converted;
}

// Only top-level row keys are converted; JSON column contents are left untouched.
export function convertKeysToCamelCase(result: unknown): unknown {
  return Array.isArray(result) ? result.map(convertRow) : convertRow(result);
}
