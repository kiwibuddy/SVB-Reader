# Voice of the Week

A weekly organic post. One person who speaks in the Bible, the numbers behind
them, and where to find them. 1080 × 1350 (4:5), which is the largest an image
renders in the Facebook and Instagram feed.

The point of the series is not the person — it is that the app *knows* this about
every one of 769 speakers. Each post is a small proof of the same claim, and the
claim compounds over a year.

## Making one

```bash
cd Marketing/ads
node scripts/voice-card.mjs                        # shortlist of good candidates
node scripts/voice-card.mjs "Abraham's Servant"    # writes src/data/voice.json
npx remotion still src/index.ts VoiceCard out/voice-abrahams-servant.png
```

Nothing on the card is typed by hand. `scripts/voice-card.mjs` reads
`assets/data/conversations.json` and `SegmentReadingTimes.json`, so a card cannot
claim a figure the app does not hold. To change a card, change the data.

## Choosing the voice

Run the script with no argument and it lists speakers who say a lot in very few
places. That is the shape of a good post: a number large enough to be surprising,
attached to someone the reader did not expect to have one.

The best candidates so far:

| Voice | The hook |
| --- | --- |
| Abraham's Servant | 705 words, one story, and the text never gives him a name |
| Stephen | Speaks four times in the whole Bible. One of them is his last |
| Elihu | 2,350 words in a single story, and nobody answers him |
| Gabriel | 830 words across two stories, a thousand years apart |
| Asaph | 4,307 words — ninth most of anyone — and almost nobody knows the name |
| The Bride | 1,336 words in one story, unnamed, in Song of Songs |
| Deborah & Barak | 696 words, sung as one voice |

Avoid the obvious for the first months. Jesus, Moses and Paul are the least
surprising cards in the set, and the series works by surprise. Keep them for
Christmas and Easter, when the search volume is there anyway.

## The caption

The card carries the numbers, so the caption carries the story. Two or three
sentences, then the same closing line every week so the series is recognisable.

> Abraham sends his servant 800 kilometres to find a wife for Isaac. The servant
> says 705 words doing it — more than Isaac says in the entire Bible — and the
> text never once gives him a name.
>
> Every voice in the Bible, in SourceView Together.

Do not open with a question, do not use "Did you know", and do not moralise. The
fact is the hook. If the fact needs an argument to be interesting, pick a
different voice.

## Two data faults to know about

**`longestSpeech` can exceed a voice's own word total.** It does for 97 of the
769 speakers, by a handful of words each — the two counts tokenise differently.
`VoiceCard.tsx` drops the line when the two disagree rather than print a card
that contradicts itself. Worth fixing in the data generator eventually.

**`group` is not a reliable description.** It files 674 of 769 speakers as
`chorus`, including named people like Stephen. The card labels the voice by its
*colour* instead, using the app's own wording, so it never calls a named person
unnamed. Do not revert this — "Stephen · Unnamed" would be both wrong and
embarrassing.

See `Marketing/print/SOURCES.md` for the full claim list and the things that must
never appear in a public asset.
