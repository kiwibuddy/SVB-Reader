import React from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';
import voiceJson from '../data/voice.json';
import { INK, SANS, SERIF, VOICE_LABEL, VoiceColor, light } from '../theme';

/**
 * Voice of the Week — a 4:5 still for organic feed and stories.
 *
 * The data comes from src/data/voice.json, which scripts/voice-card.mjs writes
 * from the shipping conversation data. Nothing here is typed by hand, so a card
 * can never claim a number the app does not hold.
 *
 *   node scripts/voice-card.mjs                 # see who makes a good card
 *   node scripts/voice-card.mjs "Stephen"
 *   npx remotion still src/index.ts VoiceCard out/voice-stephen.png
 */

export const POST_W = 1080;
export const POST_H = 1350;

/**
 * Declared rather than inferred from the JSON. Several fields are null for some
 * voices and populated for others, so inferring the type would make the file
 * compile or fail depending on which voice happens to be checked in.
 */
type VoiceCardData = {
  name: string;
  color: string;
  group: string;
  rank: number;
  rankOf: number;
  words: number;
  turns: number;
  storyCount: number;
  stories: { id: string; title: string; ref: string; minutes: number | null }[];
  partners: { name: string; count: number; color: string }[];
  longestSpeech: { words: number; storyId: string; storyTitle: string } | null;
  longestExchange: {
    partner: string;
    turns: number;
    storyId: string;
    storyTitle: string;
  } | null;
};

const voice = voiceJson as VoiceCardData;

/** Deep grounds for a full-bleed field. The ink colours are tuned for text on
 *  a pale background and go muddy at this size. */
const FIELD: Record<VoiceColor, string> = {
  black: '#2C3644',
  red: '#9E1E14',
  green: '#0A5239',
  blue: '#153389',
};

const PAD = 84;

const Stat: React.FC<{ n: string; label: string }> = ({ n, label }) => (
  <div style={{ flex: 1 }}>
    <div
      style={{
        font: `700 74px/74px ${SANS}`,
        letterSpacing: -3,
        color: light.cream,
      }}
    >
      {n}
    </div>
    <div
      style={{
        font: `500 25px/33px ${SANS}`,
        color: light.cream,
        opacity: 0.62,
        marginTop: 12,
      }}
    >
      {label}
    </div>
  </div>
);

