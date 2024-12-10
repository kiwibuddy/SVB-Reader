import { BibleBlock, BibleInline } from "@/types";

export function splitContentIntoReaderParts(
  content: BibleBlock[],
  readerColors: string[]
): BibleBlock[] {
  // Check if all colors are unique
  const uniqueColors = new Set(readerColors);
  if (uniqueColors.size === readerColors.length) {
    return content; // Return original content if all colors are unique
  }

  const newContent: BibleBlock[] = [];

  // Logic to process colors
  for (const block of content) {
    const matchingIndices = readerColors
      .map((color, index) => (color === block.source.color ? index : -1))
      .filter(index => index !== -1); // Get indices of matching colors
    if (matchingIndices.length === 1) {
      newContent.push(block); // Add matching color blocks to newContent
    } else {
      // Special logic for non-unique colors
      let blockCopy: BibleBlock | null = null; // Initialize blockCopy as null
      for (const child of block.children) {
        if (child.start || child.type === "table") {
          if (blockCopy && blockCopy.children.length > 0) {
            newContent.push(blockCopy); // Push the previous copy to newContent only if it has children
          }
          blockCopy = { ...block, children: [] }; // Create a new copy with empty children
        } else {
          if (!blockCopy) {
            blockCopy = { ...block, children: [] }; // Create a new copy with empty children
          }
        }
        if (blockCopy) {
          blockCopy.children.push(child); // Add child to the current copy
        }
      }
      if (blockCopy) { // Ensure we push the last blockCopy if it exists
        newContent.push(blockCopy); // Push the final copy after the loop
      }
    }
  }

  return newContent;
}
