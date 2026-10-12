import type { BackgroundFitMode, BackgroundThemeId } from '../types';

export interface BackgroundThemeDefinition {
  id: BackgroundThemeId;
  name: string;
  description: string;
  previewCss: string;
  requiresVideo?: boolean;
  requiresCustomImage?: boolean;
}

export const BACKGROUND_THEMES: BackgroundThemeDefinition[] = [
  {
    id: 'original-video',
    name: 'Original Video',
    description: 'Actual video frames from the uploaded video file.',
    previewCss: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
    requiresVideo: true,
  },
  {
    id: 'midnight',
    name: 'Midnight',
    description: 'Dark charcoal cinematic background with subtle depth.',
    previewCss: 'linear-gradient(180deg, #12151c 0%, #090b10 100%)',
  },
  {
    id: 'deep-blue',
    name: 'Deep Blue',
    description: 'Dark navy background with rich cinematic tone.',
    previewCss: 'linear-gradient(180deg, #0d1e38 0%, #060e1b 100%)',
  },
  {
    id: 'purple-haze',
    name: 'Purple Haze',
    description: 'Restrained deep violet and indigo palette.',
    previewCss: 'linear-gradient(180deg, #1e1333 0%, #0d0817 100%)',
  },
  {
    id: 'sunset',
    name: 'Sunset',
    description: 'Warm dusk tones transitioning from amber to dark plum.',
    previewCss: 'linear-gradient(180deg, #451a22 0%, #1c0e1e 100%)',
  },
  {
    id: 'forest',
    name: 'Forest',
    description: 'Dark moss and emerald pine tones.',
    previewCss: 'linear-gradient(180deg, #09281f 0%, #03130e 100%)',
  },
  {
    id: 'paper',
    name: 'Paper',
    description: 'Clean, warm-neutral light surface for sharp reading.',
    previewCss: 'linear-gradient(180deg, #f4f4f5 0%, #e4e4e7 100%)',
  },
  {
    id: 'studio',
    name: 'Studio',
    description: 'Neutral professional graphite background.',
    previewCss: 'linear-gradient(180deg, #1e222b 0%, #12151c 100%)',
  },
  {
    id: 'gradient',
    name: 'Gradient',
    description: 'Subtle, professionally blended violet-slate gradient.',
    previewCss: 'linear-gradient(135deg, #2e1065 0%, #0f172a 100%)',
  },
  {
    id: 'custom-image',
    name: 'Custom Image',
    description: 'User-provided background photo or backdrop.',
    previewCss: 'repeating-linear-gradient(45deg, #1e293b 0, #1e293b 10px, #0f172a 10px, #0f172a 20px)',
    requiresCustomImage: true,
  },
];

export function getBackgroundTheme(id: BackgroundThemeId): BackgroundThemeDefinition | undefined {
  return BACKGROUND_THEMES.find(t => t.id === id);
}

export interface RenderBackgroundOptions {
  themeId: BackgroundThemeId;
  width: number;
  height: number;
  videoElement?: HTMLVideoElement | null;
  isVideoMedia?: boolean;
  customImage?: HTMLImageElement | null;
  overlayOpacity?: number;
  fitMode?: BackgroundFitMode;
}

export function drawBackgroundToCanvas(
  ctx: CanvasRenderingContext2D,
  options: RenderBackgroundOptions,
): void {
  const {
    themeId,
    width,
    height,
    videoElement,
    isVideoMedia,
    customImage,
    overlayOpacity = 0,
    fitMode = 'cover',
  } = options;

  // 1. Draw base layer
  if (themeId === 'original-video' && isVideoMedia && videoElement && videoElement.readyState >= 2) {
    // Render video frames
    const vWidth = videoElement.videoWidth || width;
    const vHeight = videoElement.videoHeight || height;
    const hRatio = width / vWidth;
    const vRatio = height / vHeight;
    const ratio = fitMode === 'cover' ? Math.max(hRatio, vRatio) : Math.min(hRatio, vRatio);

    const destWidth = vWidth * ratio;
    const destHeight = vHeight * ratio;
    const destX = (width - destWidth) / 2;
    const destY = (height - destHeight) / 2;

    // Fill black bars if contain
    if (fitMode === 'contain') {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);
    }

    ctx.drawImage(videoElement, 0, 0, vWidth, vHeight, destX, destY, destWidth, destHeight);
  } else if (themeId === 'custom-image' && customImage && customImage.complete && customImage.naturalWidth > 0) {
    // Render custom image
    const imgWidth = customImage.naturalWidth;
    const imgHeight = customImage.naturalHeight;
    const hRatio = width / imgWidth;
    const vRatio = height / imgHeight;
    const ratio = fitMode === 'cover' ? Math.max(hRatio, vRatio) : Math.min(hRatio, vRatio);

    const destWidth = imgWidth * ratio;
    const destHeight = imgHeight * ratio;
    const destX = (width - destWidth) / 2;
    const destY = (height - destHeight) / 2;

    if (fitMode === 'contain') {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);
    }

    ctx.drawImage(customImage, 0, 0, imgWidth, imgHeight, destX, destY, destWidth, destHeight);
  } else {
    // Render built-in themes
    switch (themeId) {
      case 'midnight': {
        const grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, '#151922');
        grad.addColorStop(1, '#090b10');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
        break;
      }
      case 'deep-blue': {
        const grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, '#0d1e38');
        grad.addColorStop(1, '#060e1b');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
        break;
      }
      case 'purple-haze': {
        const grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, '#1e1333');
        grad.addColorStop(1, '#0d0817');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
        break;
      }
      case 'sunset': {
        const grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, '#451a22');
        grad.addColorStop(0.65, '#291224');
        grad.addColorStop(1, '#150a16');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
        break;
      }
      case 'forest': {
        const grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, '#0a2a20');
        grad.addColorStop(1, '#03140e');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
        break;
      }
      case 'paper': {
        const grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, '#f4f4f5');
        grad.addColorStop(1, '#e4e4e7');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
        break;
      }
      case 'studio': {
        const grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, '#1f242e');
        grad.addColorStop(1, '#12151c');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
        break;
      }
      case 'gradient': {
        const grad = ctx.createLinearGradient(0, 0, width, height);
        grad.addColorStop(0, '#2e1065');
        grad.addColorStop(1, '#0f172a');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
        break;
      }
      case 'original-video':
      case 'custom-image':
      default: {
        // Fallback if video or image not yet loaded
        const grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, '#151922');
        grad.addColorStop(1, '#090b10');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
        break;
      }
    }
  }

  // 2. Darkening overlay for caption readability
  if (overlayOpacity > 0) {
    ctx.fillStyle = `rgba(0, 0, 0, ${Math.min(0.9, Math.max(0, overlayOpacity))})`;
    ctx.fillRect(0, 0, width, height);
  }
}
