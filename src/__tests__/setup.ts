import "@testing-library/jest-dom/vitest";

// jsdom may omit localStorage (opaque-origin URL in some versions); tests
// that persist state (error log, zustand stores) rely on it being present
if (typeof globalThis.localStorage === "undefined") {
  const store = new Map<string, string>();
  const impl: Storage = {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (k) => (store.has(k) ? (store.get(k) ?? null) : null),
    key: (i) => [...store.keys()][i] ?? null,
    removeItem: (k) => store.delete(k),
    setItem: (k, v) => store.set(k, String(v)),
  };
  Object.defineProperty(globalThis, "localStorage", { value: impl, configurable: true });
}
