// New file to handle check mark colors
export const getCheckColor = (readerColor: string | null) => {
  // If no reader color is selected, use the default green
  if (!readerColor) {
    return "#4CAF50";  // Default green
  }

  // If a reader role is selected, use the corresponding light color
  switch (readerColor) {
    case "black":
      return "#e6e6e6";  // Light grey
    case "red":
      return "#fdc1c1";  // Light red
    case "green":
      return "#b9f8b9";  // Light green
    case "blue":
      return "#8EE3FF";  // Light blue
    default:
      return "#4CAF50";  // Fallback to default green
  }
};
