import React from 'react';
import type { ViewProps } from 'react-native';
import { BibleBlock } from '@/types';
import GlowBubble from './GlowBubble';

interface BibleBlockProps {
  block: BibleBlock;
  bIndex: number;
  hasTail: boolean;
  isGlowing: boolean;
  onLongPress: (block: BibleBlock, index: number) => void;
  isTarget?: boolean;
  dimmed?: boolean;
  onLayout?: ViewProps['onLayout'];
}

const BibleBlockComponent: React.FC<BibleBlockProps> = ({
  block,
  bIndex,
  hasTail,
  isGlowing,
  onLongPress,
  isTarget,
  dimmed,
  onLayout,
}) => {
  return (
    <GlowBubble
      block={block}
      bIndex={bIndex}
      hasTail={hasTail}
      isGlowing={isGlowing}
      onLongPress={onLongPress}
      isTarget={isTarget}
      dimmed={dimmed}
      onLayout={onLayout}
    />
  );
};

export default BibleBlockComponent;
