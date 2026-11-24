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


ARRANGEMENTS = {"dark": dark}


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
