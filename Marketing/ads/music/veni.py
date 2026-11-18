"""
"O come, O come, Emmanuel": original 30-second arrangements for the Advent ads.

Melody: VENI EMMANUEL as published by Thomas Helmore (Hymnal Noted, 1851), from a
15th-century chant: public domain. Instruments: the FluidR3 GM soundfont (MIT
licence). The arrangements are ours, so the music can be used anywhere.

Timed to AdventFamily3DAd (130 bpm, one chant note per beat):
  0.33 s  chime as the first candle lights        beat  1   "O come, O come, Emmanuel"
  5.1 s   "And ransom captive Israel" (the cut)   beat 23   "That mourns in lonely exile here"
  16.2 s  lift                                    beat 39   "Rejoice! Rejoice!" (18.0 s)
  21.7 s  "Emmanuel shall come to thee"; chimes as Peace, Joy and Love light
  28.6 s  "O Israel" resolves on the end card; 30.0 s end

  python veni.py music-box|piano-cello|bright out.wav
Needs: fluidsynth, fluid-soundfont-gm, ffmpeg, and the mido package.
"""
import os
import subprocess
import sys
import tempfile

import mido

BPM = 130
PPQ = 480
SEC_PER_BEAT = 60 / BPM
SF2 = "/usr/share/sounds/sf2/FluidR3_GM.sf2"
LENGTH_S = 30.0

# Pitches (E minor / E Aeolian, with F sharp).
N = {"D4": 62, "E4": 64, "F#4": 66, "G4": 67, "A4": 69, "B4": 71, "C5": 72, "D5": 74}

# The melody, one chant note per beat; numbers are beats held. From Helmore's
# setting: verse lines 1-3, then the refrain.
P1 = [("E4", 1), ("G4", 1), ("B4", 1), ("B4", 1), ("B4", 1), ("A4", 1), ("C5", 1), ("B4", 1), ("A4", 1), ("G4", 1)]
P2 = [("A4", 1), ("B4", 1), ("G4", 1), ("E4", 1), ("G4", 1), ("A4", 1), ("F#4", 1), ("E4", 1), ("D4", 1), ("E4", 3)]
P3 = [("A4", 1), ("A4", 1), ("E4", 1), ("E4", 1), ("F#4", 1), ("G4", 2), ("F#4", 1), ("E4", 1), ("D4", 3)]
REFRAIN = [("D5", 1), ("D5", 2), (None, 1), ("B4", 1), ("B4", 2), (None, 1)]
P6 = [("B4", 1), ("A4", 1), ("C5", 1), ("B4", 1), ("A4", 1), ("G4", 1), ("A4", 1), ("B4", 1), ("G4", 1), ("E4", 1),
      ("G4", 1), ("A4", 1), ("F#4", 1), ("E4", 1), ("D4", 1), ("E4", 3)]

CHORDS = {
    "Em": [52, 55, 59], "G": [55, 59, 62], "D": [50, 54, 57], "C": [48, 52, 55], "Am": [45, 48, 52],
    "E": [52, 56, 59],  # E major: the warm last chord
}
C1 = [("Em", 4), ("G", 1), ("D", 1), ("C", 1), ("Em", 1), ("D", 1), ("G", 1)]
C2 = [("Am", 1), ("G", 1), ("Em", 2), ("C", 1), ("Am", 1), ("D", 1), ("Em", 1), ("D", 1), ("Em", 3)]
C3 = [("Am", 2), ("Em", 2), ("D", 1), ("C", 2), ("D", 1), ("Em", 1), ("D", 3)]
CL = [("Am", 2), ("D", 2)]
CR = [("G", 4), ("Em", 4)]
C6 = [("Em", 1), ("D", 1), ("C", 1), ("G", 1), ("D", 1), ("G", 1), ("Am", 1), ("G", 1), ("Em", 2), ("C", 1),
      ("Am", 1), ("D", 1), ("Em", 1), ("D", 1), ("E", 3)]

