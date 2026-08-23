import { AssetItem } from '../types/asset';

const DB_NAME = 'SlideCraftAssetsDB';
const DB_VERSION = 1;
const STORE_NAME = 'assets';
const LOCALSTORAGE_KEY = 'slidecraft_assets_v1';

export const DEFAULT_PRESET_ASSETS: AssetItem[] = [];

function openIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export const assetStorage = {
  async getAllAssets(): Promise<AssetItem[]> {
    try {
      const db = await openIndexedDB();
      return new Promise((resolve) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
          const results: AssetItem[] = request.result || [];
          // Filter out any legacy preset assets to keep asset manager 100% user-uploaded
          const userOnly = results.filter((a) => a.source === 'upload');
          
          // Clean up old presets from storage
          const presets = results.filter((a) => a.source === 'preset');
          if (presets.length > 0) {
            presets.forEach((p) => store.delete(p.id));
          }

          resolve(userOnly);
        };

        request.onerror = () => {
          resolve(this.getFromLocalStorage());
        };
      });
    } catch {
      return this.getFromLocalStorage();
    }
  },

  async saveAsset(asset: AssetItem): Promise<void> {
    try {
      const db = await openIndexedDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(asset);

        request.onsuccess = () => {
          this.syncToLocalStorage(asset);
          resolve();
        };
        request.onerror = () => {
          this.syncToLocalStorage(asset);
          reject(request.error);
        };
      });
    } catch {
      this.syncToLocalStorage(asset);
    }
  },

  async saveMultipleAssets(assets: AssetItem[]): Promise<void> {
    try {
      const db = await openIndexedDB();
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      assets.forEach((a) => store.put(a));
    } catch {
      const existing = this.getFromLocalStorage();
      const map = new Map<string, AssetItem>();
      existing.forEach((a) => map.set(a.id, a));
      assets.forEach((a) => map.set(a.id, a));
      localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(Array.from(map.values())));
    }
  },

  async deleteAsset(id: string): Promise<void> {
    try {
      const db = await openIndexedDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(id);

        request.onsuccess = () => {
          this.removeFromLocalStorage(id);
          resolve();
        };
        request.onerror = () => {
          this.removeFromLocalStorage(id);
          reject(request.error);
        };
      });
    } catch {
      this.removeFromLocalStorage(id);
    }
  },

  async clearAll(): Promise<void> {
    try {
      const db = await openIndexedDB();
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      transaction.objectStore(STORE_NAME).clear();
    } catch {
      // ignore
    }
    localStorage.removeItem(LOCALSTORAGE_KEY);
  },

  getFromLocalStorage(): AssetItem[] {
    try {
      const raw = localStorage.getItem(LOCALSTORAGE_KEY);
      if (!raw) return [];
      const parsed: AssetItem[] = JSON.parse(raw);
      return parsed.filter((a) => a.source === 'upload');
    } catch {
      return [];
    }
  },

  syncToLocalStorage(asset: AssetItem): void {
    try {
      const list = this.getFromLocalStorage();
      const idx = list.findIndex((a) => a.id === asset.id);
      if (idx >= 0) {
        list[idx] = asset;
      } else {
        list.push(asset);
      }
      localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(list));
    } catch {
      // ignore
    }
  },

  removeFromLocalStorage(id: string): void {
    try {
      const list = this.getFromLocalStorage();
      const updated = list.filter((a) => a.id !== id);
      localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  },
};
