export const getColors = (color: string) => {
  switch (color) {
    case "black":
      return { dark: "#4A5568", light: "#E2E8F0" }; // Narrator - darker gray background for better contrast
    case "red":
      return { dark: "#FFFFFF", light: "#F8BBD0" }; // God - richer rose pink, complements app's pink gradients  
    case "green":
      return { dark: "#FFFFFF", light: "#B2DFDB" }; // Main character - deeper teal, sophisticated and vibrant
    case "blue":
      return { dark: "#FFFFFF", light: "#BBDEFB" }; // Supporting characters - deeper blue, matches app's blue tones
    default:
      return { dark: "#4A5568", light: "#E2E8F0" }; // Fallback to darker neutrals
  }
};