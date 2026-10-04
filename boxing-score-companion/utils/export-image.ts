export type ExportImageFormat =
  | 'original'
  | 'instagram-reels'
  | 'instagram-stories'
  | 'instagram-feed';

/** Returns an integer canvas that contains the full, unscaled scorecard. */
export function getExportCanvasSize(
  imageWidth: number,
  imageHeight: number,
  format: ExportImageFormat,
): { width: number; height: number } {
  if (
    !Number.isFinite(imageWidth) ||
    !Number.isFinite(imageHeight) ||
    !Number.isInteger(imageWidth) ||
    !Number.isInteger(imageHeight) ||
    imageWidth <= 0 ||
    imageHeight <= 0
  ) {
    throw new RangeError('Image dimensions must be finite, positive integer pixels.');
  }

  if (format === 'original') {
    return { width: imageWidth, height: imageHeight };
  }

  let ratioWidth: number;
  let ratioHeight: number;
  switch (format) {
    case 'instagram-reels':
    case 'instagram-stories':
      ratioWidth = 9;
      ratioHeight = 16;
      break;
    case 'instagram-feed':
      ratioWidth = 4;
      ratioHeight = 5;
      break;
    default:
      throw new RangeError('Unsupported image export format.');
  }

  const scale = Math.ceil(Math.max(imageWidth / ratioWidth, imageHeight / ratioHeight));
  return { width: ratioWidth * scale, height: ratioHeight * scale };
}
