// pagination.js
let worker = null;
// pagination.js
// pagination.js
const WORKER_VERSION = '6'; // 同步 v7 // 与 Worker v6 同步// 

function getWorker() {
  if (!worker) {
    worker = new Worker(`/pagination-worker.js?v=${WORKER_VERSION}`);
  }
  return worker;
}

export function paginate(text, pageWidth, pageHeight, fontSize) {
  return new Promise((resolve, reject) => {
    const w = getWorker();
    w.onmessage = (e) => resolve(e.data);
    w.onerror = (err) => reject(err);
    w.postMessage({ text, pageWidth, pageHeight, fontSize });
  });
}

export function terminateWorker() {
  if (worker) {
    worker.terminate();
    worker = null;
  }
}