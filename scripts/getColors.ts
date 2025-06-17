export const getColors = (color: string) => {
  switch (color) {
    case "black":
      return { dark: "#000000", light: "#e6e6e6" };
    case "red":
      return { dark: "#d60000", light: "#fdc1c1" }; // Dark red and light red
    case "green":
      return { dark: "#006400", light: "#b9f8b9" }; // Dark green and light green
    case "blue":
      return { dark: "#00008B", light: "#8EE3FF" }; // Dark blue and light blue
    default:
      return { dark: "#000000", light: "#FFFFFF" }; // Fallback to black and white
  }
};