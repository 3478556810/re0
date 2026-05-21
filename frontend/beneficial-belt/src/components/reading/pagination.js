// pagination.js
let worker = null;
const WORKER_VERSION = '5'; // 与 worker 版本同步

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