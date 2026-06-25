import { StorageInterface } from './storage-interface';
import { JsonStorage } from './json-storage';

export function createStorage(): StorageInterface {
  const adapter = process.env.STORAGE_ADAPTER || 'json';
  const dataDir = process.env.DATA_DIR || './data';

  switch (adapter) {
    case 'json':
    default:
      return new JsonStorage(dataDir);
  }
}

export const storage = createStorage();