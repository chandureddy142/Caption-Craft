export interface MediaRecorderSupport {
  isTypeSupported: (mimeType: string) => boolean;
}

export function getSupportedWebmMimeType(
  hasAudio: boolean,
  support?: MediaRecorderSupport,
): string | null {
  const recorder = support ?? (typeof MediaRecorder === 'undefined' ? undefined : MediaRecorder);
  if (!recorder) return null;
  const candidates = hasAudio
    ? ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm']
    : ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
  return candidates.find(candidate => recorder.isTypeSupported(candidate)) ?? null;
}
