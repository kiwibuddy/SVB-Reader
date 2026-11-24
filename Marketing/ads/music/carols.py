"""
Original arrangements of public-domain carols for the Advent 2026 films, written
in code. Times are in seconds (60 bpm, so one MIDI beat is one second).

  python carols.py dark|words|home|stars out.wav

Melodies, all public domain: "Silent Night" (Franz Gruber, 1818); "Joy to the
World" (ANTIOCH, Lowell Mason, 1839); "Deck the Halls" (traditional Welsh);
"We Three Kings" (John Henry Hopkins Jr., 1857). Instruments: FluidR3 GM (MIT).
Each track is exactly 30.0 s at -14 LUFS. Needs fluidsynth, ffmpeg, mido.
"""
import os
import subprocess
import sys
import tempfile

import mido

SF2 = "/usr/share/sounds/sf2/FluidR3_GM.sf2"
LENGTH_S = 30.0
PPQ = 480
DRUMS = 9


class Song:
    def __init__(self):
        self.events = []

    def program(self, ch, prog):
        self.events.append((0, 0, mido.Message("program_change", channel=ch, program=prog)))

    def cc(self, ch, ctrl, value, at=0):
        self.events.append((at, 1, mido.Message("control_change", channel=ch, control=ctrl, value=int(value))))

    def note(self, ch, pitch, at, dur, vel):
        if pitch is None or dur <= 0:
            return
        self.events.append((at, 2, mido.Message("note_on", channel=ch, note=int(pitch), velocity=int(max(1, min(127, vel))))))
        self.events.append((at + dur, 1.5, mido.Message("note_off", channel=ch, note=int(pitch), velocity=0)))

    def chord(self, ch, pitches, at, dur, vel, spread=0.0):
        for i, p in enumerate(pitches):
            self.note(ch, p, at + i * spread, dur - i * spread, vel)

    def save(self, path):
        mid = mido.MidiFile(ticks_per_beat=PPQ)
        tr = mido.MidiTrack()
        mid.tracks.append(tr)
        tr.append(mido.MetaMessage("set_tempo", tempo=mido.bpm2tempo(60), time=0))
        last = 0
        for at, _, msg in sorted(self.events, key=lambda e: (e[0], e[1])):
            tick = int(round(at * PPQ))
            tr.append(msg.copy(time=tick - last))
            last = tick
        mid.save(path)


def line(s, ch, notes, start, unit, vel, octave=0, legato=0.94):
    """notes: (pitch or None, units). Returns the end time."""
    at = start
    for p, u in notes:
        if p is not None:
            s.note(ch, p + octave, at, u * unit * legato, vel)
        at += u * unit
    return at


C3, D3, E3, F3, G3, A3, B3 = 48, 50, 52, 53, 55, 57, 59
C4, D4, E4, F4, G4, A4, B4 = 60, 62, 64, 65, 67, 69, 71
C5, D5, E5, F5, G5 = 72, 74, 76, 77, 79


# --------------------------------------------------------------------------
# Advent Starts in the Dark: "Silent Night", from one quiet piano to warm
# strings and bells. 0-14.4 s the first half of the verse in the dark; the
# candles light at 16, 17, 18, 19 s with a bell each; "Sleep in heavenly
# peace" twice; home on C under the end card (26 s).
# --------------------------------------------------------------------------
SN_A = [(G4, 3), (A4, 1), (G4, 2), (E4, 6), (G4, 3), (A4, 1), (G4, 2), (E4, 6),
        (D5, 4), (D5, 2), (B4, 6), (C5, 4), (C5, 2), (G4, 6)]                    # bars 1-8
SN_END = [(D5, 4), (D5, 2), (F5, 3), (D5, 1), (B4, 2), (C5, 6), (E5, 6),
          (C5, 3), (G4, 1), (E4, 2), (G4, 3), (F4, 1), (D4, 2), (C4, 12)]        # bars 17-23


