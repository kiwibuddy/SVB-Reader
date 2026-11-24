"""
Original scores for the "Back to the source" films, written in code.

  python source.py monologue|wholestory|outloud out.wav

Instruments: the FluidR3 GM soundfont (MIT licence). All three melodies are
original. Every track is exactly 30.0 s
at -14 LUFS. 120 bpm, so one beat is half a second and every cut in the films
lands on a beat. Needs: fluidsynth, fluid-soundfont-gm, ffmpeg, mido.
"""
import os
import subprocess
import sys
import tempfile

import mido

BPM = 120
PPQ = 480
SF2 = "/usr/share/sounds/sf2/FluidR3_GM.sf2"
LENGTH_S = 30.0
DRUMS = 9


def beat(seconds):
    return seconds * BPM / 60


class Song:
    def __init__(self):
        self.events = []

    def program(self, ch, prog):
        self.events.append((0, 0, mido.Message("program_change", channel=ch, program=prog)))

    def cc(self, ch, ctrl, value, at):
        self.events.append((at, 1, mido.Message("control_change", channel=ch, control=ctrl, value=int(value))))

    def note(self, ch, pitch, at, dur, vel):
        self.events.append((at, 2, mido.Message("note_on", channel=ch, note=int(pitch), velocity=int(vel))))
        self.events.append((at + dur, 1.5, mido.Message("note_off", channel=ch, note=int(pitch), velocity=0)))

    def chord(self, ch, pitches, at, dur, vel, spread=0.0):
        for i, p in enumerate(pitches):
            self.note(ch, p, at + i * spread, dur - i * spread, vel)

    def save(self, path):
        mid = mido.MidiFile(ticks_per_beat=PPQ)
        tr = mido.MidiTrack()
        mid.tracks.append(tr)
        tr.append(mido.MetaMessage("set_tempo", tempo=mido.bpm2tempo(BPM), time=0))
        last = 0
        for at, _, msg in sorted(self.events, key=lambda e: (e[0], e[1])):
            tick = int(round(at * PPQ))
            tr.append(msg.copy(time=tick - last))
            last = tick
        mid.save(path)


# Pitch helpers: D minor family.
D2, F2, A2, C3, D3, E3, F3, G3, A3, Bb2, Bb3, C4, D4, E4, F4, G4, A4, Bb4, C5, D5, E5, F5, A5 = (
    38, 41, 45, 48, 50, 52, 53, 55, 57, 46, 58, 60, 62, 64, 65, 67, 69, 70, 72, 74, 76, 77, 81)

CH = {  # chord voicings for the felt-piano ostinato (eighth notes), and bass roots
    "Dm": ([D4, F4, A4, E5], D2),
    "Bb": ([D4, F4, Bb4, C5], Bb2 - 12 + 12),
    "F": ([C4, F4, A4, C5], F2),
    "C": ([C4, E4, G4, D5], C3 - 12),
    "Gm": ([D4, G4, Bb4, D5], G3 - 12),
}


def play(s, ch, tune, start, vel, octave=0, until=999, legato=0.95):
    """A melody as (pitch or None, beats) pairs from `start`."""
    at = start
    for p, d in tune:
        if at >= until:
            break
        if p is not None:
            s.note(ch, p + octave, at, d * legato, vel)
        at += d
    return at


def broken(s, ch, chords, start, vel, per_beat=2, until=999, pattern=(0, 1, 2, 1)):
    """Broken chords, Advent piano style: (name, beats) through CHORDS."""
    at = start
    for name, d in chords:
        notes = CHORDS[name]
        for i in range(int(d * per_beat)):
            if at + i / per_beat >= until:
                return
            s.note(ch, notes[pattern[i % len(pattern)]], at + i / per_beat, 1 / per_beat * 0.92, vel)
        at += d


def pad(s, ch, chords, start, vel, octave=-12, bass_ch=None, bass_vel=52, until=999):
    at = start
    for name, d in chords:
        if at >= until:
            return
        notes = CHORDS[name]
        s.chord(ch, [n + octave for n in notes], at, d, vel)
        if bass_ch is not None:
            s.note(bass_ch, notes[0] - 24, at, d, bass_vel)
        at += d


CHORDS = {
    "Dm": [62, 65, 69], "Bb": [58, 62, 65], "Gm": [55, 58, 62], "C": [60, 64, 67], "F": [60, 65, 69],
    "A": [57, 61, 64], "D": [62, 66, 69], "G": [55, 59, 62], "Bm": [59, 62, 66], "Em": [52, 55, 59],
}


