/** Pick dark or white ink for readable contrast on a hex fill. */

export function contrast(color: string): string {
  const luminance = (c: string) =>
    (c.slice(1).match(/../g) as string[])
      .map((v) => parseInt(v, 16) / 255)
      .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
      .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i]!, 0);
  const l = luminance(color);
  const dark = "#153226";
  const d = luminance(dark);
  return (l + 0.05) / (d + 0.05) >= 1.05 / (l + 0.05) ? dark : "#FFFFFF";
}