# Section starts, in beats.
S1, S2, S3, SL, SR, S6, END = 1, 11, 23, 35, 39, 47, 65


def sec(s):
    return s / SEC_PER_BEAT


# Candle ignitions in the ad, in seconds: Hope (opening), then Peace, Joy, Love.
CANDLES = [0.33, 22.47, 23.27, 24.07]


class Song:
    def __init__(self):
        self.events = []  # (beat, priority, channel, message)

    def program(self, ch, prog, beat=0.0):
        self.events.append((beat, 0, ch, mido.Message("program_change", channel=ch, program=prog)))

    def cc(self, ch, ctrl, value, beat):
        self.events.append((beat, 1, ch, mido.Message("control_change", channel=ch, control=ctrl, value=int(value))))

    def note(self, ch, pitch, beat, dur, vel):
        if pitch is None:
            return
        self.events.append((beat, 2, ch, mido.Message("note_on", channel=ch, note=int(pitch), velocity=int(vel))))
        self.events.append((beat + dur, 1.5, ch, mido.Message("note_off", channel=ch, note=int(pitch), velocity=0)))

    def ramp(self, ch, ctrl, a, b, start, end, steps=24):
        for i in range(steps + 1):
            t = i / steps
            self.cc(ch, ctrl, a + (b - a) * t, start + (end - start) * t)

    def save(self, path):
        mid = mido.MidiFile(ticks_per_beat=PPQ)
        tr = mido.MidiTrack()
        mid.tracks.append(tr)
        tr.append(mido.MetaMessage("set_tempo", tempo=mido.bpm2tempo(BPM), time=0))
        last = 0
        for beat, _, _, msg in sorted(self.events, key=lambda e: (e[0], e[1])):
            tick = int(round(beat * PPQ))
            tr.append(msg.copy(time=tick - last))
            last = tick
        mid.save(path)


def melody(song, ch, phrase, start, vel, octave=0, legato=0.95):
    b = start
    for pitch, dur in phrase:
        song.note(ch, None if pitch is None else N[pitch] + octave, b, dur * legato, vel)
        b += dur
    return b


def chords(song, ch, prog, start, vel, octave=0, roots=False, root_only=False):
    b = start
    for name, dur in prog:
        notes = CHORDS[name]
        if root_only:
            song.note(ch, notes[0] + octave, b, dur * 0.98, vel)
        else:
            for p in notes:
                song.note(ch, p + octave, b, dur * 0.98, vel)
            if roots:
                song.note(ch, notes[0] + octave - 12, b, dur * 0.98, vel)
        b += dur
    return b


def arpeggio(song, ch, prog, start, vel, octave=12, per_beat=2, pattern=(0, 1, 2, 1)):
    b = start
    for name, dur in prog:
        notes = CHORDS[name]
        steps = int(dur * per_beat)
        for i in range(steps):
            p = notes[pattern[i % len(pattern)]] + octave
            song.note(ch, p, b + i / per_beat, 1 / per_beat * 0.9, vel)
        b += dur
    return b


def chimes(song, ch, pitches, vel):
    for t, p in zip(CANDLES, pitches):
        song.note(ch, p, sec(t), 2.5, vel)


# --------------------------------------------------------------------------
# Three arrangements
# --------------------------------------------------------------------------

