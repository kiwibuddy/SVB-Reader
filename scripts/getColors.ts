export const getColors = (color: string) => {
  switch (color) {
    case "black":
      return { dark: "#2D3748", light: "#F7FAFC" }; // Narrator - clean bright neutral
    case "red":
      return { dark: "#FFFFFF", light: "#FBB6CE" }; // God - bright vibrant pink, matches app's pink gradients
    case "green":
      return { dark: "#FFFFFF", light: "#81E6D9" }; // Main character - bright vibrant teal, energetic and modern
    case "blue":
      return { dark: "#FFFFFF", light: "#90CDF4" }; // Supporting characters - bright vibrant blue, matches app's energy
    default:
      return { dark: "#2D3748", light: "#F7FAFC" }; // Fallback to bright neutrals
  }
};