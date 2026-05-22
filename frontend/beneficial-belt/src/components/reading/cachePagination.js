// src/components/reading/cachePagination.js
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
      console.error('[Cache] IndexedDB 打开失败:', e.target.error);
      reject(e.target.error);
    };
  });
}

export async function getCachedPages(bookId, fontSize) {
  try {
    const database = await openDB();
    return new Promise((resolve, reject) => {
      const tx = database.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const key = `${bookId}_f${fontSize}`;
      console.log('[Cache] 查找键:', key);
      const request = store.get(key);
      request.onsuccess = () => {
        const result = request.result?.pages ?? null;
        if (result) {
          console.log('[Cache] ✅ 命中，页数:', result.length);
        } else {
          console.log('[Cache] ❌ 未命中');
        }
        resolve(result);
      };
      request.onerror = () => {
        console.error('[Cache] 读取失败:', request.error);
        reject(request.error);
      };
    });
  } catch (e) {
    console.warn('[Cache] 读取异常，返回 null', e);
    return null;
  }
}

export async function setCachedPages(bookId, fontSize, pages) {
  try {
    const database = await openDB();
    return new Promise((resolve, reject) => {
      const tx = database.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const key = `${bookId}_f${fontSize}`;
      console.log('[Cache] 写入键:', key, '页数:', pages.length);
      store.put({ id: key, pages, timestamp: Date.now() });
      tx.oncomplete = () => {
        console.log('[Cache] 写入成功');
        resolve();
      };
      tx.onerror = () => {
        console.error('[Cache] 写入失败:', tx.error);
        reject(tx.error);
      };
    });
  } catch (e) {
    console.warn('[Cache] 写入异常', e);
  }
}
export { openDB, STORE_NAME }