# Advent 2026, second wave — four films

Four 30-second films, each its own technique and music, all built on the app's
26-day Advent plan (Sun 29 Nov to Christmas Eve). Concepts: the "Advent, five
ways" page; the owner chose 5, 1, 4 and 2. No AI imagery or voices; no photos of
people. Every quote is cut from the app's NLT text by `scripts/advent26-data.mjs`.

| Order | Composition | File | Technique | Music |
| --- | --- | --- | --- | --- |
| 1 | `Advent26Dark` | `out/AdventDark.mp4` | Type revealed only where candlelight reaches it; four candles light; ends warm on Day 1 in the app | Silent Night: one piano in the dark, then strings and a bell per candle |
| 2 | `Advent26Words` | `out/AdventHeavyWords.mp4` | Hope, Peace, Joy, Love in shop-window costumes that fall away, each word left with a line from its week | Joy to the World: a tacky shop jingle per costume, then plain piano |
| 3 | `Advent26Home` | `out/AdventComeHome.mp4` | A family group chat (flights home, Mum suggests the readings, the sceptical sibling joins) becomes the parts picker | Deck the Halls, lo-fi, a chime per message |
| 4 | `Advent26Stars` | `out/AdventCountTheStars.mp4` | A generated night sky: the plan's 26 days light up as stars, from Abraham's stars (Day 3) to the wise men's (Day 25) | We Three Kings: celesta and harp, a twinkle per star |

## Scripture used (all NLT, from the plan)

Isaiah 9:2 (Day 7) · Revelation 21:4 (Day 1) · John 1:5 (Day 19) · Isaiah 9:6 (Day 7) ·
Micah 5:5 (Day 9) · Zephaniah 3:17 (Day 16) · Matthew 1:23 (Day 25) · Genesis 15:5
(Day 3) · Matthew 2:2 (Day 25). The end cards say "26 stories to Christmas. Join any
day." so the films stay true all December (late joiners start at today's story).

## Rebuild

```bash
cd Marketing/ads
node scripts/advent26-data.mjs
for t in dark words home stars; do python music/carols.py $t /tmp/$t.wav && ffmpeg -y -i /tmp/$t.wav -b:a 320k public/music/advent-$t.mp3; done
npx remotion render src/index.ts Advent26Dark  out/AdventDark.mp4          --codec=h264 --crf=18 --concurrency=4
npx remotion render src/index.ts Advent26Words out/AdventHeavyWords.mp4    --codec=h264 --crf=18 --concurrency=4
npx remotion render src/index.ts Advent26Home  out/AdventComeHome.mp4      --codec=h264 --crf=18 --concurrency=4
npx remotion render src/index.ts Advent26Stars out/AdventCountTheStars.mp4 --codec=h264 --crf=18 --concurrency=4
```

## Music

`music/carols.py`: original arrangements (FluidR3 GM soundfont, MIT) of public-domain
carols: Silent Night (Gruber, 1818), Joy to the World (ANTIOCH, Mason, 1839), Deck the
Halls (traditional Welsh), We Three Kings (Hopkins, 1857). Each 30.0 s at -14 LUFS.
Fonts: Instrument Serif, Inter, Pinyon Script, Monoton (all SIL OFL, in `public/fonts/`).

## Suggested run

- Advent Starts in the Dark: from now through Week 1 (Hope).
- Heavy Words: all Advent; also cuts into four weekly spots.
- Count the Stars: Weeks 2–3.
- Come Home to the Story: 14–24 December, while people travel home.

## Meta copy

### Advent Starts in the Dark
> Not everyone feels Christmassy this year. Advent was never meant to pretend: it
> starts in the dark and waits for the light. SourceView Together walks through 26
> Bible stories to Christmas, about ten minutes a night, alone or out loud together.

**Headline:** Advent starts in the dark · **CTA:** Install Now

### Heavy Words
> Hope, peace, joy and love will be on every shop window this month. Advent gives
> the words their weight back: four weeks, 26 Bible stories, one story to Christmas,
> read out loud together in SourceView Together.

**Headline:** Give the words their weight back · **CTA:** Install Now

### Come Home to the Story
> December is when everyone comes home. This year, try ten minutes after dinner with
> the Advent readings: SourceView Together gives everyone a part, so the whole family
> reads the story together, from the first promise to Christmas Eve.

**Headline:** Come home to the story · **CTA:** Install Now

### Count the Stars
> Christmas didn't start in Bethlehem. On Day 3 of Advent, God tells Abraham to count
> the stars; on Day 25, wise men follow one. SourceView Together takes you through all
> 26 stories in between, one a day to Christmas.

**Headline:** It started under these stars · **CTA:** Install Now
