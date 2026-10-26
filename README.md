# Create Captions

Create Captions is a privacy-conscious caption editor for audio and video. It prepares media in the browser, runs a multilingual Whisper model locally in a Web Worker, and lets creators correct, style, preview, and export captions without a transcription API or account.

## Highlights

- Local English and Telugu speech transcription with `onnx-community/whisper-tiny` through Transformers.js.
- Explicit source-language selection (English or Telugu) and source-preserving output selection (original script or Tenglish for Telugu).
- Telugu Lipi captions and deterministic Telugu-to-Tenglish transliteration.
- Separate canonical Telugu text and editable Tenglish text.
- Sequential 30-second audio chunks with timestamp offsets, partial results, and failed-chunk retry.
- Direct canvas caption selection and inline editing.
- Sidebar caption editing with timing, add, split, merge, and delete operations.
- Caption styling, four aspect ratios, SRT, VTT, PNG, and supported WebM export.
- Audio-only preview renders a waveform from the normalized PCM timeline instead of a fake video frame.

## Requirements

- Node.js 20 or newer is recommended.
- A modern browser with Web Workers and Web Audio support.
- WebGPU is used when available. Transformers.js falls back to a WASM/CPU backend when WebGPU is unavailable or unsupported.

## Install and run

```bash
npm install
npm run dev
```

Open the local Vite URL shown in the terminal.

## Checks

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

The unit tests are intentionally model-free. They test subtitle timing, transliteration, export formatting, overlap merging, and cancellation behavior without downloading Whisper.

## Local Whisper model and privacy

Create Captions does not use a hosted transcription API, an API key, an LLM translation service, or a browser speech-recognition service.

The first local transcription requires an internet connection so Transformers.js can download the model and runtime assets from Hugging Face. Transformers.js stores supported assets in the browser cache. Later transcription can run without contacting a transcription API while those assets remain cached. Browser cache eviction, private browsing, clearing site data, or offline application-shell limitations may require a new download.

Audio is decoded and normalized in the browser, then sent only to the local Whisper Web Worker. The application does not persist uploaded media or store large audio buffers in localStorage.

The selected model is the multilingual `onnx-community/whisper-tiny`, based on OpenAI Whisper Tiny. The model card lists Telugu among its supported languages. Tiny models are convenient for browser use but are less accurate than larger models, especially with noisy audio, accents, code-switching, music, silence, and lower-resource languages. Near-silent chunks are skipped before inference; users should still review and remove false-positive segments from noisy recordings.

## Supported media

The file picker accepts:

- Audio: MP3, WAV, M4A, AAC, and OGG when the browser can decode the codec.
- Video: MP4, MOV, WEBM, and MKV when the browser can decode the container and audio track.
- Upload limit: 256 MB per media file because browser decoding and resampling allocate memory before chunked inference begins.

Actual codec support is provided by the browser's media and Web Audio implementations. Unsupported files fail with an error rather than silently producing fake captions.

## Telugu and Tenglish

- The source-language control sends either English or Telugu to Whisper; it does not translate between languages.
- Telugu output displays Telugu script, while the Tenglish output uses the canonical Telugu transcript and a deterministic transliterator.
- Tenglish uses the Telugu transcript and a deterministic Unicode-aware transliterator to produce Roman-script pronunciation.
- Tenglish is transliteration, not English translation.
- Independent vowels, vowel signs, virama/conjuncts, anusvara, visarga, punctuation, numbers, URLs, and mixed English text are handled by the local transliterator.

## Long files and memory

Whisper inference is performed in bounded sequential chunks. The normalized source WAV and browser-decoded media can still occupy substantial memory because browser decoding is not fully streaming. The 256 MB file limit and waveform calculation are designed around that implementation boundary. Very long recordings may still exceed device memory, particularly on mobile. The application reports failures rather than silently truncating the file.

## Exports

- SRT and VTT subtitle files use the current subtitle text and timestamps.
- PNG exports the current rendered canvas frame.
- WebM uses `MediaRecorder` when the browser supports a compatible codec. Audio is included when the source exposes an audio capture track; silent video can still be exported when only a video track is available.
- MP4 is not offered because Create Captions does not include an MP4 encoder.

## Development notes

The main state lives in `src/App.tsx`. Audio preparation is in `src/utils/audioExtractor.ts`. Local transcription is split between `src/services/localTranscription.ts` and `src/workers/whisper.worker.ts`. Caption rendering, editing, and exports remain separate so the existing editor workflow can be tested independently from the model.