def monologue():
    """Film 1, piano and cello (the Advent piano-cello style). 120 bpm: every cut is a beat.
    0-13.5 s questions and answers: the cello sings a D minor tune over broken piano chords;
    13.5-17.5 s the father: piano alone, very soft; 17.5 s "It was never a monologue." the
    tune turns to F major; 20 s the app; 26 s the end card resolves on F."""
    s = Song()
    CELLO, PIANO, STR, BASS = 0, 1, 2, 3
    for ch, prog in [(CELLO, 42), (PIANO, 0), (STR, 48), (BASS, 32)]:
        s.program(ch, prog)
    s.cc(CELLO, 91, 70, 0)
    QA = [(57, 1), (62, 1), (65, 1), (64, 1), (62, 2), (57, 2),
          (58, 1), (62, 1), (67, 1), (65, 1), (64, 2), (60, 2),
          (57, 1), (62, 1), (65, 1), (69, 1), (67, 2), (65, 1), (64, 1),
          (62, 3)]
    QA_CH = [("Dm", 4), ("Bb", 2), ("Dm", 2), ("Gm", 2), ("Bb", 2), ("C", 4),
             ("Dm", 2), ("F", 2), ("Bb", 2), ("C", 2), ("Dm", 3)]
    play(s, CELLO, QA, 0, 74, octave=-12)
    broken(s, PIANO, QA_CH, 0, 40, until=27)
    pad(s, STR, QA_CH, 0, 34, bass_ch=BASS, until=27)
    # 13.5-17.5 s: the father's line. Piano alone, two soft chords, a high note on "unbelief".
    s.chord(PIANO, [50, 57, 62, 65], 27, 4, 46, spread=0.12)
    s.chord(PIANO, [46, 58, 62, 65], 31, 4, 44, spread=0.12)
    s.chord(STR, [50, 57, 62], 27, 4, 40)
    s.chord(STR, [46, 53, 58], 31, 4, 40)
    s.note(PIANO, 81, beat(16.6), 2, 40)
    # 17.5 s: the turn. The tune in F major, strings join; 20 s the app.
    LIFT = [(60, 1), (65, 1), (69, 1), (67, 1), (65, 2), (60, 2),
            (62, 1), (65, 1), (70, 1), (69, 1), (67, 2), (64, 2),
            (65, 1), (69, 1), (72, 1), (70, 1), (69, 2), (67, 2)]
    LIFT_CH = [("F", 4), ("Bb", 2), ("C", 2), ("Bb", 2), ("C", 2), ("Dm", 2), ("C", 2), ("Bb", 2), ("C", 2)]
    play(s, CELLO, LIFT, 35, 78, octave=-12, until=52)
    broken(s, PIANO, LIFT_CH, 35, 44, until=52)
    pad(s, STR, LIFT_CH, 35, 44, bass_ch=BASS, until=52)
    # 26 s end card: home on F.
    s.chord(PIANO, [53, 60, 65, 69, 72], 52, 8, 56, spread=0.07)
    s.chord(STR, [41, 53, 60, 65], 52, 8, 50)
    s.note(CELLO, 41, 52, 8, 64)
    return s


def wholestory():
    """Film 2, music box and strings (the Advent music-box style). 0-2.5 s the verse card:
    the music box alone, sweet; 2.5 s the floor drops to low strings and cello; 8-16 s the
    rose fills: the music-box tune returns over harp and building strings, a bell as it
    closes; 16-20 s warm; 20 s Day 1; 26 s the end card resolves on D."""
    s = Song()
    BOX, CELLO, HARP, STR, CHOIR, BELL, BASS = 0, 1, 2, 3, 4, 5, 6
    for ch, prog in [(BOX, 10), (CELLO, 42), (HARP, 46), (STR, 48), (CHOIR, 52), (BELL, 14), (BASS, 32)]:
        s.program(ch, prog)
    TUNE = [(74, 1), (78, 1), (81, 1), (86, 1), (85, 2), (81, 2),
            (83, 1), (81, 1), (78, 1), (76, 1), (74, 4)]
    play(s, BOX, TUNE[:6], 0, 64)  # 0-4 beats: the cliché, sweet and bright
    s.chord(HARP, [62, 66, 69], 0, 5, 40, spread=0.1)
    # 2.5-8 s: exiles; low and still.
    s.note(CELLO, 38, 5, 7, 66)
    s.chord(STR, [50, 57, 62], 5, 7, 42)
    play(s, CELLO, [(57, 2), (55, 2), (54, 3)], 5, 60)
    s.chord(STR, [47, 55, 59], 12, 4, 44)  # "Do you know the story?" hangs on Em/G
    s.note(BOX, 83, 13, 2, 40)
    # 8-16 s: the rose. The tune returns, everything builds.
    RCH = [("D", 4), ("Bm", 4), ("G", 4), ("A", 4)]
    play(s, BOX, TUNE + [(None, 0)], 16, 66)
    play(s, BOX, TUNE[:6], 28, 70)
    broken(s, HARP, RCH, 16, 46, per_beat=4, pattern=(0, 1, 2, 1))
    pad(s, STR, RCH, 16, 48, bass_ch=BASS)
    pad(s, CHOIR, RCH[1:], 20, 34, octave=0)
    s.note(BELL, 74, beat(14.7), 4, 74)
    # 16-20 s: warm.
    pad(s, STR, [("G", 4), ("D", 4)], 32, 56, bass_ch=BASS)
    pad(s, CHOIR, [("G", 4), ("D", 4)], 32, 40, octave=0)
    play(s, BOX, [(83, 2), (81, 2), (78, 2), (81, 2)], 32, 60)
    # 20-26 s: Day 1; the tune once more, lighter.
    play(s, BOX, TUNE, 40, 58)
    broken(s, HARP, [("D", 4), ("Bm", 4), ("G", 2), ("A", 2)], 40, 40, per_beat=2)
    pad(s, STR, [("D", 4), ("Bm", 4), ("G", 2), ("A", 2)], 40, 40, bass_ch=BASS)
    # 26 s end card.
    s.chord(HARP, [62, 66, 69, 74], 52, 8, 50, spread=0.08)
    s.chord(STR, [50, 57, 62, 66], 52, 8, 50)
    s.note(BOX, 86, 52, 4, 56)
    s.note(BELL, 74, 52.2, 6, 48)
    s.note(BASS, 38, 52, 8, 54)
    return s


