// src/components/reading/cachePagination.js
// 分页结果 IndexedDB 缓存

const DB_NAME = 'reading-hut-pages';
const STORE_NAME = 'pages';
let db = null;

function openDB() {
  return new Promise((resolve, reject) => {
    if (db) return resolve(db);
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e) => {
      const database = e.target.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = (e) => {
      db = e.target.result;
      resolve(db);
    };
    request.onerror = (e) => {
      reject(e.target.error);
    };
  });
}

export async function getCachedPages(bookId, fontSize) {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const key = `${bookId}_f${fontSize}`;
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result?.pages ?? null);
    request.onerror = () => reject(request.error);
  });
}

export async function setCachedPages(bookId, fontSize, pages) {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const key = `${bookId}_f${fontSize}`;
    store.put({ id: key, pages, timestamp: Date.now() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}