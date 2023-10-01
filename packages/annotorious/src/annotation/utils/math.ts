export const distance = (a: [number, number], b: [number, number]): number => {
  const dx = Math.abs(b[0] - a[0]);
  const dy = Math.abs(b[1] - a[1]);

  return Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
}