def dark():
    s = Song()
    PIANO, CELLO, STR, CELESTA, BELLS, HARP = 0, 1, 2, 3, 4, 5
    for ch, prog in [(PIANO, 0), (CELLO, 42), (STR, 48), (CELESTA, 8), (BELLS, 14), (HARP, 46)]:
        s.program(ch, prog)
    unit = 0.3  # one eighth note
    # In the dark: piano alone, very soft, over a low pedal; the cello joins at 9 s.
    line(s, PIANO, SN_A, 0.2, unit, 44)
    for at, ch in [(0.2, [C3, G3]), (3.8, [C3, G3]), (7.4, [G3 - 12, G3]), (11.0, [C3, G3])]:
        s.chord(PIANO, ch, at, 3.6, 30)
    s.note(CELLO, C3 - 12 + 12, 9.0, 5.4, 46)
    # 14.4 s: light. Strings, harp and celesta take the melody up; a bell for each candle.
    end = line(s, CELESTA, SN_END, 14.4, unit, 62)
    line(s, STR, SN_END, 14.4, unit, 50, octave=-12)
    for at, notes in [(14.4, [G3, B3, D4]), (16.2, [G3, B3, F4]), (17.4, [C4, E4, G4]), (19.2, [C4, E4, G4]),
                      (21.0, [C4, E4, G4]), (22.2, [G3, B3, F4]), (23.4, [C4, E4, G4])]:
        s.chord(STR, [n - 12 for n in notes], at, 1.8, 46)
        for i in range(6):
            s.note(HARP, notes[i % 3] + 12, at + i * 0.3, 0.3, 40)
    for at, p in zip([16.0, 17.0, 18.0, 19.0], [C5, E5, G5, C5 + 12]):
        s.note(BELLS, p, at, 3, 70)
    # Home on C under the end card.
    s.chord(PIANO, [C3, G3, C4, E4, G4, C5], 26.0, 4, 54, spread=0.06)
    s.chord(STR, [C3, G3, C4, E4], 26.0, 4, 52)
    s.note(BELLS, C5, 26.0, 4, 54)
    return s


# --------------------------------------------------------------------------
# Heavy Words: "Joy to the World". 0-3 s the shop version (synth brass,
# glockenspiel, tambourine); 3-5 s "Advent gives them their weight back":
# silence but one chord; each word section opens on a one-second tacky sting
# for its costume, then the tune plain on piano with strings growing each week;
# 23-26 s the four words stack, warm; 26 s end card on D.
# --------------------------------------------------------------------------
A3_, B3_, Cs4, D4_, E4_, Fs4, G4_, A4_, B4_, Cs5, D5_ = 57, 59, 61, 62, 64, 66, 67, 69, 71, 73, 74
JOY_1 = [(D5_, 2), (Cs5, 1.5), (B4_, 0.5), (A4_, 3), (G4_, 1), (Fs4, 2), (E4_, 2), (D4_, 3)]   # "Joy to the world, the Lord is come"
JOY_2 = [(A4_, 1), (B4_, 3), (B4_, 1), (Cs5, 3), (Cs5, 1), (D5_, 5)]                            # "Let earth receive her King"
TRIAD = {"D": [62, 66, 69], "G": [55, 59, 62], "A": [57, 61, 64], "Bm": [59, 62, 66], "Em": [52, 55, 59]}


def words():
    s = Song()
    BRASS, GLOCK, PIANO, STR, BASS, BELLS = 0, 1, 2, 3, 4, 5
    for ch, prog in [(BRASS, 62), (GLOCK, 9), (PIANO, 0), (STR, 48), (BASS, 33), (BELLS, 14)]:
        s.program(ch, prog)

    def tacky(start, dur, phrase=JOY_1, unit=0.16):
        line(s, BRASS, phrase, start, unit, 74)
        line(s, GLOCK, phrase, start, unit, 70, octave=12)
        t = start
        while t < start + dur - 0.01:  # oom-pah and tambourine
            s.note(BASS, 38 if int((t - start) / 0.32) % 2 == 0 else 45, t, 0.15, 70)
            s.note(DRUMS, 54, t, 0.1, 66)
            s.note(DRUMS, 81, t + 0.16, 0.1, 50)
            t += 0.32

    # 0-3 s: the shop version.
    tacky(0.0, 2.9)
    s.chord(BRASS, [62, 66, 69, 74], 2.4, 0.5, 80)
    # 3-5 s: the turn. One soft chord.
    s.chord(PIANO, [50, 57, 62, 66], 3.1, 1.9, 40, spread=0.08)
    # Word sections: a one-second sting, then the tune plain.
    sections = [(5.0, JOY_1, 30), (9.5, JOY_2, 36), (14.0, JOY_1, 42), (18.5, JOY_2, 48)]
    for start, phrase, str_vel in sections:
        tacky(start, 0.9, phrase=phrase[:3], unit=0.16)
        end = line(s, PIANO, phrase, start + 1.4, 0.24, 56)
        harm = [("D", 1.2), ("A", 1.2), ("D", 1.4)] if phrase is JOY_1 else [("A", 1.4), ("A", 1.4), ("D", 1.0)]
        t = start + 1.4
        for name, d in harm:
            s.chord(PIANO, [n - 12 for n in TRIAD[name]], t, d, 38)
            s.chord(STR, [n - 12 for n in TRIAD[name]], t, d, str_vel)
            t += d
    # 23-26 s: the four words stack, warm and full.
    line(s, PIANO, JOY_1, 23.0, 0.2, 60)
    line(s, STR, JOY_1, 23.0, 0.2, 52)
    for name, at in [("D", 23.0), ("G", 24.0), ("A", 24.8)]:
        s.chord(STR, [n - 12 for n in TRIAD[name]], at, 1.0, 50)
    # 26 s end card: home on D, a bell.
    s.chord(PIANO, [38, 50, 57, 62, 66, 69], 26.0, 4, 56, spread=0.06)
    s.chord(STR, [38, 50, 57, 62], 26.0, 4, 50)
    s.note(BELLS, 74, 26.05, 4, 56)
    return s


