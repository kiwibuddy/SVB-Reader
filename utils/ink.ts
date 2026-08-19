export type Ink = 'black' | 'red' | 'green' | 'blue';

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
