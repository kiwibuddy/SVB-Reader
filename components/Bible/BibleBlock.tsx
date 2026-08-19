import React from 'react';
import { TouchableOpacity } from 'react-native';
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
  spokenDimmed?: boolean;
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
  spokenDimmed,
}) => {
  return (
    <TouchableOpacity onLongPress={() => onLongPress(block, bIndex)}>
      <GlowBubble
        block={block}
        bIndex={bIndex}
        hasTail={hasTail}
        isGlowing={isGlowing}
        targetVerse={targetVerse}
        targetChapter={targetChapter}
        dimmed={dimmed}
        spokenDimmed={spokenDimmed}
      />
    </TouchableOpacity>
  );
};

export default BibleBlockComponent; 