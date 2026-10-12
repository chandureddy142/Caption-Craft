import type { SourceLanguage } from '../types';

interface ResumeCheckpoint {
  audio: Blob;
  sourceLanguage: SourceLanguage;
  nextChunkIndex: number;
}

/** UI ownership and resume position, independent of asynchronous worker settlement. */
export class TranscriptionSession {
  revision = 0;
  running = false;
  private checkpoint: ResumeCheckpoint | null = null;

  start(audio: Blob, sourceLanguage: SourceLanguage, nextChunkIndex = 0): number | null {
    if (this.running) return null;
    this.revision += 1;
    this.running = true;
    this.checkpoint = { audio, sourceLanguage, nextChunkIndex };
    return this.revision;
  }

  isCurrent(revision: number): boolean {
    return revision === this.revision;
  }

  recordCompleted(revision: number, nextChunkIndex: number): void {
    if (this.isCurrent(revision) && this.checkpoint) this.checkpoint.nextChunkIndex = nextChunkIndex;
  }

  resume(audio: Blob | null, sourceLanguage: SourceLanguage): number | null {
    return this.checkpoint?.audio === audio && this.checkpoint.sourceLanguage === sourceLanguage
      ? this.checkpoint.nextChunkIndex
      : null;
  }

  finish(revision: number): boolean {
    if (!this.isCurrent(revision)) return false;
    this.running = false;
    return true;
  }

  complete(revision: number): void {
    if (this.isCurrent(revision)) this.checkpoint = null;
  }

  cancel(): void {
    // Invalidate callbacks before aborting the worker: its catch/finally may
    // settle after the user has already started a new run.
    this.revision += 1;
    this.running = false;
  }

  reset(): void {
    this.cancel();
    this.checkpoint = null;
  }
}
