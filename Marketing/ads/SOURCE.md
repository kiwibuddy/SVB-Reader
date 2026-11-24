# Back to the source — three 30-second films

Design and copy: `docs/superpowers/specs/2026-11-24-back-to-the-source-design.md`,
`COPY.md` (wave three). Built in Remotion like the other ads; no AI imagery or voices.

| Composition | File | What it is |
| --- | --- | --- |
| `SourceMonologue` | `out/SourceMonologue.mp4` | Film 1: people in the Bible question God and he answers, as kinetic type; then the same voices in the app |
| `SourceWholeStory` | `out/SourceWholeStory.mp4` | Film 2: Jeremiah 29:11 pulls back into its story, then all 365 stories as a rose window |
| `SourceOutLoud` | `out/SourceOutLoud.mp4` | Film 3: public-domain etchings of Scripture read aloud, together, printed in the app's four inks |

## Rebuild

```bash
cd Marketing/ads
node scripts/source-data.mjs                    # quotes + 365-story voice mix -> src/source/data.ts
python scripts/etch.py fetch /tmp/art-cache     # originals (open access)
python scripts/etch.py print /tmp/art-cache     # -> public/source/art/*.jpg + credits.json
python music/source.py monologue  /tmp/m.wav && ffmpeg -i /tmp/m.wav -b:a 320k public/music/source-monologue.mp3
python music/source.py wholestory /tmp/w.wav && ffmpeg -i /tmp/w.wav -b:a 320k public/music/source-wholestory.mp3
python music/source.py outloud    /tmp/o.wav && ffmpeg -i /tmp/o.wav -b:a 320k public/music/source-outloud.mp3
for c in SourceMonologue SourceWholeStory SourceOutLoud; do
  npx remotion render src/index.ts $c out/$c.mp4 --codec=h264 --crf=18 --concurrency=4
done
```

## Rules these follow

- **Scripture verbatim.** Every quoted line is cut from `assets/data/newBibleNLT1.json`
  by `scripts/source-data.mjs`, which throws if a line no longer starts or ends where
  expected. Speaker labels and colours are the app's. References end in "NLT"
  (Tyndale's terms for quotations in non-salable media).
- **The rose window is our visualisation,** not an app screen: one spoke per story,
  clockwise from Genesis at 12 o'clock, each spoke full length and split by the share
  of words each voice speaks (narration inside, God at the rim).
- **No reading-time totals.** The app's minutes are silent-reading estimates; these
  films are about reading aloud.
- **Fonts** ship in `public/fonts/` (Instrument Serif, Inter; SIL Open Font Licence).
- **Music** is original, written in `music/source.py` (FluidR3 GM soundfont, MIT),
  in the Advent styles: Film 1 piano and cello, Film 2 music box and strings,
  Film 3 bright (glockenspiel, guitar, light beat). 30.0 s, -14 LUFS.

## Art credits (all public domain; credited on screen)

| Print | Work | Source |
| --- | --- | --- |
| `synagogue`, `synagogue-tall` | Rembrandt van Rijn, *Jews in the Synagogue*, 1648 | Art Institute of Chicago, open access (object 13103) |
| `ezra` | Gustave Doré, *Ezra Reads the Law to the People*, 1866 | Wikimedia Commons (PD) |
| `paul` | Marcantonio Raimondi after Raphael, *Saint Paul Preaching at Athens*, c. 1517–20 | Art Institute of Chicago, open access (object 106578) |
| `refectory` | Alphonse Legros, *The Refectory*, 1862 | Art Institute of Chicago, open access (object 116597) |

The prints are made by `scripts/etch.py`: the etching on warm paper, loose
hand-cut spot colours in the app's four inks behind the readers, slight
misregistration and grain.

## Before these run as paid ads

1. Swap the store chips on the end card for the official Apple and Google badges.
2. The fonts ship with the ads, so a Mac render matches this one.
