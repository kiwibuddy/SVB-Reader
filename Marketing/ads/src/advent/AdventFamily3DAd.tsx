import React from 'react';
import { AbsoluteFill, Audio, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { BrandLockup } from '../lib/Brand';
import { Phone, PHONE_W } from '../lib/Phone';
import { SafeArea, SafeZones } from '../lib/safe';
import { ColourRule, RevealLine } from '../lib/Type';
import { light, SAFE_BOX, SANS, W } from '../theme';
import { AdventEndCard } from './AdventShell';
import { ANNUNCIATION } from './data';
import { InviteCard, Journey, journeyItems, PartsReader, PlanFrame } from './screens';
import { ADVENT, AT } from './timeline';

/**
 * Families ad with the felt family (Marketing/ads/blender/advent_felt.py).
 * The 3D shots are rendered "on twos": 15 images a second, each held for two
 * frames, so they move like stop-motion. See ADVENT.md for the beat map.
 */
export const F3 = {
  OPEN_IMAGES: 84, // 3D opening: first candle, push into the phone
  HOOK_1: 8,
  HOOK_2: 28,
  HOOK_OUT: 112,
  CUT: 158, // 3D phone → app graphic, same place on screen
  CUT_END: 170,
  TAP: 236,
  SWAP: 350,
  CANDLES_IN: 640,
  CANDLES_START: 650,
  CANDLE_IMAGES: 65,
  CANDLE_LIGHT_AT: [0, 12, 24, 36], // in 3D images (15 fps)
  CTA: AT.CTA, // 780, shared end card
} as const;

const B_START = F3.SWAP + 20;
const RULE = [light.narr, light.divine, light.prin, light.chor];
const PHONE_X = (W - PHONE_W) / 2;
const PHONE_REST_Y = 486;
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const WEEKS = [
  { word: 'Hope', color: ADVENT.hope },
  { word: 'Peace', color: ADVENT.peace },
  { word: 'Joy', color: ADVENT.joy },
  { word: 'Love', color: ADVENT.love },
];

const pad = (n: number) => String(n).padStart(4, '0');

/**
 * Where the felt phone's screen lands in the last 3D frame (shot.json from
 * advent_felt.py): x 184–900, y 526–2006. The app graphic's screen is 501–2031,
 * so the 3D is stretched 3.4% about the screen centre during the dissolve and
 * the lines of the Plan tab sit on top of each other.
 */
const CUT_SCREEN = { centreY: 1266, stretch: 1530 / 1480 } as const;

/** One image of a 3D shot, held for two frames, with grain and a soft vignette. */
const FeltShot: React.FC<{ shot: 'open' | 'candles'; image: number; opacity?: number; stretchY?: number }> = ({
  shot,
  image,
  opacity = 1,
  stretchY = 1,
}) => {
  const seed = Math.floor(image);
  return (
    <AbsoluteFill style={{ opacity }}>
      <Img
        src={staticFile(`advent3d/${shot}/${pad(image)}.png`)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: `scaleY(${stretchY})`,
          transformOrigin: `50% ${CUT_SCREEN.centreY}px`,
        }}
      />
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, mixBlendMode: 'overlay', opacity: 0.22 }}>
        <filter id={`grain-${shot}-${seed}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={seed} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#grain-${shot}-${seed})`} />
      </svg>
      <AbsoluteFill
        style={{ background: 'radial-gradient(ellipse 85% 70% at 50% 58%, rgba(0,0,0,0) 60%, rgba(30,18,10,0.22) 100%)' }}
      />
    </AbsoluteFill>
  );
};

/** Brand background behind the header and text, fading into the scene below. */
const TopWash: React.FC<{ to: number; opacity?: number }> = ({ to, opacity = 1 }) => (
  <AbsoluteFill
    style={{
      opacity,
      background: `linear-gradient(to bottom, rgba(243,245,242,0.95) 0px, rgba(243,245,242,0.93) ${to - 170}px, rgba(243,245,242,0) ${to}px)`,
    }}
  />
);

