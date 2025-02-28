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
}

const BibleBlockComponent: React.FC<BibleBlockProps> = ({ 
  block, 
  bIndex, 
  hasTail, 
  isGlowing,
  onLongPress 
}) => {
  return (
    <TouchableOpacity onLongPress={() => onLongPress(block, bIndex)}>
      <GlowBubble
        block={block}
        bIndex={bIndex}
        hasTail={hasTail}
        isGlowing={isGlowing}
      />
    </TouchableOpacity>
  );
};

export default BibleBlockComponent; 