export const A4 = {
  width: 210,
  height: 297,
  pixelWidth: (210 * 96) / 25.4,
  pixelHeight: (297 * 96) / 25.4,
};
// Content sits at layer 10; preserve ordering within both image groups.
export const decorationLayer = (zIndex) => (zIndex < 0 ? 10 + zIndex : 20 + zIndex);
export function moveDecoration(image, dx, dy) {
  return {
    ...image,
    x: Math.max(0, Math.min(A4.width - image.width, image.x + dx)),
    y: Math.max(0, Math.min(A4.height - image.height, image.y + dy)),
  };
}
export function resizeDecoration(image, dx, dy) {
  const ratio = image.width / image.height;
  // Project the pointer onto the diagonal so both horizontal and vertical drags resize naturally.
  const delta = (dx + dy / ratio) / (1 + 1 / (ratio * ratio));
  const width = Math.max(
    Math.min(1, image.width),
    Math.min(image.width + delta, A4.width - image.x, (A4.height - image.y) * ratio),
  );
  return { ...image, width, height: width / ratio };
}
