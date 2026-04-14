export const localStorageWeb = {
  getItem: (key: string) => {
    try {
      if (typeof window !== "undefined" && typeof window.localStorage !== "undefined") {
        return window.localStorage.getItem(key);
      }
    } catch (e) {}
    return null;
  },

  setItem: (key: string, value: string) => {
    try {
      if (typeof window !== "undefined" && typeof window.localStorage !== "undefined") {
        window.localStorage.setItem(key, value);
      }
    } catch (e) {}
  },

  removeItem: (key: string) => {
    try {
      if (typeof window !== "undefined" && typeof window.localStorage !== "undefined") {
        window.localStorage.removeItem(key);
      }
    } catch (e) {}
  },
};
