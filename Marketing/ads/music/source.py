"""
Original scores for the "Back to the source" films, written in code.

  python source.py monologue|wholestory|outloud out.wav

Instruments: the FluidR3 GM soundfont (MIT licence). Film 3 borrows the old
Irish melody SLANE (traditional, public domain). Every track is exactly 30.0 s
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


def monologue():
    """Film 1. Cuts (s): 0, 2, 3.5, 6.5, 8.5, 11.5, 13.5 | silence | 17.5 turn, 20 app, 26 end card."""
    s = Song()
    PIANO, PAD, BASS = 0, 1, 2
    s.program(PIANO, 0)   # acoustic grand, played soft: the "felt piano"
    s.program(PAD, 89)    # warm pad
    s.program(BASS, 32)   # acoustic bass
    s.cc(PIANO, 91, 70, 0)
    s.cc(PAD, 7, 70, 0)

    # Questions and answers, 0-13.5 s (beats 0-27): ostinato over a soft pulse.
    prog = ["Dm", "Dm", "Bb", "Bb", "F", "F", "C", "C"]  # two beats each
    b = 0
    i = 0
    while b < 27:
        name = prog[i % len(prog)]
        notes, root = CH[name]
        for k in range(4):  # four eighths per chord slot (2 beats)
            at = b + k * 0.5
            if at >= 27:
                break
            s.note(PIANO, notes[k % 4], at, 0.45, 46 if k == 0 else 36)
        s.note(BASS, root, b, 1.9, 58)
        if i % 2 == 0:
            s.chord(PAD, [p - 12 for p in notes[:3]], b, 4, 38)
        b += 2
        i += 1
    for at in range(0, 27):  # pulse: a soft kick on every beat, a lighter one on the off-beat late on
        s.note(DRUMS, 36, at, 0.2, 52)
        if at >= 13:
            s.note(DRUMS, 42, at + 0.5, 0.1, 22)
    # Every reply lands with a low octave on the piano.
    for t in [2.0, 6.5, 11.5]:
        s.chord(PIANO, [D2 + 12, D3 + 12], beat(t), 1.5, 64)

    # 13.5-17.5 s: silence for the father's line, one high note on "unbelief".
    s.note(PIANO, A5, beat(16.6), 2.0, 34)

    # 17.5 s: "It was never a monologue." Warm, open chords; the pulse returns with the app at 20 s.
    warm = [("F", 35, 5), ("Bb", 40, 4), ("Dm", 44, 4), ("C", 48, 4)]
    for name, at, dur in warm:
        notes, root = CH[name]
        s.chord(PIANO, notes, at, dur, 52, spread=0.08)
        s.chord(PAD, [p - 12 for p in notes[:3]], at, dur, 44)
        s.note(BASS, root, at, dur, 54)
    for at in range(40, 52):
        s.note(DRUMS, 36, at, 0.2, 40)
    for k in range(24):  # light eighths over the app
        name = ["Bb", "Bb", "Dm", "C"][(k // 8) % 4] if k < 16 else "C"
        s.note(PIANO, CH[name][0][k % 4] + 12, 44 + k * 0.5 - 4, 0.4, 30)
    # 26 s end card: resolve on F, ring out.
    notes, root = CH["F"]
    s.chord(PIANO, notes + [F5], 52, 8, 56, spread=0.06)
    s.chord(PAD, [p - 12 for p in notes[:3]], 52, 8, 46)
    s.note(BASS, root, 52, 8, 56)
    return s


def wholestory():
    """Film 2. 0 verse card (celesta), 2.5 s exiles (drone), 6 question, 8-16 rose fills
    (harp arpeggio, an instrument per division, bell as it closes at 14.7 s), 16 facts,
    20 app, 26 end card."""
    s = Song()
    CEL, DRONE, HARP, STR, CHOIR, PIANO, BELL, BASS = 0, 1, 2, 3, 4, 5, 6, 7
    for ch, prog in [(CEL, 8), (DRONE, 42), (HARP, 46), (STR, 48), (CHOIR, 52), (PIANO, 0), (BELL, 14), (BASS, 32)]:
        s.program(ch, prog)
    D = {"D": [62, 66, 69], "G": [55, 59, 62], "A": [57, 61, 64], "Bm": [59, 62, 66], "Em": [52, 55, 59]}
    # 0-2.5 s: a sweet little tune, like the graphics it imitates.
    for at, p in [(0, 74), (0.5, 78), (1, 81), (1.5, 78), (2, 76), (3, 74), (3.5, 73), (4, 74)]:
        s.note(CEL, p, at, 0.5, 58)
    s.chord(PIANO, D["D"], 0, 4.5, 34)
    # 2.5-8 s: the floor drops: a low drone under the exiles.
    s.note(DRONE, 38, 5, 11, 70)
    s.note(DRONE, 45, 5, 11, 52)
    s.chord(STR, [50, 57, 62], 5, 7, 40)
    s.chord(STR, [50, 55, 59], 12, 4, 44)  # "Do you know the story?" hangs on G/D
    # 8-16 s: the rose fills; harp arpeggio rising, instruments joining.
    prog = [("D", 4), ("Bm", 4), ("G", 4), ("A", 4)]
    at = 16
    for k, (name, dur) in enumerate(prog * 1):
        notes = D[name]
        for i in range(dur * 4):
            p = notes[i % 3] + 12 * (1 + (i // 3) % 2)
            s.note(HARP, p, at + i * 0.25, 0.3, 50 + k * 6)
        s.chord(STR, [n - 12 for n in notes], at, dur, 46 + k * 6)
        s.note(BASS, notes[0] - 24, at, dur, 56)
        if k >= 1:
            s.chord(CHOIR, notes, at, dur, 36 + k * 8)
        at += dur
    s.note(BELL, 74, beat(14.7), 4, 76)
    s.note(BELL, 81, beat(15.2), 4, 60)
    # 16-20 s: the facts, warm and open.
    for name, a, d in [("G", 32, 4), ("D", 36, 4)]:
        s.chord(STR, [n - 12 for n in D[name]], a, d, 58)
        s.chord(CHOIR, D[name], a, d, 44)
        s.chord(PIANO, D[name] + [D[name][0] + 12], a, d, 46, spread=0.1)
        s.note(BASS, D[name][0] - 24, a, d, 58)
    # 20-26 s: Day 1, light piano eighths over strings.
    for k in range(24):
        name = ["D", "Bm", "G", "A"][k // 6]
        s.note(PIANO, D[name][k % 3] + 12, 40 + k * 0.5, 0.45, 40)
        if k % 6 == 0:
            s.chord(STR, [n - 12 for n in D[name]], 40 + k * 0.5, 3, 44)
            s.note(BASS, D[name][0] - 24, 40 + k * 0.5, 3, 52)
    # 26 s: end card resolves on D, bell once more.
    s.chord(PIANO, D["D"] + [74, 78], 52, 8, 52, spread=0.07)
    s.chord(STR, [n - 12 for n in D["D"]], 52, 8, 50)
    s.chord(CHOIR, D["D"], 52, 8, 40)
    s.note(BASS, 38, 52, 8, 54)
    s.note(BELL, 74, 52.2, 6, 50)
    return s


ARRANGEMENTS = {"monologue": monologue, "wholestory": wholestory}


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