/** Screen A: the Plan tab, already showing when the camera arrives; then a tap on Join. */
const JoinScreen: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <PlanFrame>
      <div style={{ position: 'absolute', left: 34, right: 34, top: 186 }}>
        <InviteCard appearAt={60} tapAt={F3.TAP} />
      </div>
      <div style={{ position: 'absolute', left: 34, right: 34, top: 516 }}>
        <Journey items={journeyItems(['hope'])} appearAt={70} stagger={4} current={frame > F3.TAP + 22 ? 'S365' : undefined} />
      </div>
    </PlanFrame>
  );
};

/** Screen B: Luke 1:26–38 as the app shows it. Dad, Mum and Leo share the narration; Ana reads Gabriel and Mary. */
const ReadScreen: React.FC = () => (
  <PartsReader
    story={ANNUNCIATION}
    lines={ANNUNCIATION.lines}
    readFrom={1}
    names={['Dad', 'Mum', 'Leo', 'Ana']}
    pick={3}
    namesAt={B_START}
    pickAt={B_START + 26}
    readAt={B_START + 44}
    step={34}
  />
);

export const AdventFamily3DAd: React.FC<{ showGuides?: boolean }> = ({ showGuides }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 3D images (1-based), each held two frames.
  const openImage = Math.min(F3.OPEN_IMAGES, Math.floor(frame / 2) + 1);
  const candleImage = Math.min(F3.CANDLE_IMAGES, Math.max(1, Math.floor((frame - F3.CANDLES_START) / 2) + 1));

  const cut = interpolate(frame, [F3.CUT, F3.CUT_END], [0, 1], { ...clamp, easing: (t) => t * t * (3 - 2 * t) });
  const hookOut = interpolate(frame, [F3.HOOK_OUT, F3.HOOK_OUT + 14], [0, 1], clamp);
  const headerIn = interpolate(frame, [0, 8], [0, 1], clamp);
  const ruleIn = interpolate(frame, [2, 20], [0, 1], clamp);
  const kickerIn = interpolate(frame, [F3.CUT_END, F3.CUT_END + 14], [0, 1], clamp);
  const swap = interpolate(frame, [F3.SWAP, F3.SWAP + 16], [0, 1], { ...clamp, easing: (t) => t * t * (3 - 2 * t) });
  const candlesIn = interpolate(frame, [F3.CANDLES_IN, F3.CANDLES_START + 4], [0, 1], clamp);
  const statementIn = interpolate(frame, [F3.CANDLES_START + 4, F3.CANDLES_START + 20], [0, 1], clamp);
  const drift = interpolate(frame, [F3.CUT_END, F3.CANDLES_IN], [0, -34], clamp);
  const ctaIn = spring({ frame: frame - F3.CTA, fps, config: { damping: 200 }, durationInFrames: 20 });

  const kicker = (text: string, opacity: number) => (
    <div
      style={{
        position: 'absolute',
        top: 116,
        left: 0,
        right: 0,
        opacity,
        font: `600 42px/52px ${SANS}`,
        letterSpacing: -0.8,
        color: light.ink,
      }}
    >
      {text}
    </div>
  );

  const inOpen = frame < F3.CUT_END;
  const inApp = frame >= F3.CUT && frame < F3.CANDLES_START + 4;
  const inCandles = frame >= F3.CANDLES_IN && frame < F3.CTA + 20;

  return (
    <AbsoluteFill style={{ background: light.bg }}>
      {/* "O come, O come, Emmanuel", music box and strings, timed to this ad (music/veni.py). */}
      <Audio src={staticFile('music/advent-music-box.mp3')} />
      {/* App section: the phone graphic, exactly where the 3D camera left the felt phone. */}
      {inApp && (
        <Phone x={PHONE_X} y={PHONE_REST_Y + drift}>
          <AbsoluteFill style={{ opacity: 1 - swap, transform: `translateX(${swap * -90}px)` }}>
            <JoinScreen />
          </AbsoluteFill>
          {swap > 0 && (
            <AbsoluteFill style={{ opacity: swap, transform: `translateX(${(1 - swap) * 90}px)` }}>
              <ReadScreen />
            </AbsoluteFill>
          )}
        </Phone>
      )}

      {/* 3D opening, dissolving into the app graphic at the cut. */}
      {inOpen && (
        <>
          <FeltShot
            shot="open"
            image={openImage}
            opacity={1 - cut}
            stretchY={interpolate(frame, [F3.CUT - 14, F3.CUT], [1, CUT_SCREEN.stretch], clamp)}
          />
          <TopWash to={660} opacity={(1 - cut) * (1 - hookOut * 0.75)} />
        </>
      )}

      {/* 3D candles: all four lit in turn under the closing line. */}
      {inCandles && (
        <>
          <FeltShot shot="candles" image={candleImage} opacity={candlesIn} />
          <TopWash to={760} opacity={candlesIn} />
        </>
      )}

      <SafeArea>
        <div style={{ opacity: headerIn }}>
          <BrandLockup morph={1} boxWidth={SAFE_BOX.width} />
        </div>
        <div style={{ position: 'absolute', top: 88, left: 0 }}>
          <ColourRule width={SAFE_BOX.width} progress={ruleIn} colors={RULE} />
        </div>

        {/* Hook over the opening scene. */}
        <div
          style={{
            position: 'absolute',
            top: 138,
            left: 0,
            right: 0,
            opacity: 1 - hookOut,
            transform: `translateY(${hookOut * -50}px)`,
          }}
        >
          <RevealLine text={"Advent starts Sunday, 29\u00A0November."} start={F3.HOOK_1} size={66} leading={78} color={light.ink} />
          <div style={{ height: 18 }} />
          <RevealLine text="Read it together, out loud." start={F3.HOOK_2} size={66} leading={78} color={ADVENT.purple} />
        </div>

        {kicker('One story a day to Christmas Eve.', kickerIn * (1 - swap) * (1 - candlesIn))}
        {kicker('Everyone takes a part.', swap * (1 - candlesIn))}

        {/* Closing line over the candles, and the four weeks lighting up with them. */}
        {inCandles && (
          <>
            <div
              style={{
                position: 'absolute',
                top: 134,
                left: 0,
                right: 0,
                opacity: statementIn,
                transform: `translateY(${(1 - statementIn) * 30}px)`,
              }}
            >
              <div style={{ font: `700 62px/72px ${SANS}`, letterSpacing: -1.8, color: light.ink }}>
                Ten minutes after dinner, every night to Christmas Eve.
              </div>
            </div>
            <div
              style={{
                position: 'absolute',
                top: 300, // between the line and the family, clear of the candles
                left: 0,
                right: 0,
                display: 'flex',
                justifyContent: 'center',
                opacity: statementIn,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  gap: 26,
                  padding: '16px 30px',
                  borderRadius: 40,
                  background: 'rgba(243,245,242,0.9)',
                  boxShadow: '0 8px 30px rgba(16,22,25,0.12)',
                }}
              >
                {WEEKS.map((w, i) => {
                  const litAt = F3.CANDLES_START + F3.CANDLE_LIGHT_AT[i] * 2 + 4;
                  const lit = interpolate(frame, [litAt, litAt + 8], [0, 1], clamp);
                  return (
                    <div
                      key={w.word}
                      style={{
                        font: `700 40px/48px ${SANS}`,
                        letterSpacing: -0.4,
                        color: lit > 0.5 ? w.color : '#B7BFC2',
                        transform: `scale(${1 + 0.12 * Math.sin(Math.PI * lit)})`,
                      }}
                    >
                      {w.word}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </SafeArea>

      {frame >= F3.CTA && <AdventEndCard enter={ctaIn} />}

      {showGuides && <SafeZones />}
    </AbsoluteFill>
  );
};