# --------------------------------------------------------------------------
# Come Home to the Story: "Deck the Halls", lo-fi. Electric piano with a
# lazy swing over soft kick, brushed snare and hats; a soft chime as each
# message lands; 17.3 s the app, the tune brightens; 23.3 s "Come home to
# the story."; 26 s end card on C.
# --------------------------------------------------------------------------
BEAT = 60 / 84
DECK = [(G4, 1.5), (F4, 0.5), (E4, 1), (D4, 1), (C4, 1), (D4, 1), (E4, 1), (C4, 1),
        (D4, 0.5), (E4, 0.5), (F4, 0.5), (D4, 0.5), (E4, 1.5), (D4, 0.5), (C4, 1), (B3, 1), (C4, 2)]  # 16 beats
DECK_CH = [("C", 4), ("G", 2), ("C", 2), ("G", 2), ("C", 2), ("G", 2), ("C", 2)]
TRI_C = {"C": [48, 52, 55, 59], "G": [43, 50, 53, 55], "F": [41, 48, 52, 57], "Am": [45, 52, 55, 60]}
MESSAGES = [52, 88, 190, 228, 276, 340, 400, 446, 478]  # frames, from the film
MINE = {190, 340, 446}


def home():
    s = Song()
    RHODES, BASS, CHIME, PIANO = 0, 1, 2, 3
    for ch, prog in [(RHODES, 4), (BASS, 33), (CHIME, 11), (PIANO, 0)]:
        s.program(ch, prog)
    s.cc(RHODES, 91, 80)

    def groove(start, beats, vel=1.0):
        for k in range(int(beats * 2)):
            t = start + k * BEAT / 2 + (0.06 if k % 2 else 0)  # swing the off-beats
            if k % 4 == 0 or k % 8 == 5:
                s.note(DRUMS, 36, t, 0.1, 58 * vel)
            if k % 4 == 2:
                s.note(DRUMS, 38, t, 0.1, 34 * vel)
            s.note(DRUMS, 42, t, 0.05, (26 if k % 2 else 34) * vel)

    def chords(start, until):
        t = start
        while t < until - 0.01:
            for name, d in DECK_CH:
                if t >= until - 0.01:
                    return
                s.chord(RHODES, TRI_C[name], t, d * BEAT * 0.96, 46, spread=0.03)
                s.note(BASS, TRI_C[name][0] - 12, t, d * BEAT * 0.9, 62)
                t += d * BEAT

    # 0-17.3 s: the chat. The tune twice on the electric piano, lazily.
    line(s, RHODES, DECK, 0.0, BEAT, 58, octave=12)
    line(s, RHODES, DECK, 16 * BEAT, BEAT, 54, octave=12)
    chords(0.0, 17.3)
    groove(0.0, 17.3 / BEAT)
    for f in MESSAGES:  # a soft chime as each message lands
        s.note(CHIME, 88 if f in MINE else 84, f / 30, 0.4, 50)
    # 17.3-23.3 s: the app; brighter, piano doubles the tune.
    start = 17.3
    line(s, RHODES, DECK[:8], start, BEAT * 0.9, 60, octave=12)
    line(s, PIANO, DECK[:8], start, BEAT * 0.9, 52, octave=24)
    chords(start, 23.3)
    groove(start, 6.0 / BEAT, 1.15)
    # 23.3-26 s: "Come home to the story." The last "fa la la la la".
    line(s, PIANO, DECK[8:], 23.3, BEAT * 0.75, 56, octave=12)
    s.chord(RHODES, TRI_C["G"], 23.3, 2.4, 44)
    # 26 s end card: home on C.
    s.chord(RHODES, [48, 55, 60, 64, 67, 71], 26.0, 4, 56, spread=0.05)
    s.note(BASS, 36, 26.0, 4, 60)
    s.note(CHIME, 84, 26.0, 1.5, 46)
    return s


