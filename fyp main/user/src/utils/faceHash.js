const loadImage = (src) => new Promise((resolve, reject) => {
  const image = new Image();
  image.onload = () => resolve(image);
  image.onerror = () => reject(new Error('Failed to load captured face image.'));
  image.src = src;
});

export const createFaceHashFromDataUrl = async (dataUrl, size = 16) => {
  const image = await loadImage(dataUrl);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(image, 0, 0, size, size);

  const { data } = ctx.getImageData(0, 0, size, size);
  const grayscale = [];

  for (let i = 0; i < data.length; i += 4) {
    const value = Math.round(
      data[i] * 0.299 +
      data[i + 1] * 0.587 +
      data[i + 2] * 0.114
    );
    grayscale.push(value);
  }

  const average = grayscale.reduce((sum, value) => sum + value, 0) / grayscale.length;
  return grayscale.map((value) => (value >= average ? '1' : '0')).join('');
};