def outloud():
    """Film 3, bright (the Advent bright style): glockenspiel, nylon guitar, a light beat.
    0-4.5 s cello alone; 4.5 s "Together." guitar, glockenspiel and the beat come in;
    6-14 s the etchings; 14 s the inks lift; 16-24 s the app; 24 s "Pull up a chair." a
    cadence; 26 s the end card on D."""
    s = Song()
    CELLO, GLOCK, GTR, STR, BASS = 0, 1, 2, 3, 4
    for ch, prog in [(CELLO, 42), (GLOCK, 9), (GTR, 24), (STR, 48), (BASS, 32)]:
        s.program(ch, prog)
    TUNE = [(66, 1), (69, 1), (71, 1), (69, 1), (66, 2), (64, 2),
            (62, 1), (64, 1), (66, 1), (69, 1), (71, 2), (69, 2),
            (74, 1), (73, 1), (71, 1), (69, 1), (71, 1), (69, 1), (66, 2),
            (62, 1), (64, 1), (66, 1), (64, 1), (62, 4)]
    HARM = [("D", 4), ("G", 2), ("A", 2), ("Bm", 2), ("G", 2), ("D", 2), ("A", 2),
            ("G", 2), ("D", 2), ("Bm", 2), ("A", 2), ("G", 2), ("A", 2), ("D", 4)]
    play(s, CELLO, TUNE, 0, 72, octave=-12, until=9)
    s.chord(STR, [50, 57, 62], 0, 9, 30)

    def strum(start, until, vel):
        at = start
        for name, d in HARM * 2:
            if at >= until:
                return
            notes = CHORDS[name]
            for k in range(d):  # down on the beat, up on the "and"
                if at + k >= until:
                    break
                s.chord(GTR, [notes[0] - 12] + notes, at + k, 0.45, vel, spread=0.015)
                s.chord(GTR, notes, at + k + 0.5, 0.4, vel - 14, spread=0.015)
            s.note(BASS, notes[0] - 24, at, d * 0.9, 56)
            at += d

    play(s, GLOCK, TUNE, 9, 66, octave=12, until=32)
    play(s, CELLO, TUNE, 9, 52, octave=-12, until=32)
    strum(9, 32, 56)
    for b in range(9, 48):  # light beat: soft kick on 1 and 3, shaker on the eighths
        if b % 2 == 1:
            s.note(DRUMS, 36, b, 0.2, 48)
        s.note(DRUMS, 70, b, 0.1, 30)
        s.note(DRUMS, 70, b + 0.5, 0.1, 22)
    s.chord(STR, [55, 59, 62, 67], 28, 2, 60)  # the inks lift
    s.chord(STR, [57, 61, 64, 69], 30, 2, 66)
    play(s, GLOCK, TUNE, 32, 54, octave=12, until=48)
    strum(32, 48, 48)
    s.chord(GTR, [45, 57, 61, 64, 67], 48, 4, 54, spread=0.03)  # "Pull up a chair."
    s.chord(STR, [45, 57, 61, 64], 48, 4, 54)
    s.note(GLOCK, 81, 48, 2, 50)
    s.note(GLOCK, 79, 50, 2, 46)
    s.chord(GTR, [38, 50, 57, 62, 66], 52, 8, 58, spread=0.04)  # end card
    s.chord(STR, [50, 57, 62, 66], 52, 8, 48)
    s.note(GLOCK, 86, 52, 4, 54)
    s.note(CELLO, 38, 52, 8, 56)
    return s


ARRANGEMENTS = {"monologue": monologue, "wholestory": wholestory, "outloud": outloud}


def render(name, out_wav):
    song = ARRANGEMENTS[name]()
    with tempfile.TemporaryDirectory() as tmp:
        mid = os.path.join(tmp, "song.mid")
        raw = os.path.join(tmp, "raw.wav")
        song.save(mid)
        subprocess.run(
            ["fluidsynth", "-ni", "-g", "0.7", "-r", "48000", "-F", raw,
             "-o", "synth.reverb.active=1", "-o", "synth.reverb.room-size=0.8",
             "-o", "synth.reverb.width=0.9", "-o", "synth.reverb.level=0.6",
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
