import type { CanvasSettings, Subtitle, TimelineBgSegment, TimelineSongSegment } from "../types";

export interface ProjectDraftData {
  projectId: string;
  projectTitle: string;
  duration?: number;
  durationFormatted?: string;
  captionsCount?: number;
  subtitles: Subtitle[];
  settings: CanvasSettings;
  bgSegments: TimelineBgSegment[];
  songSegments: TimelineSongSegment[];
  songBlob?: Blob;
  songName?: string;
  songUrl?: string;
  updatedAt: string;
}

const DB_NAME = "CreateCaptionsDraftsDB";
const STORE_NAME = "drafts";

function openDraftDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "projectId" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveLocalProjectDraft(draft: ProjectDraftData): Promise<void> {
  try {
    const db = await openDraftDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(draft);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn("Could not save project draft to IndexedDB:", err);
  }
}

export async function getLocalProjectDraft(projectId: string): Promise<ProjectDraftData | null> {
  try {
    const db = await openDraftDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(projectId);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn("Could not load project draft from IndexedDB:", err);
    return null;
  }
}

export async function deleteLocalProjectDraft(projectId: string): Promise<void> {
  try {
    const db = await openDraftDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(projectId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn("Could not delete project draft:", err);
  }
}
