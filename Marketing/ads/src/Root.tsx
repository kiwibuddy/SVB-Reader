import React from 'react';
import { Composition, Still } from 'remotion';
import { POST_H, POST_W, VoiceCard } from './posts/VoiceCard';
import { CastAd } from './ads/CastAd';
import { ColourAd } from './ads/ColourAd';
import { PlanAd } from './ads/PlanAd';
import { QuestionsAd } from './ads/QuestionsAd';
import { ScriptAd } from './ads/ScriptAd';
import { SearchAd } from './ads/SearchAd';
import { ThreadAd } from './ads/ThreadAd';
import { YouAd } from './ads/YouAd';
import { T } from './lib/timeline';
import { FPS, H, W } from './theme';

const ADS = [
  // Wave one — novelty: "that doesn't look like my Bible app".
  ['ScriptAd', ScriptAd],
  ['CastAd', CastAd],
  ['ThreadAd', ThreadAd],
  ['ColourAd', ColourAd],
  // Wave two — jobs to be done: lead a group, finish it, keep the habit,
  // don't lose your bearings.
  ['QuestionsAd', QuestionsAd],
  ['PlanAd', PlanAd],
  ['YouAd', YouAd],
  ['SearchAd', SearchAd],
] as const;

export const RemotionRoot: React.FC = () => (
  <>
    {ADS.map(([id, component]) => (
      <Composition
        key={id}
        id={id}
        component={component as React.FC<{ showGuides?: boolean }>}
        durationInFrames={T.TOTAL}
        fps={FPS}
        width={W}
        height={H}
        defaultProps={{ showGuides: false }}
      />
    ))}

    {/* Organic weekly post. Choose the voice with scripts/voice-card.mjs first —
        the card reads whatever that wrote into src/data/voice.json. */}
    <Still id="VoiceCard" component={VoiceCard} width={POST_W} height={POST_H} />
  </>
);
