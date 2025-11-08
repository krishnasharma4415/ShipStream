const memoryStore = new Map();

export const setItem = async (key: string, value: string, ttl?: number): Promise<void> => {
  const item = {
    value,
    expires: ttl ? Date.now() + (ttl * 1000) : null
  };
  memoryStore.set(key, item);
};

export const getItem = async (key: string): Promise<string | null> => {
  const item = memoryStore.get(key);
  if (!item) return null;
  
  if (item.expires && Date.now() > item.expires) {
    memoryStore.delete(key);
    return null;
  }
  
  return item.value;
};

export const deleteItem = async (key: string): Promise<void> => {
  memoryStore.delete(key);
};

export const clearExpired = (): void => {
  const now = Date.now();
  for (const [key, item] of memoryStore.entries()) {
    if (item.expires && now > item.expires) {
      memoryStore.delete(key);
    }
  }
};

setInterval(clearExpired, 60000);