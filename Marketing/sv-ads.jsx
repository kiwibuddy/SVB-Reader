/* SourceView Together 2.0 — five 9:16 Facebook/Reels ad mockups on one authored timeline.
   Every colour, size and string below is lifted from kiwibuddy/SVB-Reader@main
   (constants/Colors.ts, constants/Motion.ts, components/Bible/*, components/thread/*,
   app/(tabs)/cast/[voice].tsx, assets/data/UI-ENG.json, English questions/FamilyQuestions.json)
   or from the 2.0 screenshots supplied by the client. */

const P = {
  bg: '#F3F5F2', surf: '#FFFFFF', ink: '#101619', mute: '#5E6B70', hair: '#DFE5E0',
  narr: '#3A4550', divine: '#C0261A', prin: '#0E6B4C', chor: '#1D46A8',
  divFill: '#FBEDEB', prinFill: '#E9F4EF', chorFill: '#EBEFFA',
  thread: '#B4C0B8', cream: '#F2EAE0',
};
const INK = { black: P.narr, red: P.divine, green: P.prin, blue: P.chor };
const FILL = { black: P.surf, red: P.divFill, green: P.prinFill, blue: P.chorFill };
const BODY_INK = { black: P.ink, red: P.divine, green: P.prin, blue: P.chor };
const LEFT = { black: true, red: true, green: false, blue: false };

const SANS = '-apple-system, "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif';
const SERIF = 'Didot, "Bodoni 72", "Hoefler Text", Georgia, serif';

const W = 1080, H = 1920;
const DEV = { x: 144, y: 486, w: 792, h: 1300, pad: 10 };
const SCALE = (DEV.w - DEV.pad * 2) / 386;          // 386pt logical screen -> 772px
const SCREEN_H = (DEV.h - DEV.pad * 2) / SCALE;      // ~640pt

const NAMES = [
  'Ad 1 · Colours', 'Ad 2 · Whole stories', 'Ad 3 · Take a colour',
  'Ad 4 · Cast', 'Ad 5 · Talk about it',
];
const AD_LEN = 10;

const h = React.createElement;
const box = (style, ...kids) => h('div', { style }, ...kids);
const tx = (style, ...kids) => h('div', { style }, ...kids);

function an(T, start, end, from, to, ease) {
  return window.animate({ from, to, start, end, ease: ease || window.Easing.easeOutCubic })(T);
}
const ENTER = (T, at) => ({
  opacity: an(T, at, at + 0.34, 0, 1),
  transform: `translateY(${an(T, at, at + 0.42, 14, 0)}px)`,
});

/* ───────────────────────── shared app chrome ───────────────────────── */

