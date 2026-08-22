#!/usr/bin/env python3
"""Impose an A5 portrait PDF onto A4 landscape sheets for saddle-stitch printing.

Reads a sequential A5 booklet PDF (pages 1..N) and writes a new PDF where each
page is one side of one physical A4 sheet. Print the output double-sided with
**Flip on short edge**, fold the stack in half along the vertical centre, and
staple through the spine.

No printer "booklet" preset is required — the page order and left/right pairing
are already correct.

Usage:
  print/.venv/bin/python print/impose-a5-booklet.py input.pdf [output.pdf]
  print/.venv/bin/python print/impose-a5-booklet.py input.pdf --margin-mm 3
  print/.venv/bin/python print/impose-a5-booklet.py input.pdf --rotate-backs

If output is omitted, writes alongside the input as:
  <stem>-a4-print.pdf
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from pypdf import PageObject, PdfReader, PdfWriter, Transformation
from pypdf.generic import NameObject, RectangleObject

# ISO A4 landscape (pt). Two A5 portraits sit on this exactly.
A4_LANDSCAPE_W = 841.89
A4_LANDSCAPE_H = 595.28
MM = 72 / 25.4
# Chrome print-to-PDF leaves ~1pt unpainted on the right of each A5 page.
# Overfill the slot so that strip is clipped at the paper edge or covered
# at the fold by the facing page.
OVERFILL_PT = 2.5


def saddle_stitch_pairs(page_count: int) -> list[tuple[tuple[int, int], tuple[int, int]]]:
    """Return (front_left, front_right), (back_left, back_right) using 1-based page numbers.

    Numbers above the real page count mean a blank filler page.
    """
    if page_count % 4 != 0:
        raise ValueError(f"Page count must be a multiple of 4 (got {page_count})")

    pairs: list[tuple[tuple[int, int], tuple[int, int]]] = []
    for i in range(page_count // 4):
        front = (page_count - 2 * i, 1 + 2 * i)
        back = (2 + 2 * i, page_count - 1 - 2 * i)
        pairs.append((front, back))
    return pairs


def fit_page(
    sheet: PageObject,
    src: PageObject,
    slot_x: float,
    slot_y: float,
    slot_w: float,
    slot_h: float,
) -> None:
    """Map a source page onto a slot. Stretch is <0.3% (Chrome A5 vs ISO A4)."""
    box = src.mediabox
    src_w = float(box.width)
    src_h = float(box.height)
    sx = slot_w / src_w
    sy = slot_h / src_h
    tx = slot_x - float(box.left) * sx
    ty = slot_y - float(box.bottom) * sy
    sheet.merge_transformed_page(
        src,
        Transformation().scale(sx=sx, sy=sy).translate(tx=tx, ty=ty),
    )


def add_spread(
    writer: PdfWriter,
    source_pages: list[PageObject],
    real_count: int,
    left_1based: int,
    right_1based: int,
    margin_pt: float,
) -> None:
    sheet = writer.add_blank_page(width=A4_LANDSCAPE_W, height=A4_LANDSCAPE_H)
    half = A4_LANDSCAPE_W / 2
    slot_h = A4_LANDSCAPE_H - 2 * margin_pt + 2 * OVERFILL_PT
    slot_y = margin_pt - OVERFILL_PT
    slot_w = half - margin_pt + 2 * OVERFILL_PT

    if 1 <= left_1based <= real_count:
        fit_page(
            sheet, source_pages[left_1based - 1],
            margin_pt - OVERFILL_PT, slot_y, slot_w, slot_h,
        )
    if 1 <= right_1based <= real_count:
        fit_page(
            sheet, source_pages[right_1based - 1],
            half - OVERFILL_PT, slot_y, slot_w, slot_h,
        )

    box = RectangleObject([0, 0, A4_LANDSCAPE_W, A4_LANDSCAPE_H])
    sheet.mediabox = box
    sheet.cropbox = box
    sheet.trimbox = box


def impose(
    input_path: Path,
    output_path: Path,
    margin_mm: float = 0.0,
    rotate_backs: bool = False,
) -> tuple[int, int, int]:
    reader = PdfReader(str(input_path))
    source_pages = list(reader.pages)
    real_count = len(source_pages)
    if real_count == 0:
        raise ValueError("Input PDF has no pages")

    padded = real_count if real_count % 4 == 0 else real_count + (4 - real_count % 4)
    pairs = saddle_stitch_pairs(padded)
    margin_pt = margin_mm * MM

    writer = PdfWriter()
    if reader.metadata:
        writer.add_metadata({
            k: v for k, v in reader.metadata.items()
            if k in ("/Title", "/Author", "/Subject") and v
        })
    writer.add_metadata({
        "/Producer": "impose-a5-booklet.py",
    })

    for sheet_i, ((fl, fr), (bl, br)) in enumerate(pairs):
        add_spread(writer, source_pages, real_count, fl, fr, margin_pt)
        add_spread(writer, source_pages, real_count, bl, br, margin_pt)
        if rotate_backs:
            writer.pages[sheet_i * 2 + 1].rotate(180)

    vp = writer.create_viewer_preferences()
    vp.print_scaling = NameObject("/None")
    vp.duplex = NameObject(
        "/DuplexFlipLongEdge" if rotate_backs else "/DuplexFlipShortEdge"
    )
    vp.pick_tray_by_pdfsize = True

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("wb") as fh:
        writer.write(fh)

    return real_count, padded, padded // 4


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(
        description="Impose an A5 PDF onto A4 landscape sheets for fold-and-staple printing.",
    )
    parser.add_argument("input", type=Path, help="Sequential A5 portrait PDF")
    parser.add_argument("output", nargs="?", type=Path, help="Output PDF (default: <stem>-a4-print.pdf)")
    parser.add_argument(
        "--margin-mm",
        type=float,
        default=0.0,
        help="Even inset from the A4 paper edge in mm (default 0: fill the sheet). "
             "Try 3 if your printer clips the covers.",
    )
    parser.add_argument(
        "--rotate-backs",
        action="store_true",
        help="Rotate even pages 180°. Use this if backs come out upside-down "
             "and your printer only offers long-edge duplex.",
    )
    args = parser.parse_args(argv[1:])

    input_path = args.input.expanduser().resolve()
    if not input_path.is_file():
        print(f"Input not found: {input_path}", file=sys.stderr)
        return 1

    output_path = (
        args.output.expanduser().resolve()
        if args.output
        else input_path.with_name(f"{input_path.stem}-a4-print.pdf")
    )

    real_count, padded, sheets = impose(
        input_path,
        output_path,
        margin_mm=args.margin_mm,
        rotate_backs=args.rotate_backs,
    )

    extra = padded - real_count
    print(f"Input:  {real_count} A5 pages" + (f" (padded {extra} blank to {padded})" if extra else ""))
    print(f"Output: {sheets * 2} A4 landscape sides ({sheets} sheets, print duplex)")
    if args.margin_mm:
        print(f"Inset:  {args.margin_mm:g} mm from each A4 edge")
    print(f"Wrote:  {output_path}")
    print()
    print("Print settings:")
    print("  - Paper: A4")
    print("  - Two-sided: ON")
    if args.rotate_backs:
        print("  - Flip on LONG edge")
    else:
        print("  - Flip on SHORT edge  (if backs are upside-down, re-run with --rotate-backs)")
    print("  - Scale: 100% / Actual size (turn off 'Fit to page' / 'Scale to fit')")
    print("  - Layout: Landscape, or 'Auto' — the PDF is already landscape A4")
    print("Then keep the sheets in order, fold the stack in half, staple the spine twice.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