def music_box():
    """Cosy: music box over soft strings, cello underneath; the felt look in sound."""
    s = Song()
    s.program(0, 10)   # music box: melody
    s.program(1, 49)   # slow strings: pad
    s.program(2, 42)   # cello: roots
    s.program(3, 46)   # harp: movement under the app screens
    s.program(4, 9)    # glockenspiel: candle chimes
    s.program(5, 48)   # strings doubling the refrain
    s.ramp(1, 11, 50, 80, 0, SR)
    s.ramp(1, 11, 80, 110, SR, END)
    melody(s, 0, P1, S1, 92, octave=12)
    melody(s, 0, P2, S2, 92, octave=12)
    melody(s, 0, P3, S3, 82, octave=12)
    melody(s, 0, REFRAIN, SR, 100, octave=12)
    melody(s, 0, P6, S6, 100, octave=12)
    melody(s, 5, REFRAIN, SR, 70)
    melody(s, 5, P6, S6, 74)
    chords(s, 1, C1, S1, 52)
    chords(s, 1, C2, S2, 56)
    chords(s, 1, C3, S3, 56)
    chords(s, 1, CL, SL, 62)
    chords(s, 1, CR, SR, 70)
    chords(s, 1, C6, S6, 72)
    chords(s, 2, C2, S2, 60, octave=-12, root_only=True)
    chords(s, 2, C3, S3, 60, octave=-12, root_only=True)
    chords(s, 2, CL, SL, 66, octave=-12, root_only=True)
    chords(s, 2, CR, SR, 72, octave=-12, root_only=True)
    chords(s, 2, C6, S6, 74, octave=-12, root_only=True)
    arpeggio(s, 3, C3, S3, 48)
    arpeggio(s, 3, CL, SL, 58, per_beat=3)
    chimes(s, 4, [88, 83, 86, 88], 74)  # E7 as Hope lights; then B6, D7, E7
    return s


def piano_cello():
    """Reflective: soft piano carrying the tune, a cello answering, strings at the end."""
    s = Song()
    s.program(0, 0)    # piano: melody (right hand)
    s.program(1, 0)    # piano: left hand
    s.program(2, 42)   # cello: counter-line
    s.program(3, 49)   # slow strings: arrive for the refrain
    s.program(4, 8)    # celesta: candle chimes
    s.ramp(3, 11, 0, 100, SL, SR + 2)
    melody(s, 0, P1, S1, 70, octave=12)
    melody(s, 0, P2, S2, 74, octave=12)
    melody(s, 0, P3, S3, 64, octave=12)
    melody(s, 0, REFRAIN, SR, 84, octave=12)
    melody(s, 0, P6, S6, 84, octave=12)
    arpeggio(s, 1, C1, S1, 46, octave=0, per_beat=2, pattern=(0, 2))
    arpeggio(s, 1, C2, S2, 50, octave=0, per_beat=2, pattern=(0, 2))
    arpeggio(s, 1, C3, S3, 46, octave=0, per_beat=2, pattern=(0, 1, 2, 1))
    arpeggio(s, 1, CL, SL, 52, octave=0, per_beat=2, pattern=(0, 1, 2, 1))
    arpeggio(s, 1, CR, SR, 56, octave=0, per_beat=2, pattern=(0, 1, 2, 1))
    arpeggio(s, 1, C6, S6, 58, octave=0, per_beat=2, pattern=(0, 2))
    # Cello: the tune an octave down from the second line, then roots.
    melody(s, 2, P2, S2, 66, octave=-12)
    chords(s, 2, C3, S3, 62, octave=-12, root_only=True)
    chords(s, 2, CL, SL, 70, octave=-12, root_only=True)
    melody(s, 2, REFRAIN, SR, 78, octave=-12)
    chords(s, 2, C6, S6, 76, octave=-12, root_only=True)
    chords(s, 3, CL, SL, 60)
    chords(s, 3, CR, SR, 66)
    chords(s, 3, C6, S6, 70)
    chimes(s, 4, [88, 83, 86, 88], 56)
    return s


