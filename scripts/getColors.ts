import { ThreadColors } from '@/constants/Colors';

export const getColors = (color: string) => {
  switch (color) {
    case "black":
      return { dark: ThreadColors.dark.surf, light: ThreadColors.light.surf };
    case "red":
      return { dark: ThreadColors.dark.divFill, light: ThreadColors.light.divFill };
    case "green":
      return { dark: ThreadColors.dark.prinFill, light: ThreadColors.light.prinFill };
    case "blue":
      return { dark: ThreadColors.dark.chorFill, light: ThreadColors.light.chorFill };
    default:
      return { dark: ThreadColors.dark.surf, light: ThreadColors.light.surf };
  }
};

export const getBubbleTextColor = (color: string, isDarkMode: boolean) => {
  const palette = isDarkMode ? ThreadColors.dark : ThreadColors.light;
  switch (color) {
    case "red":
      return palette.divine;
    case "green":
      return palette.prin;
    case "blue":
      return palette.chor;
    default:
      return palette.ink;
  }
};

export const getBubbleTextColorSafe = (color: string | undefined | null, isDarkMode: boolean) => {
  if (!color) {
    return isDarkMode ? ThreadColors.dark.ink : ThreadColors.light.ink;
  }
  return getBubbleTextColor(color, isDarkMode);
};
