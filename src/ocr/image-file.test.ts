import { describe, expect, it } from 'vitest';
import { checkImageFile, firstImage, MAX_IMAGE_BYTES } from './image-file';

describe('checkImageFile', () => {
  it.each(['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/bmp'])('accepts %s', (type) => {
    expect(checkImageFile({ type, size: 1000 })).toBe('ok');
  });

  it('accepts an image name when the browser gives no type', () => {
    expect(checkImageFile({ type: '', size: 1000, name: 'Screenshot_2026.JPG' })).toBe('ok');
  });

  it('rejects other files and files that are too big', () => {
    expect(checkImageFile({ type: 'application/pdf', size: 1000 })).toBe('wrong-type');
    expect(checkImageFile({ type: 'image/svg+xml', size: 1000 })).toBe('wrong-type');
    expect(checkImageFile({ type: 'image/png', size: MAX_IMAGE_BYTES + 1 })).toBe('too-big');
    expect(checkImageFile({ type: 'image/png', size: MAX_IMAGE_BYTES })).toBe('ok');
  });

  it('finds the first image in a clipboard or drop', () => {
    const text = new File(['x'], 'note.txt', { type: 'text/plain' });
    const shot = new File(['x'], 'shot.png', { type: 'image/png' });
    expect(firstImage([text, shot])).toBe(shot);
    expect(firstImage([text])).toBeUndefined();
    expect(firstImage(null)).toBeUndefined();
  });
});