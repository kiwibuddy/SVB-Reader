import { BibleBlock, BibleInline } from "@/types";

export function splitIntoParagraphs(
  content: BibleBlock[]
): BibleBlock[] {

  const newContent: BibleBlock[] = [];

  // Logic to process colors
  for (const block of content) {
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

  return newContent;
}