function StatusBar({ time, tint, field }) {
  const c = tint || P.ink;
  const pill = field || P.bg;
  return box({ height: 44, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 22px 0 26px', flex: 'none' },
    tx({ font: `600 15px/1 ${SANS}`, color: c, letterSpacing: 0.2 }, time),
    box({ display: 'flex', alignItems: 'center', gap: 5 },
      box({ display: 'flex', alignItems: 'flex-end', gap: 1.5 },
        ...[3, 5, 7, 9].map((s, i) => box({ key: i, width: 3, height: s, borderRadius: 1,
          background: c, opacity: i > 2 ? 0.35 : 1 }))),
      box({ width: 15, height: 11, borderRadius: '50% 50% 2px 2px', border: `2px solid ${c}`,
        borderTopColor: 'transparent', transform: 'rotate(180deg)', opacity: 0.9 }),
      box({ width: 25, height: 13, borderRadius: 4, background: c, color: pill,
        font: `700 9px/13px ${SANS}`, textAlign: 'center' }, '72'))
  );
}

function TabBar({ active, tint, field }) {
  const items = [['Read', 'book'], ['Cast', 'people'], ['Plan', 'cal'], ['Saved', 'mark'], ['You', 'person']];
  const on = tint || P.prin, off = tint ? tint : P.mute;
  return box({ position: 'absolute', left: 0, right: 0, bottom: 0, height: 64,
    background: field || (tint ? 'transparent' : P.bg), borderTop: `1px solid ${tint ? 'rgba(242,234,224,0.2)' : P.hair}`,
    display: 'flex', alignItems: 'center', padding: '0 8px' },
    ...items.map(([label, kind], i) => {
      const sel = i === active;
      const c = sel ? on : off;
      return box({ key: label, flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 4, opacity: tint ? (sel ? 1 : 0.55) : 1 },
        Glyph(kind, c, sel),
        tx({ font: `${sel ? 600 : 500} 11px/1 ${SANS}`, color: c }, label));
    })
  );
}

function Glyph(kind, c, filled) {
  const s = { width: 24, height: 20, position: 'relative' };
  if (kind === 'book') return box(s,
    box({ position: 'absolute', left: 0, top: 1, width: 10.5, height: 17, border: `1.6px solid ${c}`,
      borderRight: 'none', borderRadius: '3px 0 0 3px', background: filled ? c : 'transparent' }),
    box({ position: 'absolute', right: 0, top: 1, width: 10.5, height: 17, border: `1.6px solid ${c}`,
      borderLeft: 'none', borderRadius: '0 3px 3px 0', background: filled ? c : 'transparent' }),
    filled ? box({ position: 'absolute', left: 11, top: 0, width: 2, height: 19, background: P.bg }) : null);
  if (kind === 'people') return box(s,
    box({ position: 'absolute', left: 1, top: 3, width: 8, height: 8, borderRadius: '50%',
      border: `1.6px solid ${c}`, background: filled ? c : 'transparent' }),
    box({ position: 'absolute', right: 1, top: 3, width: 8, height: 8, borderRadius: '50%',
      border: `1.6px solid ${c}`, background: filled ? c : 'transparent' }),
    box({ position: 'absolute', left: 0, bottom: 1, width: 9, height: 6,
      borderRadius: '5px 5px 0 0', border: `1.6px solid ${c}`, borderBottom: 'none',
      background: filled ? c : 'transparent' }),
    box({ position: 'absolute', right: 0, bottom: 1, width: 9, height: 6,
      borderRadius: '5px 5px 0 0', border: `1.6px solid ${c}`, borderBottom: 'none',
      background: filled ? c : 'transparent' }),
    filled ? box({ position: 'absolute', left: 10.5, top: 0, width: 3, height: 20,
      background: P.bg }) : null);
  if (kind === 'cal') return box(s,
    box({ position: 'absolute', left: 2, top: 2, right: 2, bottom: 1,
      border: `1.6px solid ${c}`, borderRadius: 4 }),
    box({ position: 'absolute', left: 2, top: 2, right: 2, height: 4, background: c,
      borderRadius: '3px 3px 0 0' }),
    box({ position: 'absolute', left: 5, top: 10, width: 3, height: 3, background: c }),
    box({ position: 'absolute', left: 10.5, top: 10, width: 3, height: 3, background: c }),
    box({ position: 'absolute', left: 16, top: 10, width: 3, height: 3, background: c }));
  if (kind === 'mark') return box(s,
    box({ position: 'absolute', left: 6, top: 1, width: 12, height: 17,
      border: `1.6px solid ${c}`, borderBottom: 'none', borderRadius: '3px 3px 0 0',
      background: filled ? c : 'transparent',
      clipPath: 'polygon(0 0,100% 0,100% 100%,50% 74%,0 100%)' }));
  return box(s,
    box({ position: 'absolute', left: 8, top: 1, width: 9, height: 9, borderRadius: '50%',
      border: `1.6px solid ${c}`, background: filled ? c : 'transparent' }),
    box({ position: 'absolute', left: 3.5, bottom: 1, width: 18, height: 8,
      borderRadius: '9px 9px 0 0', border: `1.6px solid ${c}`, borderBottom: 'none',
      background: filled ? c : 'transparent' }));
}

/* ───────────────────────── reader screen ───────────────────────── */

function StoryHeader({ title, meta, mix, note }) {
  return box({ padding: '24px 14px 0' },
    tx({ font: `600 22px/28px ${SANS}`, color: P.ink, letterSpacing: -0.3 }, title),
    tx({ font: `400 10px/14px ${SANS}`, color: P.mute, letterSpacing: 1, textTransform: 'uppercase',
      marginTop: 4 }, meta),
    box({ display: 'flex', gap: 2, height: 4, marginTop: 12 },
      ...mix.map(([ink, wgt], i) => box({ key: i, flexGrow: wgt, flexBasis: 0,
        background: INK[ink], borderRadius: 2 }))),
    tx({ font: `400 15px/20px ${SANS}`, color: P.mute, marginTop: 14 }, note)
  );
}

function CallSheet({ voices, selected, tapAt, t, open }) {
  const inks = ['black', 'red', 'green', 'blue'];
  return box({ margin: '8px 14px 0', border: `1px solid ${P.hair}`, borderRadius: 12,
    background: P.surf },
    box({ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px' },
      box({ flex: 1, display: 'flex', gap: 8 },
        ...inks.map((ink) => {
          const sel = selected === ink;
          const ring = sel && tapAt != null
            ? { boxShadow: `0 0 0 ${an(t, tapAt, tapAt + 0.5, 10, 0)}px ${INK[ink]}22` } : null;
          return box(Object.assign({ key: ink, width: 36, height: 36, borderRadius: 10,
            borderTopLeftRadius: 4, background: FILL[ink],
            border: `${sel ? 2 : 1}px solid ${INK[ink]}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center' }, ring),
            sel ? box({ width: 13, height: 7, borderLeft: `2px solid ${INK[ink]}`,
              borderBottom: `2px solid ${INK[ink]}`, transform: 'rotate(-45deg) translate(1px,-2px)' }) : null);
        })),
      tx({ font: `400 9px/12px ${SANS}`, color: P.mute, letterSpacing: 1.1,
        textTransform: 'uppercase' }, `${voices} voices ${open ? '⌃' : '⌄'}`))
  );
}

function Bubble({ b, dim, glow }) {
  const left = LEFT[b.ink];
  const ink = INK[b.ink];
  const bodyColor = BODY_INK[b.ink];
  return box({ margin: '0 14px 14px', display: 'flex', flexDirection: 'column',
    alignItems: left ? 'flex-start' : 'flex-end', opacity: dim ? 0.5 : 1,
    transition: 'none' },
    tx({ font: `600 9.5px/13px ${SANS}`, color: ink, letterSpacing: 1.6,
      textTransform: 'uppercase', margin: '0 2px 5px' }, b.name),
    box({ maxWidth: b.ink === 'black' ? '100%' : '84%', background: FILL[b.ink],
      border: `1px solid ${b.ink === 'black' ? P.hair : ink}`,
      borderRadius: 16, borderTopLeftRadius: left ? 5 : 16, borderTopRightRadius: left ? 16 : 5,
      padding: '13px 15px',
      boxShadow: glow ? `0 0 0 3px ${ink}22, 0 6px 18px ${ink}18` : '0 1px 3px rgba(16,22,25,0.05)' },
      tx({ font: `400 17px/26px ${SANS}`, color: bodyColor },
        b.v ? h('span', { style: { fontSize: 10, verticalAlign: 'super', letterSpacing: 0.5 } }, b.v + ' ') : null,
        b.text))
  );
}

function ReaderScreen({ story, blocks, shown, selected, tapAt, t }) {
  return box({ position: 'absolute', inset: 0, background: P.bg, display: 'flex',
    flexDirection: 'column', overflow: 'hidden' },
    h(StatusBar, { time: story.time }),
    StoryHeader(story),
    h(CallSheet, { voices: story.voices, selected, tapAt, t }),
    box({ marginTop: 20 },
      ...blocks.map((b, i) => i < shown
        ? box({ key: i, style: undefined, ...{} },
            h('div', { style: ENTER(t, b.at) }, h(Bubble, { b, dim: selected && selected !== b.ink, glow: selected === b.ink })))
        : null)),
    h(TabBar, { active: 0 })
  );
}

/* ───────────────────────── read-tab thread screen ───────────────────────── */

const DIVISIONS = [
  ['The Beginning', 'Genesis – Deuteronomy', '1 / 68'],
  ['History', 'Joshua – Esther', '86'],
  ['Wisdom', 'Job – Song of Songs', '35'],
  ['Major Prophets', 'Isaiah – Daniel', '59'],
  ['Minor Prophets', 'Hosea – Malachi', '17'],
  ['Gospels', 'Matthew – John', '42'],
];
const GOSPEL_BOOKS = [['Matthew', 11], ['Mathew', 0], ['Mark', 8], ['Luke', 13], ['John', 10]]
  .filter((b) => b[1] > 0);

function ThreadScreen({ t }) {
  const rowH = 46, top = 214;
  const rows = [];
  DIVISIONS.forEach((d, i) => rows.push({ kind: 'div', d, y: top + i * rowH }));
  const bookTop = top + DIVISIONS.length * rowH;
  GOSPEL_BOOKS.forEach((b, i) => rows.push({ kind: 'book', b, y: bookTop + i * rowH }));
  const tail = bookTop + GOSPEL_BOOKS.length * rowH;

  const yDiv = (i) => top + i * rowH + rowH / 2;
  const yBook = (i) => bookTop + i * rowH + rowH / 2;
  const y0 = yDiv(5) + 12, y1 = tail - 12;
  let d = `M 30 ${top - 26} V ${y0}`;
  d += ` A 11 11 0 0 0 41 ${y0 + 11} A 11 11 0 0 1 52 ${y0 + 22}`;
  d += ` V ${yBook(GOSPEL_BOOKS.length - 1)} V ${y1}`;
  d += ` A 11 11 0 0 1 41 ${y1 + 11} A 11 11 0 0 0 30 ${y1 + 22} V ${y1 + 70}`;
  const LEN = 660;
  const drawn = window.clamp(an(t, 1.4, 4.6, 0, 1), 0, 1);

  return box({ position: 'absolute', inset: 0, background: P.bg, overflow: 'hidden' },
    h(StatusBar, { time: '7:28' }),
    box({ margin: '10px 14px 0', height: 34, borderRadius: 17, background: P.surf,
      border: `1px solid ${P.hair}`, display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px' },
      box({ width: 13, height: 13, borderRadius: '50%', border: `1.6px solid ${P.mute}` }),
      tx({ font: `400 15px/20px ${SANS}`, color: P.mute }, 'Search voices, books, stories')),
    box({ margin: '10px 14px 0', borderRadius: 18, background: P.surf, border: `1px solid ${P.hair}`,
      padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 },
      box({ flex: 1 },
        tx({ font: `600 10px/13px ${SANS}`, color: P.prin, letterSpacing: 1.2,
          textTransform: 'uppercase' }, 'Today'),
        tx({ font: `700 20px/26px ${SANS}`, color: P.ink, letterSpacing: -0.3, marginTop: 3 },
          'The Glory of the Lord Returns'),
        tx({ font: `400 10px/14px ${SANS}`, color: P.mute, letterSpacing: 1,
          textTransform: 'uppercase', marginTop: 4 }, 'Eze 43:1–44:31 · 8 min')),
      box({ width: 0, height: 0, borderLeft: `13px solid ${P.prin}`,
        borderTop: '8px solid transparent', borderBottom: '8px solid transparent' })),
    h('svg', { width: 386, height: SCREEN_H, style: { position: 'absolute', left: 0, top: 0,
      pointerEvents: 'none' } },
      h('path', { d, fill: 'none', stroke: P.thread, strokeWidth: 1.5,
        strokeDasharray: LEN, strokeDashoffset: LEN * (1 - drawn) })),
    ...rows.map((r, i) => {
      const at = 1.6 + i * 0.16;
      const st = Object.assign({ position: 'absolute', left: 0, right: 0, top: r.y, height: rowH,
        display: 'flex', alignItems: 'center' }, ENTER(t, at));
      if (r.kind === 'div') {
        const active = r.d[0] === 'Gospels';
        return box({ key: i, ...st },
          box({ position: 'absolute', left: 30 - 5, width: 10, height: 10,
            border: `1.5px solid ${active ? P.prin : P.thread}`,
            background: active ? P.prin : P.bg, transform: 'rotate(45deg)' }),
          box({ paddingLeft: 46, flex: 1 },
            tx({ font: `600 17px/21px ${SANS}`, color: P.ink }, r.d[0]),
            tx({ font: `400 10px/14px ${SANS}`, color: P.mute, letterSpacing: 0.8,
              textTransform: 'uppercase', marginTop: 2 }, r.d[1])),
          tx({ font: `400 15px/20px ${SANS}`, color: P.mute, paddingRight: 14 }, r.d[2]));
      }
      return box({ key: i, ...st },
        box({ position: 'absolute', left: 52 - 4, width: 8, height: 8, borderRadius: '50%',
          border: `1.5px solid ${P.thread}`, background: P.bg }),
        box({ paddingLeft: 74, flex: 1 },
          tx({ font: `400 16px/21px ${SANS}`, color: P.ink },
            `${r.b[0]} · ${r.b[1]} stories`)),
        box({ marginRight: 14, width: 22, height: 22, borderRadius: '50%',
          border: `1.2px solid ${P.mute}`, display: 'flex', alignItems: 'center',
          justifyContent: 'center', font: `500 12px/1 ${SERIF}`, color: P.mute }, 'i'));
    }),
    h(TabBar, { active: 0 })
  );
}

/* ───────────────────────── cast voice card ───────────────────────── */

const JESUS_PARTNERS = [
  ['The Disciples', 23, 'green'], ['Simon Peter', 19, 'green'], ['The Crowd', 20, 'blue'],
  ['Jewish Leaders', 23, 'blue'], ['The Pharisees', 13, 'blue'], ['A Religious Teacher', 4, 'blue'],
  ['A Rich Young Man', 3, 'blue'], ['Pontius Pilate', 5, 'blue'],
];
const JESUS_TIMELINE = [68, 86, 35, 59, 17, 42, 12, 27, 21, 8];
const JESUS_LIT = [false, false, false, false, false, true, true, false, false, true];

function CastScreen({ t }) {
  const cream = P.cream;
  const maxP = 23;
  const lab = { font: `400 9px/12px ${SANS}`, color: cream, letterSpacing: 2,
    textTransform: 'uppercase', opacity: 0.85 };
  return box({ position: 'absolute', inset: 0, background: P.divine, overflow: 'hidden',
    paddingBottom: 64 },
    h(StatusBar, { time: '5:39', tint: cream, field: P.divine }),
    box({ padding: '4px 16px 0' },
      box({ width: 13, height: 22, borderLeft: `2.4px solid ${cream}`,
        borderBottom: `2.4px solid ${cream}`, transform: 'rotate(45deg)', marginLeft: 6, opacity: 0.9 })),
    box({ padding: '10px 16px 0' },
      tx({ ...lab, ...ENTER(t, 1.3) }, 'Divine voice · 002 of 769'),
      tx({ font: `400 62px/66px ${SERIF}`, color: cream, letterSpacing: -1, marginTop: 6,
        ...ENTER(t, 1.5) }, 'Jesus'),
      tx({ font: `400 14px/20px ${SANS}`, color: cream, opacity: 0.92, marginTop: 10,
        ...ENTER(t, 2.0) }, '41,239 words across 716 turns, in 47 of the 365 stories.'),
      box({ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12, ...ENTER(t, 2.3) },
        ...['Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Revelation'].map((b) =>
          tx({ key: b, font: `400 9px/12px ${SANS}`, color: cream, letterSpacing: 0.8,
            textTransform: 'uppercase', border: '1px solid rgba(242,234,224,0.35)',
            borderRadius: 7, padding: '4px 7px' }, b))),
      tx({ ...lab, marginTop: 18 }, 'Across the Bible'),
      box({ display: 'flex', gap: 2, height: 10, marginTop: 10 },
        ...JESUS_TIMELINE.map((w, i) => box({ key: i, flexGrow: w, flexBasis: 0, borderRadius: 2,
          background: JESUS_LIT[i] ? cream : 'rgba(242,234,224,0.22)',
          opacity: JESUS_LIT[i] ? an(t, 2.6 + i * 0.08, 3.0 + i * 0.08, 0.2, 1) : 1 }))),
      box({ display: 'flex', justifyContent: 'space-between', marginTop: 6 },
        tx({ font: `400 8px/11px ${SANS}`, color: cream, letterSpacing: 1,
          textTransform: 'uppercase', opacity: 0.6 }, 'Beginning'),
        tx({ font: `400 8px/11px ${SANS}`, color: cream, letterSpacing: 1,
          textTransform: 'uppercase', opacity: 0.6 }, 'End')),
      tx({ font: `400 11px/16px ${SANS}`, color: cream, opacity: 0.9, marginTop: 8,
        ...ENTER(t, 3.4) }, 'Gospels  ·  The Church Begins  ·  Revelation'),
      tx({ ...lab, marginTop: 18 }, 'Spoke with'),
      box({ height: 0 }),
      ...JESUS_PARTNERS.slice(0, 6).map((p, i) => {
        const at = 3.8 + i * 0.18;
        return box({ key: p[0], display: 'flex', alignItems: 'center', gap: 8, height: 44,
          borderTop: '1px solid rgba(242,234,224,0.2)', ...ENTER(t, at) },
          box({ width: 28, height: 28, borderRadius: 14, border: `1.5px solid ${cream}`,
            background: INK[p[2]], display: 'flex', alignItems: 'center', justifyContent: 'center' },
            box({ width: 8, height: 8, borderRadius: '50%', background: cream, marginTop: -3 })),
          tx({ flex: 1, font: `400 13px/18px ${SANS}`, color: cream }, p[0]),
          box({ width: 52, height: 3, background: 'rgba(242,234,224,0.25)' },
            box({ height: 3, background: cream,
              width: `${Math.round((p[1] / maxP) * 100 * window.clamp(an(t, at + 0.1, at + 0.6, 0, 1), 0, 1))}%` })),
          tx({ width: 24, textAlign: 'right', font: `400 10px/14px ${SANS}`, color: cream,
            opacity: 0.8 }, String(p[1])));
      })),
    h(TabBar, { active: 1, tint: cream, field: P.divine })
  );
}

/* ───────────────────────── talk about it ───────────────────────── */

const FAMILY_Q = [
  'What hard test did Abraham face?',
  'What does this teach about trust in God?',
  'Where do we need to trust God as a family?',
  'What step of trust will we take this week?',
];
const SG_Q1 = 'What tensions and choices stand out in Abraham’s test?'; // available if a switch beat is wanted

function TalkScreen({ t }) {
  const tabs = ['Family', 'School', 'Small Group'];
  const activeTab = 0;
  return box({ position: 'absolute', inset: 0, background: P.bg, overflow: 'hidden' },
    h(StatusBar, { time: '7:28' }),
    box({ margin: '30px 14px 0', display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
      opacity: 0.45 },
      tx({ font: `600 9.5px/13px ${SANS}`, color: P.chor, letterSpacing: 1.6,
        textTransform: 'uppercase', marginBottom: 5 }, 'Someone along the road'),
      box({ maxWidth: '84%', background: FILL.blue, border: `1px solid ${P.chor}`, borderRadius: 16,
        borderTopRightRadius: 5, padding: '13px 15px' },
        tx({ font: `400 17px/26px ${SANS}`, color: P.chor }, '“I will follow you wherever you go.”'))),
    box({ margin: '34px auto 0', width: 66, height: 66, borderRadius: 33,
      border: `2px solid ${P.prin}`, background: P.prinFill, display: 'flex', alignItems: 'center',
      justifyContent: 'center', ...ENTER(t, 1.2) },
      box({ width: 24, height: 13, borderLeft: `3px solid ${P.prin}`,
        borderBottom: `3px solid ${P.prin}`, transform: 'rotate(-45deg) translate(2px,-3px)' })),
    box({ margin: '26px 14px 0', border: `1px solid ${P.hair}`, borderRadius: 16,
      background: P.surf, paddingTop: 14, ...ENTER(t, 1.8) },
      tx({ font: `400 9px/12px ${SANS}`, color: P.mute, letterSpacing: 1.4,
        textTransform: 'uppercase', padding: '0 14px' }, 'Talk about it'),
      box({ display: 'flex', gap: 8, padding: '10px 14px 4px' },
        ...tabs.map((label, i) => box({ key: label, flex: 1, padding: '7px 0', borderRadius: 10,
          border: `1px solid ${i === activeTab ? P.prin : P.hair}`,
          background: i === activeTab ? P.prinFill : 'transparent', textAlign: 'center' },
          tx({ font: `${i === activeTab ? 600 : 400} 12px/16px ${SANS}`,
            color: i === activeTab ? P.prin : P.mute }, label)))),
      box({ padding: '10px 14px 12px' },
        ...FAMILY_Q.map((q, i) => box({ key: i, display: 'flex', gap: 10, marginBottom: 12,
          ...ENTER(t, 2.4 + i * 0.34) },
          box({ width: 5, height: 5, borderRadius: 2.5, background: P.prin, marginTop: 7 }),
          tx({ flex: 1, font: `400 14px/20px ${SANS}`, color: P.ink }, q)))),
      box({ borderTop: `1px solid ${P.hair}`, padding: '11px 0', textAlign: 'center' },
        tx({ font: `500 12px/16px ${SANS}`, color: P.prin, letterSpacing: 0.3 }, 'More questions ↻'))),
    h(TabBar, { active: 0 })
  );
}

/* ───────────────────────── ad frame ───────────────────────── */

function Device({ t, children }) {
  return box({ position: 'absolute', left: DEV.x, top: DEV.y, width: DEV.w, height: DEV.h,
    borderRadius: 52, background: '#0C1113', padding: DEV.pad,
    boxShadow: '0 46px 90px rgba(16,22,25,0.20), 0 6px 18px rgba(16,22,25,0.10)',
    opacity: an(t, 0.35, 0.95, 0, 1),
    transform: `translateY(${an(t, 0.35, 1.1, 44, 0)}px)` },
    box({ position: 'relative', width: '100%', height: '100%', borderRadius: 44,
      overflow: 'hidden', background: P.bg },
      box({ position: 'absolute', left: 0, top: 0, width: 386, height: SCREEN_H,
        transform: `scale(${SCALE})`, transformOrigin: '0 0' }, children))
  );
}

function Ad({ t, cap1, cap2, endTint, endLine, endSub, children }) {
  const capSwap = 6.7;
  const endAt = 8.3;
  const endY = an(t, endAt, endAt + 0.62, H, 0, window.Easing.easeInOutCubic);
  const showCap2 = t >= capSwap;
  return box({ position: 'absolute', inset: 0, background: P.bg, overflow: 'hidden' },
    box({ position: 'absolute', left: 72, right: 72, top: 118 },
      showCap2
        ? tx({ font: `600 62px/70px ${SANS}`, color: P.ink, letterSpacing: -1.6,
            textWrap: 'pretty', ...ENTER(t, capSwap) }, cap2)
        : tx({ font: `600 62px/70px ${SANS}`, color: P.ink, letterSpacing: -1.6,
            textWrap: 'pretty', ...ENTER(t, 0.15) }, cap1)),
    h(Device, { t }, children),
    box({ position: 'absolute', left: 72, right: 72, bottom: 62, display: 'flex',
      alignItems: 'center', justifyContent: 'space-between',
      opacity: an(t, 1.4, 2.0, 0, 1) },
      tx({ font: `600 30px/34px ${SANS}`, color: P.ink, letterSpacing: -0.4 },
        'SourceView Together'),
      tx({ font: `400 26px/30px ${SANS}`, color: P.mute, letterSpacing: 0.2 },
        'Free · no account · offline')),
    box({ position: 'absolute', inset: 0, background: endTint, transform: `translateY(${endY}px)`,
      padding: '0 84px', display: 'flex', flexDirection: 'column', justifyContent: 'center' },
      tx({ font: `600 80px/86px ${SANS}`, color: P.cream, letterSpacing: -2.4,
        textWrap: 'pretty' }, endLine),
      tx({ font: `400 38px/50px ${SANS}`, color: P.cream, opacity: 0.82, marginTop: 26,
        textWrap: 'pretty' }, endSub),
      box({ position: 'absolute', left: 84, right: 84, bottom: 96 },
        box({ height: 1, background: 'rgba(242,234,224,0.3)' }),
        tx({ font: `400 27px/34px ${SANS}`, color: P.cream, opacity: 0.8, marginTop: 24,
          letterSpacing: 0.4 }, 'SourceView Together 2.0 · free · iOS and Android')))
  );
}

/* ───────────────────────── the five ads ───────────────────────── */

const S275 = {
  time: '7:28', title: "The King's Final Days", meta: '275 · MAT 26:1–27:26 · 10 min',
  mix: [['black', 48], ['red', 30], ['green', 6], ['blue', 16]], voices: 14,
  note: 'Four parts — take one to read in your group',
};
const S275_BLOCKS = [
  { name: 'The Narrator', ink: 'black', v: '26¹', at: 1.5,
    text: 'When Jesus had finished saying all these things, he said to his disciples,' },
  { name: 'Jesus', ink: 'red', v: '²', at: 2.6,
    text: '“As you know, Passover begins in two days, and the Son of Man* will be handed over to be crucified.”' },
  { name: 'The Narrator', ink: 'black', v: '³', at: 4.0,
    text: 'At that same time the leading priests and elders were meeting at the residence of Caiaphas, the high priest, ⁴ plotting how to capture Jesus secretly and kill him.' },
  { name: 'Jewish Leaders', ink: 'blue', v: '⁵', at: 5.4,
    text: '“But not during the Passover celebration,”' },
];

const S268 = {
  time: '7:27', title: 'Prepared to Extend the Kingdom', meta: '268 · MAT 8:1–11:1 · 12 min',
  mix: [['black', 42], ['red', 48], ['green', 1], ['blue', 9]], voices: 15,
  note: 'Four parts — take one to read in your group',
};
const S268_BLOCKS = [
  { name: 'The Narrator', ink: 'black', v: '8¹', at: 1.4,
    text: 'Large crowds followed Jesus as he came down the mountainside. ² Suddenly, a man with leprosy approached him and knelt before him.' },
  { name: 'A Leper', ink: 'blue', v: '', at: 2.1, text: '“Lord,”' },
  { name: 'The Narrator', ink: 'black', v: '', at: 2.6, text: 'the man said,' },
  { name: 'A Leper', ink: 'blue', v: '', at: 3.1,
    text: '“if you are willing, you can heal me and make me clean.”' },
  { name: 'The Narrator', ink: 'black', v: '³', at: 4.0,
    text: 'Jesus reached out and touched him.' },
];

function shownCount(blocks, t) {
  let n = 0;
  blocks.forEach((b) => { if (t >= b.at) n += 1; });
  return n;
}

function Ad1({ t }) {
  return h(Ad, {
    t, cap1: 'Every word was said by someone.',
    cap2: 'The colour tells you who, before you read a word.',
    endTint: P.chor, endLine: 'Look who’s talking.',
    endSub: 'A Bible you read out loud, by voice.',
  }, h(ReaderScreen, { story: S275, blocks: S275_BLOCKS, shown: shownCount(S275_BLOCKS, t), t }));
}

function Ad2({ t }) {
  return h(Ad, {
    t, cap1: 'A chapter ends mid-thought.',
    cap2: '365 stories end where they end.',
    endTint: P.prin, endLine: 'One story. About ten minutes.',
    endSub: 'The whole Bible as ten divisions on one screen — and one continuous thread through it.',
  }, h(ThreadScreen, { t }));
}

function Ad3({ t }) {
  const selected = t >= 2.4 ? 'blue' : null;
  return h(Ad, {
    t, cap1: 'Four people. Four colours.',
    cap2: 'No codes. No host. Nothing to set up.',
    endTint: P.narr, endLine: 'Open the same story. Take a colour.',
    endSub: 'That is the entire setup. It works just as well on your own.',
  }, h(ReaderScreen, { story: S268, blocks: S268_BLOCKS, shown: shownCount(S268_BLOCKS, t),
    selected, tapAt: 2.4, t }));
}

function Ad4({ t }) {
  return h(Ad, {
    t, cap1: 'More than 770 voices.',
    cap2: '559 of them speak in exactly one story.',
    endTint: P.divine, endLine: 'Reading becomes meeting people.',
    endSub: 'Who they spoke with, how often, and where they appear across the Bible.',
  }, h(CastScreen, { t }));
}

function Ad5({ t }) {
  return h(Ad, {
    t, cap1: 'The questions are already written.',
    cap2: 'For a family, a classroom, or a small group.',
    endTint: P.prin, endLine: 'Nothing to prepare.',
    endSub: 'Four questions per story, three audiences, English and French.',
  }, h(TalkScreen, { t }));
}

const ADS = [Ad1, Ad2, Ad3, Ad4, Ad5];

function Piece() {
  const { T, CUES } = window.useComposition();
  return box({ position: 'absolute', inset: 0, background: P.bg },
    ...ADS.map((Cmp, i) => {
      const start = CUES[NAMES[i]];
      return h(window.Shot, { key: i, from: start, to: start + AD_LEN },
        box({ position: 'absolute', inset: 0 }, h(Cmp, { t: T - start })));
    })
  );
}

function AdsReel() {
  return h(window.CompositionStage, {
    width: W, height: H, scenes: window.OM_SCENES, playback: window.OM_PLAYBACK, bg: P.bg,
  }, h(Piece, null));
}

window.AdsReel = AdsReel;
if (typeof module !== 'undefined') module.exports = { AdsReel };
