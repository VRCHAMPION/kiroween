/** Screenshots narrower than this are enlarged, because tesseract reads small text badly. */
const MIN_WIDTH = 1200;
const MAX_SCALE = 2.5;
/** A screenshot darker than this on average is treated as dark mode and inverted. */
const DARK_MEAN = 0.45;

/**
 * Prepares a screenshot for OCR on a canvas: enlarges small images, turns them grey, and
 * inverts dark-mode chats so the text is dark on light. Falls back to the original file if the
 * browser cannot do this. Works only in memory; nothing is saved.
 */
export async function prepareImage(file: Blob): Promise<Blob> {
  try {
    if (typeof createImageBitmap !== 'function' || typeof document === 'undefined') return file;
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(MAX_SCALE, Math.max(1, MIN_WIDTH / bitmap.width));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      bitmap.close();
      return file;
    }
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const image = ctx.getImageData(0, 0, width, height);
    const px = image.data;
    let sum = 0;
    for (let i = 0; i < px.length; i += 4) {
      const grey = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
      px[i] = px[i + 1] = px[i + 2] = grey;
      sum += grey;
    }
    if (sum / (px.length / 4) / 255 < DARK_MEAN) {
      for (let i = 0; i < px.length; i += 4) {
        px[i] = px[i + 1] = px[i + 2] = 255 - px[i];
      }
    }
    ctx.putImageData(image, 0, 0);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
    return blob ?? file;
  } catch {
    return file;
  }
}