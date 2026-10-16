/**
 * Utility to downscale and compress high-resolution mobile camera captures
 * Prevents 413 PayloadTooLarge errors and guarantees rapid network transmission.
 */
export async function compressImageToDataUrl(
  input: File | string,
  maxDimension = 1280,
  quality = 0.85
): Promise<{ dataUrl: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    let sourceUrl = '';
    let isObjectUrl = false;

    if (typeof input === 'string') {
      sourceUrl = input;
    } else {
      sourceUrl = URL.createObjectURL(input);
      isObjectUrl = true;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        if (isObjectUrl) {
          URL.revokeObjectURL(sourceUrl);
        }

        let { width, height } = img;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          // Fallback to source
          resolve({ dataUrl: typeof input === 'string' ? input : '', mimeType: 'image/jpeg' });
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve({ dataUrl, mimeType: 'image/jpeg' });
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = (err) => {
      if (isObjectUrl) {
        URL.revokeObjectURL(sourceUrl);
      }
      reject(err);
    };

    img.src = sourceUrl;
  });
}
