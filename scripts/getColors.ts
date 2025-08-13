export const getColors = (color: string) => {
  switch (color) {
    case "black":
      return { dark: "#2C2C2E", light: "#e6e6e6" }; // Dark gray instead of pure black
    case "red":
      return { dark: "#FF6B6B", light: "#fdc1c1" }; // Lighter red for dark mode
    case "green":
      return { dark: "#5EC85E", light: "#b9f8b9" }; // Lighter green for dark mode  
    case "blue":
      return { dark: "#5DADE2", light: "#8EE3FF" }; // Lighter blue for dark mode
    default:
      return { dark: "#2C2C2E", light: "#FFFFFF" }; // Fallback to dark gray and white
  }
};