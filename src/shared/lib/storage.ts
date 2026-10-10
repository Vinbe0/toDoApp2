/**
 * Typed access to a single localStorage key.
 *
 * Reads never throw: missing, unparsable or invalid values return null, and
 * storage being unavailable (private mode, quota, SSR) is treated the same way.
 */
export type StorageItem<T> = {
  get(): T | null;
  set(value: T): void;
  remove(): void;
};

type Codec<T> = {
  parse: (raw: string) => T | null;
  serialize: (value: T) => string;
};

export function createStorageItem<T>(key: string, codec: Codec<T>): StorageItem<T> {
  return {
    get() {
      try {
        const raw = localStorage.getItem(key);
        return raw === null ? null : codec.parse(raw);
      } catch {
        return null;
      }
    },
    set(value) {
      try {
        localStorage.setItem(key, codec.serialize(value));
      } catch {
        // Storage full or unavailable: the app keeps working in memory.
      }
    },
    remove() {
      try {
        localStorage.removeItem(key);
      } catch {
        // Ignore: nothing to clean up if storage is unavailable.
      }
    },
  };
}

/** A plain string value, optionally restricted to a set of allowed values. */
export function stringItem<T extends string = string>(key: string, allowed?: readonly T[]) {
  return createStorageItem<T>(key, {
    parse: (raw) => (!allowed || allowed.includes(raw as T) ? (raw as T) : null),
    serialize: (value) => value,
  });
}

/** A JSON value; `validate` turns unknown data into T or rejects it with null. */
export function jsonItem<T>(key: string, validate: (data: unknown) => T | null) {
  return createStorageItem<T>(key, {
    parse: (raw) => validate(JSON.parse(raw)),
    serialize: (value) => JSON.stringify(value),
  });
}
