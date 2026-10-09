// Storage remains usable when browser persistence is unavailable.
const memory = new Map();
export const storage = {
    getItem(key) { if (memory.has(key)) return memory.get(key); try { return localStorage.getItem(key); } catch { return memory.get(key) ?? null; } },
    setItem(key, value) { memory.set(key, String(value)); try { localStorage.setItem(key, String(value)); } catch {} },
    removeItem(key) { memory.set(key, null); try { localStorage.removeItem(key); } catch {} }
};
export function readPosition(key) {
    try {
        const value = JSON.parse(storage.getItem(key));
        return value && ['x', 'y', 'z'].every(axis => Number.isFinite(value[axis]) && Math.abs(value[axis]) < 10000) ? value : null;
    } catch { return null; }
}
