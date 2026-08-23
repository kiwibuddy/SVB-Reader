export type Ink = 'black' | 'red' | 'green' | 'blue';

/** Full-bleed field color for Cast voice pages (and matching chrome). */
export function roleFill(color: string): string {
  if (color === 'red') return '#B4231A';
  if (color === 'green') return '#0E6B4C';
  if (color === 'black') return '#3A4550';
  return '#1D46A8';
}

export function isLeftVoice(color: string): boolean {
  return color === 'black' || color === 'red';
}

export function dominantInk(colors: {
  black?: number;
  red?: number;
  green?: number;
  blue?: number;
}): Ink {
  const spoken: [Ink, number][] = [
    ['red', colors.red || 0],
    ['green', colors.green || 0],
    ['blue', colors.blue || 0],
  ];
  spoken.sort((a, b) => b[1] - a[1]);
  if (spoken[0][1] > 0) return spoken[0][0];
  return 'black';
}

export function inkLabel(color: Ink, lang: 'en' | 'fr'): string {
  const en = {
    black: 'Narration',
    red: 'Divine voice',
    green: 'Main character',
    blue: 'Supporting cast',
  };
  const fr = {
    black: 'Narration',
    red: 'Voix divine',
    green: 'Personnage principal',
    blue: 'Seconds rôles',
  };
  return (lang === 'fr' ? fr : en)[color];
}
