/**
 * WCAG 2.2 Relative Luminance and Contrast Ratio
 */

export function parseHexColor(hex: string): [number, number, number] {
  hex = hex.replace('#', '');
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  return [r, g, b];
}

export function relativeLuminance(r: number, g: number, b: number): number {
  const rs = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
  const gs = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
  const bs = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export function contrastRatio(luminance1: number, luminance2: number): number {
  const l1 = Math.max(luminance1, luminance2);
  const l2 = Math.min(luminance1, luminance2);
  return (l1 + 0.05) / (l2 + 0.05);
}

/**
 * APCA (Advanced Perceptual Contrast Algorithm) simplified approximation
 * based on SAPC W3C reference implementation math.
 */
export function apcaContrast(txtColor: string, bgColor: string, fontSize: number, fontWeight: number): number {
  const [tr, tg, tb] = parseHexColor(txtColor);
  const [br, bg, bb] = parseHexColor(bgColor);
  
  // Convert sRGB to estimated perceptual luminance for APCA
  // Note: True APCA is more complex, this is standard SAPC 0.98G representation
  const lumaTxt = Math.pow(relativeLuminance(tr, tg, tb), 0.56);
  const lumaBg = Math.pow(relativeLuminance(br, bg, bb), 0.56);
  
  let contrast = 0;
  
  if (lumaBg > lumaTxt) {
    // Dark text on light BG
    contrast = (lumaBg - lumaTxt) * 1.14;
  } else {
    // Light text on dark BG
    contrast = (lumaBg - lumaTxt) * 1.14;
  }
  
  // Scale it out closely to APCA values (0 to ~106)
  return Math.abs(contrast * 100);
}