# --------------------------------------------------------------------------
# Count the Stars: "We Three Kings". 0-8 s the opening line twice on
# celesta over harp and a low drone (God tells Abraham to count the stars);
# 8-20 s the 26 stars light, one twinkle each, strings rising E minor to G;
# 20 s the wise men's star: a swell and bells; 23 s the app; 26 s end on G.
# --------------------------------------------------------------------------
Fs4_ = 66
KINGS = [(B4, 2), (A4, 1), (G4, 2), (E4, 1), (Fs4_, 1), (G4, 1), (Fs4_, 1), (E4, 3)]  # "We three kings of Orient are"
STAR_FRAMES = [250 + 13 * i for i in range(26)]  # when each day lights, from the film


def stars():
    s = Song()
    CELESTA, HARP, STR, CHOIR, BELLS, FLUTE, BASS = 0, 1, 2, 3, 4, 5, 6
    for ch, prog in [(CELESTA, 8), (HARP, 46), (STR, 48), (CHOIR, 52), (BELLS, 14), (FLUTE, 73), (BASS, 32)]:
        s.program(ch, prog)
    unit = 0.28
    em, c, g, d = [52, 55, 59], [48, 52, 55], [43, 47, 50], [50, 54, 57]
    # 0-8 s: the tune twice, sparse; a low E drone.
    line(s, CELESTA, KINGS, 0.1, unit, 64, octave=12)
    line(s, CELESTA, KINGS, 3.5, unit, 60, octave=12)
    s.note(BASS, 40, 0.0, 7.8, 54)
    s.chord(STR, em, 0.0, 7.8, 34)
    for k in range(14):
        s.note(HARP, em[k % 3] + 12, 0.1 + k * 0.5, 0.5, 36)
    # 8-20 s: the stars. A twinkle per star, harmony climbing, the flute takes the tune.
    for i, f in enumerate(STAR_FRAMES):
        s.note(CELESTA, [83, 88, 86, 91][i % 4] + (12 if i == 24 else 0), f / 30, 0.6, 46 + i)
    for chord, at in [(em, 8.0), (c, 11.0), (g, 14.0), (d, 17.0)]:
        s.chord(STR, chord, at, 3.0, 44 + int(at))
        s.chord(CHOIR, [n + 12 for n in chord], at, 3.0, 30 + int(at))
        s.note(BASS, chord[0] - 12, at, 3.0, 56)
        for k in range(12):
            s.note(HARP, chord[k % 3] + 12 + (12 if k % 6 >= 3 else 0), at + k * 0.25, 0.3, 40)
    line(s, FLUTE, KINGS, 11.0, unit, 56)
    line(s, FLUTE, KINGS, 14.5, unit, 60)
    # 20 s: the wise men's star. G major swells, bells.
    s.chord(STR, [43, 55, 59, 62, 67], 20.0, 3.0, 70)
    s.chord(CHOIR, [55, 59, 62, 67], 20.0, 3.0, 54)
    for at, p in [(20.0, 79), (20.6, 83), (21.2, 86)]:
        s.note(BELLS, p, at, 2.5, 66)
    # 23-26 s: the app, the tune once more, gently, in the celesta.
    line(s, CELESTA, KINGS, 23.0, unit, 56, octave=12)
    s.chord(STR, [43, 50, 55, 59], 23.0, 3.0, 46)
    # 26 s end card: home on G.
    s.chord(HARP, [43, 55, 59, 62, 67, 71], 26.0, 4, 54, spread=0.08)
    s.chord(STR, [43, 50, 55, 59], 26.0, 4, 50)
    s.note(BELLS, 79, 26.05, 4, 52)
    return s


ARRANGEMENTS = {"dark": dark, "words": words, "home": home, "stars": stars}


def render(name, out_wav):
    song = ARRANGEMENTS[name]()
    with tempfile.TemporaryDirectory() as tmp:
        mid = os.path.join(tmp, "song.mid")
        raw = os.path.join(tmp, "raw.wav")
        song.save(mid)
        subprocess.run(
            ["fluidsynth", "-ni", "-g", "0.7", "-r", "48000", "-F", raw,
             "-o", "synth.reverb.active=1", "-o", "synth.reverb.room-size=0.85",
             "-o", "synth.reverb.width=0.9", "-o", "synth.reverb.level=0.65",
             "-o", "synth.chorus.active=0", SF2, mid],
            check=True, capture_output=True)
        subprocess.run(
            ["ffmpeg", "-y", "-loglevel", "error", "-i", raw, "-af",
             f"apad=whole_dur={LENGTH_S},atrim=0:{LENGTH_S},afade=t=out:st={LENGTH_S - 0.6}:d=0.6,"
             "loudnorm=I=-14:TP=-1.5:LRA=11",
             "-ar", "48000", "-ac", "2", out_wav],
            check=True)
    print("wrote", out_wav)


if __name__ == "__main__":
    render(sys.argv[1], sys.argv[2])
