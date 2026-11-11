export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

const IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/bmp']);
const IMAGE_NAME = /\.(png|jpe?g|webp|gif|bmp)$/i;

export type ImageCheck = 'ok' | 'wrong-type' | 'too-big';

/** Checks a picked, dropped or pasted file before reading it. */
export function checkImageFile(file: Pick<File, 'type' | 'size'> & { name?: string }): ImageCheck {
  const typeOk = IMAGE_TYPES.has(file.type.toLowerCase()) || (file.type === '' && IMAGE_NAME.test(file.name ?? ''));
  if (!typeOk) return 'wrong-type';
  if (file.size > MAX_IMAGE_BYTES) return 'too-big';
  return 'ok';
}

/** The first image file in a clipboard or drop, if there is one. */
export function firstImage(files: Iterable<File> | ArrayLike<File> | null | undefined): File | undefined {
  if (!files) return undefined;
  return Array.from(files).find((f) => f.type.startsWith('image/') || IMAGE_NAME.test(f.name));
}