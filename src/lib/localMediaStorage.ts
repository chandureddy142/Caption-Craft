const DB_NAME = "CaptionCraftMediaDB";
const DB_VERSION = 1;
const STORE_MEDIA = "mediaFiles";
const STORE_EXPORTS = "exportsFiles";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_MEDIA)) {
        db.createObjectStore(STORE_MEDIA, { keyPath: "projectId" });
      }
      if (!db.objectStoreNames.contains(STORE_EXPORTS)) {
        db.createObjectStore(STORE_EXPORTS, { keyPath: "exportId" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveLocalProjectMedia(projectId: string, file: File | Blob, filename: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_MEDIA, "readwrite");
    const store = tx.objectStore(STORE_MEDIA);
    store.put({
      projectId,
      blob: file,
      name: filename,
      type: file.type,
      updatedAt: Date.now()
    });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getLocalProjectMedia(projectId: string): Promise<File | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_MEDIA, "readonly");
    const store = tx.objectStore(STORE_MEDIA);
    const req = store.get(projectId);
    req.onsuccess = () => {
      if (!req.result) return resolve(null);
      const data = req.result;
      const file = new File([data.blob], data.name || "video.mp4", { type: data.type || "video/mp4" });
      resolve(file);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function deleteLocalProjectMedia(projectId: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_MEDIA, "readwrite");
    const store = tx.objectStore(STORE_MEDIA);
    store.delete(projectId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
export async function saveLocalExportMedia(exportId: string, blob: Blob, filename: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_EXPORTS, "readwrite");
    const store = tx.objectStore(STORE_EXPORTS);
    store.put({
      exportId,
      blob,
      name: filename,
      type: blob.type,
      createdAt: Date.now()
    });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getLocalExportMedia(exportId: string): Promise<{ blob: Blob; name: string } | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_EXPORTS, "readonly");
    const store = tx.objectStore(STORE_EXPORTS);
    const req = store.get(exportId);
    req.onsuccess = () => {
      if (!req.result) return resolve(null);
      resolve({ blob: req.result.blob, name: req.result.name });
    };
    req.onerror = () => reject(req.error);
  });
}

export async function deleteLocalExportMedia(exportId: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_EXPORTS, "readwrite");
    const store = tx.objectStore(STORE_EXPORTS);
    store.delete(exportId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
export async function getAllLocalExports(): Promise<Array<{ id: string; name: string; createdAt: number; size: number }>> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_EXPORTS, "readonly");
    const store = tx.objectStore(STORE_EXPORTS);
    const req = store.getAll();
    req.onsuccess = () => {
      const items = (req.result || []).map((item: any) => ({
        id: item.exportId || item.id,
        name: item.name || "Exported Video.mp4",
        createdAt: item.createdAt || Date.now(),
        size: item.blob ? item.blob.size : 0
      }));
      resolve(items.reverse());
    };
    req.onerror = () => reject(req.error);
  });
}
export async function getAllLocalProjects(): Promise<Array<{ id: string; name: string; createdAt: number; size: number }>> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_MEDIA, "readonly");
    const store = tx.objectStore(STORE_MEDIA);
    const req = store.getAll();
    req.onsuccess = () => {
      const items = (req.result || []).map((item: any) => ({
        id: item.projectId || item.id,
        name: item.name || "Untitled Project",
        createdAt: item.createdAt || Date.now(),
        size: item.file ? item.file.size : 0
      }));
      resolve(items.reverse());
    };
    req.onerror = () => reject(req.error);
  });
}

export async function deleteLocalExportsForProject(projectId: string, projectTitle?: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_EXPORTS, "readwrite");
    const store = tx.objectStore(STORE_EXPORTS);
    const req = store.openCursor();
    req.onsuccess = () => {
      const cursor = req.result;
      if (cursor) {
        const item = cursor.value;
        const matchesId = item.projectId === projectId || item.exportId === projectId || item.id === projectId;
        const matchesName = projectTitle && item.name && item.name.toLowerCase().includes(projectTitle.toLowerCase());
        if (matchesId || matchesName) {
          cursor.delete();
        }
        cursor.continue();
      } else {
        resolve();
      }
    };
    req.onerror = () => reject(req.error);
  });
}
