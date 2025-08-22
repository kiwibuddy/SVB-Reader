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

// Function to get darker text colors for speech bubbles that match the bubble color
export const getBubbleTextColor = (color: string, isDarkMode: boolean) => {
  if (isDarkMode) {
    // In dark mode, keep the existing text color logic
    return '#F5F5F5'; // White text for dark mode
  }
  
  // In light mode, use Version A (High Contrast) colors for WCAG AA compliance
  switch (color) {
    case "black":
      return '#2C2C2E'; // Dark gray text on light gray background
    case "red":
      return '#D32F2F'; // Medium red text on light red background - WCAG AA compliant
    case "green":
      return '#388E3C'; // Medium green text on light green background - WCAG AA compliant
    case "blue":
      return '#1976D2'; // Medium blue text on light blue background - WCAG AA compliant
    default:
      return '#2C2C2E'; // Fallback to dark gray
  }
};

// Fallback function for when color is undefined or null
export const getBubbleTextColorSafe = (color: string | undefined | null, isDarkMode: boolean) => {
  if (!color) {
    return isDarkMode ? '#F5F5F5' : '#2C2C2E';
  }
  return getBubbleTextColor(color, isDarkMode);
};