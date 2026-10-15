import { toPng } from 'html-to-image';

/** Fixed export size (story). The artwork node itself is laid out at this size. */
export const CARD_EXPORT_WIDTH = 1080;
export const CARD_EXPORT_HEIGHT = 1920;

export type CardImageResult = 'shared' | 'downloaded';

/**
 * Render the fixed-size card node to PNG, then share the IMAGE:
 * 1. navigator.share({ files }) guarded by navigator.canShare({files})
 * 2. fallback: download the PNG (mobile users save to album / post manually)
 * Dismissing the share sheet (AbortError) is treated as a no-op.
 * Any other throw (e.g. tainted canvas from a cross-origin photo) is rethrown
 * so the caller can retry without photos.
 */
export async function shareCardImage(opts: {
  node: HTMLElement;
  fileName: string;
  title: string;
  text: string;
}): Promise<CardImageResult> {
  const dataUrl = await toPng(opts.node, {
    width: CARD_EXPORT_WIDTH,
    height: CARD_EXPORT_HEIGHT,
    pixelRatio: 1,
    cacheBust: true,
  });
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const file = new File([blob], opts.fileName, { type: 'image/png' });
  const nav = navigator as Navigator & {
    canShare?: (data: { files: File[] }) => boolean;
  };
  if (nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: opts.title, text: opts.text });
      return 'shared';
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return 'shared';
      throw err;
    }
  }
  // Fallback: download so the user can save it to the album and post manually.
  const a = document.createElement('a');
  const href = URL.createObjectURL(blob);
  a.href = href;
  a.download = opts.fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(href), 4000);
  return 'downloaded';
}
