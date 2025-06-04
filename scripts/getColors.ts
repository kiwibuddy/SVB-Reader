export const getColors = (color: string) => {
  switch (color) {
    case "black":
      return { dark: "#1C1C1E", light: "#F2F2F7" }; // Narrator - gray/neutral
    case "red":
      return { dark: "#FFFFFF", light: "#FFCDD2" }; // God - red tones
    case "green":
      return { dark: "#FFFFFF", light: "#81C784" }; // Main character - green tones
    case "blue":
      return { dark: "#FFFFFF", light: "#BBDEFB" }; // Supporting characters - blue tones
    default:
      return { dark: "#1C1C1E", light: "#F2F2F7" }; // Fallback to clean grays
  }
};