def bright():
    """Feed-friendly: plucked and bright, a light groove that drops in at the cut."""
    s = Song()
    s.program(0, 9)    # glockenspiel: melody
    s.program(1, 24)   # nylon guitar: strummed chords
    s.program(2, 45)   # pizzicato strings: eighths
    s.program(3, 33)   # finger bass
    s.program(4, 14)   # tubular bells: candles
    s.program(5, 48)   # strings: lift and refrain
    s.program(6, 8)    # celesta doubling
    melody(s, 0, P1, S1, 88, octave=12, legato=0.8)
    melody(s, 6, P1, S1, 60, octave=12, legato=0.8)
    melody(s, 0, P2, S2, 92, octave=12, legato=0.8)
    melody(s, 1, P3, S3, 84, octave=0, legato=0.85)   # guitar takes the tune under the app
    melody(s, 0, REFRAIN, SR, 100, octave=12, legato=0.85)
    melody(s, 0, P6, S6, 100, octave=12, legato=0.85)
    melody(s, 6, REFRAIN, SR, 70, octave=12, legato=0.85)
    melody(s, 6, P6, S6, 70, octave=12, legato=0.85)
    # Guitar strums on every beat.
    for prog, start in ((C1, S1), (C2, S2), (C3, S3), (CL, SL), (CR, SR), (C6, S6)):
        b = start
        for name, dur in prog:
            for k in range(int(dur)):
                for i, p in enumerate(CHORDS[name]):
                    s.note(1, p, b + k + i * 0.02, 0.8, 54 if start < S2 else 62)
            b += dur
    # From the cut: pizzicato eighths, bass and a soft groove.
    arpeggio(s, 2, C2, S2, 58, octave=12, per_beat=2)
    arpeggio(s, 2, C3, S3, 54, octave=12, per_beat=2)
    arpeggio(s, 2, CL, SL, 64, octave=12, per_beat=4)
    arpeggio(s, 2, CR, SR, 66, octave=12, per_beat=2)
    arpeggio(s, 2, C6, S6, 66, octave=12, per_beat=2)
    for prog, start in ((C2, S2), (C3, S3), (CL, SL), (CR, SR), (C6, S6)):
        chords(s, 3, prog, start, 84, octave=-12, root_only=True)
    for b in range(S2, END - 3):
        in_lift = SL <= b < SR
        if b % 2 == 1 and not in_lift:
            s.note(9, 36, b, 0.4, 76)            # kick
        if b % 2 == 0 and not in_lift:
            s.note(9, 39, b, 0.4, 58)            # clap
        s.note(9, 70, b + 0.5, 0.2, 40)          # maracas on the off-beat
        if in_lift:
            s.note(9, [45, 47, 48, 50][b - SL], b, 0.5, 70 + (b - SL) * 8)  # toms rising
    s.note(9, 49, SR, 2, 70)                      # crash into the refrain
    s.ramp(5, 11, 30, 110, SL, SR)
    chords(s, 5, CL, SL, 70)
    chords(s, 5, CR, SR, 64)
    chords(s, 5, C6, S6, 66)
    chimes(s, 4, [76, 71, 74, 76], 78)
    return s


ARRANGEMENTS = {"music-box": music_box, "piano-cello": piano_cello, "bright": bright}


def render(name, out_wav):
    song = ARRANGEMENTS[name]()
    with tempfile.TemporaryDirectory() as tmp:
        mid = os.path.join(tmp, "song.mid")
        raw = os.path.join(tmp, "raw.wav")
        song.save(mid)
        subprocess.run(
            ["fluidsynth", "-ni", "-g", "0.7", "-r", "48000", "-F", raw,
             "-o", "synth.reverb.active=1", "-o", "synth.reverb.room-size=0.75",
             "-o", "synth.reverb.width=0.9", "-o", "synth.reverb.level=0.55",
             "-o", "synth.chorus.active=0", SF2, mid],
            check=True, capture_output=True)
        # Exactly 30 s, a short fade at the very end, social loudness (-14 LUFS).
        subprocess.run(
            ["ffmpeg", "-y", "-loglevel", "error", "-i", raw, "-t", f"{LENGTH_S}",
             "-af", f"afade=t=out:st={LENGTH_S - 0.6}:d=0.6,loudnorm=I=-14:TP=-1.5:LRA=11",
             "-ar", "48000", "-ac", "2", out_wav],
            check=True)
    print("wrote", out_wav)


if __name__ == "__main__":
    render(sys.argv[1], sys.argv[2])
