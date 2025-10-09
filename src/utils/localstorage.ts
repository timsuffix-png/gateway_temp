export const localStorageWeb = {
  getItem: (key: string) =>
    typeof window !== "undefined" ? localStorage.getItem(key) : null,

  setItem: (key: string, value: string) => {
    if (typeof window !== "undefined") localStorage.setItem(key, value);
  },

  removeItem: (key: string) => {
    if (typeof window !== "undefined") localStorage.removeItem(key);
  },
};
