import type { ImageFilter } from '../types';

export const getCssFilterValue = (filter: ImageFilter): string => {
    switch (filter) {
        case 'grayscale': return 'grayscale(100%)';
        case 'sepia': return 'sepia(100%)';
        case 'invert': return 'invert(100%)';
        case 'vintage': return 'sepia(60%) contrast(110%) brightness(90%)';
        case 'none':
        default: return 'none';
    }
};

export const applyFilterAndGetUrl = (
    originalImageUrl: string,
    filter: ImageFilter
): Promise<string> => {
    return new Promise((resolve, reject) => {
        if (filter === 'none') {
            resolve(originalImageUrl);
            return;
        }

        const image = new Image();
        image.crossOrigin = 'anonymous'; // Required for tainted canvas safety
        image.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                return reject(new Error('Could not get canvas context'));
            }

            canvas.width = image.width;
            canvas.height = image.height;

            ctx.filter = getCssFilterValue(filter);
            ctx.drawImage(image, 0, 0);

            resolve(canvas.toDataURL('image/png'));
        };
        image.onerror = (err) => {
            reject(new Error(`Failed to load image for filtering: ${err}`));
        };
        image.src = originalImageUrl;
    });
};
