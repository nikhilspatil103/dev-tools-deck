const TTL = 24 * 60 * 60 * 1000; // 24 hours

export const storage = {
  set(key, value) {
    const item = { value, expiry: Date.now() + TTL };
    localStorage.setItem(key, JSON.stringify(item));
  },

  get(key, fallback = null) {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    try {
      const { value, expiry } = JSON.parse(raw);
      if (Date.now() > expiry) {
        localStorage.removeItem(key);
        return fallback;
      }
      return value;
    } catch {
      return fallback;
    }
  },

  remove(key) {
    localStorage.removeItem(key);
  },
};
