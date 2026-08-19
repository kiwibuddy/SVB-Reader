import React from 'react';
import { BibleBlock } from '@/types';
import GlowBubble from './GlowBubble';

interface BibleBlockProps {
  block: BibleBlock;
  bIndex: number;
  hasTail: boolean;
  isGlowing: boolean;
  onLongPress: (block: BibleBlock, index: number) => void;
  targetVerse?: number;
  targetChapter?: number;
  dimmed?: boolean;
}

const BibleBlockComponent: React.FC<BibleBlockProps> = ({
  block,
  bIndex,
  hasTail,
  isGlowing,
  onLongPress,
  targetVerse,
  targetChapter,
  dimmed,
}) => {
  return (
    <GlowBubble
      block={block}
      bIndex={bIndex}
      hasTail={hasTail}
      isGlowing={isGlowing}
      onLongPress={onLongPress}
      targetVerse={targetVerse}
      targetChapter={targetChapter}
      dimmed={dimmed}
    />
  );
};

export default BibleBlockComponent;