export const VoiceCard: React.FC = () => {
  const color = voice.color as VoiceColor;
  const field = FIELD[color] ?? FIELD.blue;
  const maxCount = Math.max(...voice.partners.map((p) => p.count), 1);
  const story = voice.stories[0];

  // conversations.json counts a longest speech a few words higher than the
  // voice's own total for 97 of the 769 speakers. Rather than publish a card
  // that contradicts itself, drop the line when the two disagree.
  const longestSpeech =
    voice.longestSpeech && voice.longestSpeech.words <= voice.words ? voice.longestSpeech : null;

  return (
    <AbsoluteFill
      style={{
        background: field,
        color: light.cream,
        display: 'flex',
        flexDirection: 'column',
        padding: `92px ${PAD}px 84px`,
      }}
    >
      {/* The four source colours, top edge — the mark that carries across
          every asset in the set. */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 14, display: 'flex' }}>
        {(['black', 'red', 'green', 'blue'] as VoiceColor[]).map((c) => (
          <div key={c} style={{ flex: 1, background: INK[c] }} />
        ))}
      </div>

      <div>
        <div
          style={{
            font: `700 25px/25px ${SANS}`,
            letterSpacing: 5,
            textTransform: 'uppercase',
            opacity: 0.66,
          }}
        >
          Voice of the week
        </div>

        <div
          style={{
            font: `400 ${voice.name.length > 18 ? 96 : 124}px/1.0 ${SERIF}`,
            letterSpacing: -3,
            marginTop: 36,
          }}
        >
          {voice.name}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 18,
            marginTop: 30,
            font: `600 27px/27px ${SANS}`,
            opacity: 0.72,
          }}
        >
          {/* The app's own category for this colour. Do not label by `group` —
              it files named people like Stephen under "chorus", so describing
              them as unnamed would be wrong on a public post. */}
          <span>{VOICE_LABEL[color]}</span>
          <span style={{ opacity: 0.4 }}>·</span>
          <span>
            {voice.rank}
            {voice.rank === 1 ? 'st' : voice.rank === 2 ? 'nd' : voice.rank === 3 ? 'rd' : 'th'} most
            words of {voice.rankOf} speakers
          </span>
        </div>

        <div
          style={{
            height: 2,
            background: light.cream,
            opacity: 0.22,
            margin: '34px 0 28px',
          }}
        />

        <div style={{ display: 'flex', gap: 24 }}>
          <Stat n={voice.words.toLocaleString()} label="words spoken" />
          <Stat n={String(voice.turns)} label="times they speak" />
          <Stat
            n={String(voice.storyCount)}
            label={voice.storyCount === 1 ? 'story, out of 365' : 'stories, out of 365'}
          />
        </div>

        {voice.partners.length > 0 && (
          <div style={{ marginTop: 38 }}>
            <div
              style={{
                font: `700 23px/23px ${SANS}`,
                letterSpacing: 4,
                textTransform: 'uppercase',
                opacity: 0.56,
                marginBottom: 22,
              }}
            >
              Spoke with
            </div>
            {voice.partners.map((p) => (
              <div
                key={p.name}
                style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 12 }}
              >
                <div
                  style={{
                    width: 372,
                    font: `600 30px/38px ${SANS}`,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {p.name}
                </div>
                <div
                  style={{
                    height: 20,
                    borderRadius: 10,
                    background: light.cream,
                    opacity: 0.9,
                    width: `${(p.count / maxCount) * 400}px`,
                  }}
                />
                <div style={{ font: `700 27px/27px ${SANS}`, opacity: 0.66 }}>{p.count}</div>
              </div>
            ))}
          </div>
        )}

        {/* The detail that makes the card worth reading twice — a voice with one
            speaking partner still has a longest speech. */}
        {(longestSpeech || voice.longestExchange) && (
          <div
            style={{
              font: `500 26px/38px ${SANS}`,
              opacity: 0.62,
              marginTop: 26,
            }}
          >
            {longestSpeech && (
              <span>Longest single speech: {longestSpeech.words.toLocaleString()} words</span>
            )}
            {longestSpeech && voice.longestExchange && (
              <span style={{ opacity: 0.5 }}>{'  ·  '}</span>
            )}
            {voice.longestExchange && (
              <span>
                Longest exchange: {voice.longestExchange.turns} turns with{' '}
                {voice.longestExchange.partner}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Where to find them, and the brand. Pushed to the foot of the card so a
          voice with four speaking partners cannot collide with it. */}
      <div style={{ marginTop: 'auto', paddingTop: 32 }}>
        {story && (
          <div
            style={{
              border: `2px solid rgba(242,234,224,0.3)`,
              borderRadius: 22,
              padding: '24px 32px',
              marginBottom: 32,
            }}
          >
            <div style={{ font: `600 23px/23px ${SANS}`, letterSpacing: 3.4, opacity: 0.56 }}>
              FIND THEM IN
            </div>
            <div style={{ font: `700 40px/48px ${SANS}`, letterSpacing: -1, marginTop: 14 }}>
              {story.title}
            </div>
            <div style={{ font: `500 27px/27px ${SANS}`, opacity: 0.66, marginTop: 12 }}>
              {story.ref}
              {story.minutes ? ` · ${story.minutes} min` : ''}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
          <Img
            src={staticFile('icon.png')}
            style={{ width: 76, height: 76, borderRadius: 18 }}
          />
          <div>
            <div style={{ font: `700 36px/38px ${SANS}`, letterSpacing: -1 }}>
              SourceView Together
            </div>
            <div style={{ font: `500 25px/25px ${SANS}`, opacity: 0.62, marginTop: 7 }}>
              All 365 stories. Every voice in them.
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
